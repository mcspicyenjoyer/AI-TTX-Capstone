import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { fromBuffer, type Entry } from 'yauzl';
import type { SourceUnit, UploadSource } from '../contracts/intake.js';

export const MAX_FILE_BYTES = 4 * 1024 * 1024;
type Ordered = { [key: string]: unknown; ':@'?: Record<string, string> };
const children = (node: Ordered, tag: string): Ordered[] =>
  Array.isArray(node[tag]) ? (node[tag] as Ordered[]) : [];
const tagOf = (node: Ordered) => Object.keys(node).find((key) => key !== ':@') ?? '';
const plain = (value: string) =>
  value
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();

function xml(value: string, svg = false): Ordered[] {
  // Only draw.io's fixed, non-resolved SVG declaration is allowed. No custom entities or DTDs.
  if (svg)
    value = value.replace(
      /<!DOCTYPE svg PUBLIC "-\/\/W3C\/\/DTD SVG 1\.1\/\/EN" "https?:\/\/www\.w3\.org\/Graphics\/SVG\/1\.1\/DTD\/svg11\.dtd">/,
      '',
    );
  if (/<!DOCTYPE|<!ENTITY/i.test(value))
    throw new Error('DTD and entity declarations are unsupported.');
  if (XMLValidator.validate(value) !== true) throw new Error('Malformed XML.');
  return new XMLParser({
    preserveOrder: true,
    ignoreAttributes: false,
    attributeNamePrefix: '',
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: false,
    processEntities: true,
  }).parse(value) as Ordered[];
}
function visit(
  nodes: Ordered[],
  fn: (tag: string, node: Ordered, parent?: Ordered) => void,
  parent?: Ordered,
  depth = 0,
): void {
  if (depth > 80) throw new Error('Document nesting exceeds the supported limit.');
  for (const node of nodes) {
    const tag = tagOf(node);
    fn(tag, node, parent);
    visit(children(node, tag), fn, node, depth + 1);
  }
}
function textOf(nodes: Ordered[]): string {
  let text = '';
  visit(nodes, (tag, node) => {
    if (tag === '#text') text += String(node[tag]);
    if (tag === 'w:p') text += '\n';
    if (tag === 'w:tab' || tag === 'w:br') text += ' ';
  });
  return text.trim();
}
function bounded(units: SourceUnit[]): SourceUnit[] {
  if (new Set(units.map((unit) => unit.locator)).size !== units.length)
    throw new Error('Source locators must be unique.');
  if (units.length === 0)
    throw new Error(
      'No supported text was found. Image-only documents need a reviewed vision or guided-input path.',
    );
  if (units.length > 400 || units.reduce((sum, unit) => sum + unit.text.length, 0) > 150_000)
    throw new Error('Extracted source exceeds the text limit.');
  if (units.some((unit) => unit.locator.length > 240 || unit.text.length > 4000))
    throw new Error(
      'A source section exceeds the supported length. Split the source into smaller sections.',
    );
  return units;
}

