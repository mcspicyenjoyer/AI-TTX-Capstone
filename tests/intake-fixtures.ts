// Minimal synthetic inputs. These are known-answer parser fixtures, not model outputs.
export const diagram = `<mxfile><diagram id="network"><mxGraphModel><root>
<mxCell id="0"/><mxCell id="1" parent="0"/>
<object id="server_a" label="File server" tooltip="MFA is unknown; do not infer a successful restore."><mxCell vertex="1" parent="1"/></object>
<mxCell id="cloud_b" value="Cloud backup" vertex="1" parent="1"/>
<mxCell id="link_c" value="Nightly backup" edge="1" source="server_a" target="cloud_b" parent="1"/>
</root></mxGraphModel></diagram></mxfile>`;

export const docxBase64 =
  'UEsDBBQAAAAIADRVWl0oJON1zwAAAF0BAAARAAAAd29yZC9kb2N1bWVudC54bWxsUF1OwzAMvkq0AzQDIR5C6QM7wKrBBdrEbS0lduSkdL09SgZCgr18n2T5+7HbzTi2awDK6ho8JbO9Hpaco9E62QXCkBqOQNfgJ5Yw5NSwzHpjcVHYQkpIc/D68Xh81mFAOnTtZkZ2e+FYQArk7n2nvEBGq95OfaN64cgJnAKakQAEaVaXj7NRT2rhVVLT6iIrKBWrWR59pZup/Rty6c93ZGVSV/8LHmrYi5pgSDiix7yrlT5BcEJw9zp8mxW6zWol/XO0/n1o9wUAAP//AwBQSwECFAAUAAAACAA0VVpdKCTjdc8AAABdAQAAEQAAAAAAAAAAAAAAAAAAAAAAd29yZC9kb2N1bWVudC54bWxQSwUGAAAAAAEAAQA/AAAA/gAAAAAA';

export function pdfFixture(
  text = 'Synthetic BCP. Proposed RTO 4 hours; capability unknown.',
): Buffer {
  const stream = `BT /F1 12 Tf 50 700 Td (${text}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}
