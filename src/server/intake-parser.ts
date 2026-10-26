import { Worker } from 'node:worker_threads';
import type { UploadSource } from '../contracts/intake.js';
import type { parseSource } from './intake-parsers.js';
import { AppError } from './errors.js';

export async function parseInWorker(
  input: UploadSource,
): Promise<Awaited<ReturnType<typeof parseSource>>> {
  const extension = import.meta.url.endsWith('.ts') ? '.ts' : '.js';
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL(`./intake-parser-worker${extension}`, import.meta.url), {
      workerData: { format: input.format, content: input.content },
      resourceLimits: { maxOldGenerationSizeMb: 128, stackSizeMb: 4 },
    });
    let settled = false;
    const finish = (error: AppError | null, result?: Awaited<ReturnType<typeof parseSource>>) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void worker.terminate();
      if (error) reject(error);
      else resolve(result!);
    };
    const timer = setTimeout(
      () =>
        finish(
          new AppError(
            400,
            'SOURCE_TIMEOUT',
            'Source parsing exceeded ten seconds. No source was saved.',
          ),
        ),
      10_000,
    );
    worker.once('error', () =>
      finish(new AppError(400, 'INVALID_SOURCE', 'Source parsing failed. No source was saved.')),
    );
    worker.once('exit', () => {
      if (!settled)
        finish(new AppError(400, 'INVALID_SOURCE', 'Source parsing stopped without a result.'));
    });
    worker.once(
      'message',
      (message: { result?: Awaited<ReturnType<typeof parseSource>>; error?: string }) => {
        finish(
          message.result
            ? null
            : new AppError(400, 'INVALID_SOURCE', message.error ?? 'Invalid source.'),
          message.result,
        );
      },
    );
  });
}