function drawio(bytes: Buffer, format: string): { units: SourceUnit[]; warnings: string[] } {
  let nodes = xml(new TextDecoder('utf-8', { fatal: true }).decode(bytes), format === 'drawio-svg');
  if (format === 'drawio-svg') {
    const wrapper = nodes.find((node) => tagOf(node) === 'svg');
    const embedded = wrapper?.[':@']?.content;
    if (!embedded)
      throw new Error('SVG must contain editable draw.io XML; an ordinary SVG is unsupported.');
    nodes = xml(embedded);
  }
  const pages: { name: string; nodes: Ordered[] }[] = [];
  visit(nodes, (tag, node) => {
    if (tag === 'diagram') {
      const pageNodes = children(node, tag);
      if (!pageNodes.some((child) => tagOf(child) === 'mxGraphModel'))
        throw new Error('Compressed draw.io pages are unsupported. Export uncompressed XML.');
      pages.push({ name: node[':@']?.id ?? String(pages.length + 1), nodes: pageNodes });
    }
  });
  if (!pages.length && nodes.some((node) => tagOf(node) === 'mxGraphModel'))
    pages.push({ name: '1', nodes });
  if (!pages.length || pages.length > 10)
    throw new Error('Expected one to ten editable draw.io pages.');
  const units: SourceUnit[] = [];
  for (const page of pages) {
    const ids = new Set<string>();
    visit(page.nodes, (tag, node, parent) => {
      if (tag !== 'mxCell') return;
      const a = node[':@'] ?? {};
      const owner =
        parent && ['object', 'UserObject'].includes(tagOf(parent)) ? (parent[':@'] ?? {}) : {};
      const id = owner.id ?? a.id;
      if (!id || (!a.vertex && !a.edge)) return;
      if (ids.has(id)) throw new Error('Duplicate draw.io cell identifiers.');
      ids.add(id);
      const label = plain(owner.label ?? a.value ?? '');
      const tooltip = plain(owner.tooltip ?? a.tooltip ?? '');
      const details = [label, tooltip && `Metadata: ${tooltip}`].filter(Boolean).join('\n');
      if (!details && !a.edge) return;
      const unit: SourceUnit = {
        id: `unit-${units.length + 1}`,
        locator: `page ${page.name}; cell ${id}`,
        text: details || `Unlabelled diagram link ${a.source ?? '?'} -> ${a.target ?? '?'}`,
        kind: a.edge === '1' ? 'edge' : 'node',
        nodeId: `${page.name}:${id}`,
      };
      if (a.source) unit.from = `${page.name}:${a.source}`;
      if (a.target) unit.to = `${page.name}:${a.target}`;
      units.push(unit);
    });
  }
  return {
    units: bounded(units),
    warnings: [
      'Drawing text, hidden metadata and explicit connector endpoints are retained. Diagram links are not proof of network access, firewall rules or exploitable reachability.',
      'Native shape classification and relationship meaning require reviewer correction; decorative shapes may be rejected.',
    ],
  };
}

async function docx(bytes: Buffer): Promise<{ units: SourceUnit[]; warnings: string[] }> {
  const document = await new Promise<Buffer>((resolve, reject) => {
    fromBuffer(
      bytes,
      { lazyEntries: true, validateEntrySizes: true, strictFileNames: true },
      (error, zip) => {
        if (error || !zip) {
          reject(new Error('Invalid DOCX archive.'));
          return;
        }
        let count = 0;
        let total = 0;
        let main: Buffer | null = null;
        let failed = false;
        const fail = () => {
          if (failed) return;
          failed = true;
          zip.close();
          reject(
            new Error('DOCX archive is malformed, encrypted or exceeds the supported limits.'),
          );
        };
        zip.on('error', fail);
        zip.on('end', () => {
          if (!failed) {
            if (main) resolve(main);
            else reject(new Error('Missing DOCX main document.'));
          }
        });
        zip.on('entry', (entry: Entry) => {
          if (failed) return;
          count++;
          total += entry.uncompressedSize;
          if (
            count > 500 ||
            total > 32 * 1024 * 1024 ||
            entry.isEncrypted() ||
            /vbaProject\.bin$/i.test(entry.fileName)
          ) {
            fail();
            return;
          }
          if (entry.fileName !== 'word/document.xml') {
            zip.readEntry();
            return;
          }
          if (main || entry.uncompressedSize > MAX_FILE_BYTES) {
            fail();
            return;
          }
          zip.openReadStream(entry, (streamError, stream) => {
            if (streamError || !stream) {
              fail();
              return;
            }
            const chunks: Buffer[] = [];
            let size = 0;
            stream.on('error', fail);
            stream.on('data', (chunk: Buffer) => {
              size += chunk.length;
              if (size > MAX_FILE_BYTES) {
                stream.destroy();
                fail();
              } else chunks.push(chunk);
            });
            stream.on('end', () => {
              if (!failed) {
                main = Buffer.concat(chunks);
                zip.readEntry();
              }
            });
          });
        });
        zip.readEntry();
      },
    );
  });
  const nodes = xml(new TextDecoder('utf-8', { fatal: true }).decode(document));
  const units: SourceUnit[] = [];
  let body: Ordered[] | undefined;
  visit(nodes, (tag, node) => {
    if (['w:ins', 'w:del', 'w:moveFrom', 'w:moveTo', 'w:altChunk'].includes(tag))
      throw new Error(
        'Resolve tracked changes and embedded alternative content before importing DOCX.',
      );
    if (tag === 'w:body') body = children(node, tag);
  });
  if (!body) throw new Error('Unsupported DOCX body.');
  let paragraph = 0;
  let table = 0;
  const add = (locator: string, text: string) => {
    if (text) units.push({ id: `unit-${units.length + 1}`, locator, text, kind: 'text' });
  };
  for (const node of body) {
    const tag = tagOf(node);
    if (tag === 'w:p')
      add(`word/document.xml; paragraph ${++paragraph}`, textOf(children(node, tag)));
    if (tag === 'w:tbl') {
      table++;
      let row = 0;
      for (const tr of children(node, tag).filter((item) => tagOf(item) === 'w:tr')) {
        const cells = children(tr, 'w:tr')
          .filter((item) => tagOf(item) === 'w:tc')
          .map((cell) => textOf(children(cell, 'w:tc')));
        add(`word/document.xml; table ${table}; row ${++row}`, cells.join(' | '));
      }
    }
  }
  return {
    units: bounded(units),
    warnings: [
      'DOCX main-body paragraphs and table rows only. Headers, footers, comments, revisions, embedded images and linked resources are not interpreted. Verify table meaning against the original document.',
    ],
  };
}

