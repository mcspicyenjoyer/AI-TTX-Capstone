import { parentPort, workerData } from 'node:worker_threads';
import { parseSource } from './intake-parsers.js';
import type { UploadSource } from '../contracts/intake.js';

try {
  const result = await parseSource(workerData as UploadSource);
  parentPort?.postMessage({ result });
} catch {
  parentPort?.postMessage({
    error:
      'The source could not be parsed within the supported format and limits. Check its format, size and selectable text; no source was saved.',
  });
}