async function pdf(bytes: Buffer): Promise<{ units: SourceUnit[]; warnings: string[] }> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = getDocument({
    data: new Uint8Array(bytes),
    disableFontFace: true,
    useSystemFonts: false,
    useWorkerFetch: false,
    disableAutoFetch: true,
    stopAtErrors: true,
    verbosity: 0,
  });
  try {
    const document = await task.promise;
    if (document.numPages > 30) throw new Error('PDF exceeds the 30-page limit.');
    const units: SourceUnit[] = [];
    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ('str' in item ? `${item.str}${item.hasEOL ? '\n' : ' '}` : ''))
        .join('')
        .trim();
      for (let offset = 0; offset < text.length; offset += 3500)
        units.push({
          id: `unit-${units.length + 1}`,
          locator: `page ${number}; text segment ${Math.floor(offset / 3500) + 1}`,
          text: text.slice(offset, offset + 3500),
          kind: 'text',
        });
      page.cleanup();
    }
    return {
      units: bounded(units),
      warnings: [
        'PDF text order is not a guarantee of visual table layout. Images, annotations, attachments and document actions are not interpreted.',
      ],
    };
  } finally {
    await task.destroy();
  }
}

export async function parseSource(
  input: Pick<UploadSource, 'format' | 'content'>,
): Promise<{ units: SourceUnit[]; warnings: string[] }> {
  if (input.format === 'guided') {
    if (input.content.length > 20_000)
      throw new Error('Guided evidence exceeds 20,000 characters.');
    const units: SourceUnit[] = [];
    for (let offset = 0; offset < input.content.length; offset += 3500) {
      const text = input.content.slice(offset, offset + 3500).trim();
      if (text)
        units.push({
          id: `unit-${units.length + 1}`,
          locator: `guided statement ${units.length + 1}`,
          text,
          kind: 'text',
        });
    }
    return {
      units: bounded(units),
      warnings: ['Reviewer-supplied synthetic evidence, not independently verified capability.'],
    };
  }
  if (input.content.length > Math.ceil(MAX_FILE_BYTES / 3) * 4)
    throw new Error('File exceeds the 4 MiB limit.');
  const bytes = Buffer.from(input.content, 'base64');
  if (!bytes.length || bytes.length > MAX_FILE_BYTES || bytes.toString('base64') !== input.content)
    throw new Error('File exceeds the 4 MiB limit or has invalid encoding.');
  if (input.format === 'drawio' || input.format === 'drawio-svg')
    return drawio(bytes, input.format);
  if (input.format === 'docx') return docx(bytes);
  if (input.format === 'pdf') return pdf(bytes);
  if (input.format === 'text') {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if ([...text].some((char) => char.charCodeAt(0) < 32 && !['\t', '\r', '\n'].includes(char)))
      throw new Error('Unsupported control characters in text source.');
    const units: SourceUnit[] = [];
    text.split(/\r?\n/).forEach((line, index) => {
      if (line.trim())
        units.push({
          id: `unit-${index + 1}`,
          locator: `line ${index + 1}`,
          text: line.trim(),
          kind: 'text',
        });
    });
    return {
      units: bounded(units),
      warnings: [
        'UTF-8 text only; Markdown is not rendered and links or embedded instructions are never executed.',
      ],
    };
  }
  throw new Error('Unsupported format.');
}
