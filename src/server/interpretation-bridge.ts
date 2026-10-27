import { createInterface } from 'node:readline';
import { join } from 'node:path';
import { Type } from '@sinclair/typebox';
import { IdSchema } from '../contracts/profile.js';
import {
  InterpretationResponseSchema,
  EvaluationCaseIdSchema,
} from '../contracts/interpretation.js';
import { Store } from './storage.js';
import { InterpretationService } from './interpretation-service.js';
import { readConfig } from './config.js';
import { readStored } from './validation.js';
import { ExerciseService } from './exercise-service.js';
import { OutcomeService } from './outcome-service.js';
import { fingerprint } from './integrity.js';

const config = readConfig();
if (!config.subscriptionEnabled) throw new Error('Subscription interpretation is disabled.');
const store = new Store(join(config.dataDirectory, 'ttx.sqlite'));
const service = new InterpretationService(store, true);
const EvaluationSchema = Type.Object(
  {
    commandId: IdSchema,
    runId: IdSchema,
    releaseId: IdSchema,
    caseId: EvaluationCaseIdSchema,
    purpose: Type.Union([Type.Literal('development'), Type.Literal('holdout')]),
    response: InterpretationResponseSchema,
  },
  { additionalProperties: false },
);
const RunSchema = Type.Object({ runId: IdSchema }, { additionalProperties: false });
const RunRequestSchema = Type.Object(
  { runId: IdSchema, releaseId: IdSchema, commandId: IdSchema },
  { additionalProperties: false },
);
function facilitator(runId: string) {
  const member = store.exercises.members(runId).find((item) => item.kind === 'facilitator');
  const actor = member && store.actor(member.actorId);
  if (!actor) throw new Error('Facilitator unavailable.');
  return actor;
}
// The operator-only path queues synthetic evaluation inputs without editing team responses.
const lines = createInterface({ input: process.stdin });
let bytes = 0;
process.stdin.on('data', (chunk: Buffer) => {
  bytes += chunk.length;
  if (bytes > 750_000) process.exit(1);
});
try {
  for await (const line of lines) {
    bytes = 0;
    try {
      if (Buffer.byteLength(line) > 700_000) throw new Error('Input too large.');
      const request = JSON.parse(line);
      let result: unknown;
      if (request.method === 'claim' && Object.keys(request).length === 1) result = service.claim();
      else if (request.method === 'complete' && Object.keys(request).length === 2)
        result = service.complete(request.value);
      else if (request.method === 'evaluate' && Object.keys(request).length === 2) {
        const input = readStored(EvaluationSchema, request.value);
        const member = store.exercises
          .members(input.runId)
          .find((item) => item.kind === 'facilitator');
        const actor = member && store.actor(member.actorId);
        const response = store.outcomes.responses(input.releaseId).at(-1);
        if (!actor || !response) throw new Error('Evaluation context unavailable.');
        result = service.request(
          actor,
          input.runId,
          {
            commandId: input.commandId,
            releaseId: input.releaseId,
            responseId: response.id,
            mode: 'ai',
          },
          { purpose: input.purpose, caseId: input.caseId, response: input.response },
        );
      } else if (request.method === 'context' && Object.keys(request).length === 2) {
        const { runId } = readStored(RunSchema, request.value);
        const actor = facilitator(runId),
          exercises = new ExerciseService(store);
        const context = exercises.context(actor, 'technical', runId, true);
        const outcomes = new OutcomeService(store, exercises).review(actor, 'technical', runId);
        result = {
          runId,
          packageId: context.run.packageId,
          packageRevisionId: context.run.packageRevisionId,
          packageHash: context.hash,
          state: context.run.state,
          recordHash: fingerprint({
            run: context.run,
            releases: store.exercises.releases(runId),
            outcomes,
            activity: store.exercises.activity(runId),
          }),
          positions: outcomes.positions.map((position) => ({
            position: position.position,
            releaseId: position.releaseId,
            responseId: position.response?.id ?? null,
          })),
          attempts: store.interpretations.list().filter((item) => item.startedAt).length,
        };
      } else if (request.method === 'request' && Object.keys(request).length === 2) {
        const input = readStored(RunRequestSchema, request.value);
        const response = store.outcomes.responses(input.releaseId).at(-1);
        if (!response) throw new Error('No team response.');
        result = service.request(facilitator(input.runId), input.runId, {
          commandId: input.commandId,
          releaseId: input.releaseId,
          responseId: response.id,
          mode: 'ai',
        });
      } else if (
        request.method === 'get' &&
        Object.keys(request).length === 2 &&
        typeof request.id === 'string'
      ) {
        const record = store.interpretations.get(request.id)?.record;
        if (!record) throw new Error('Unknown interpretation.');
        result = service.get(store.actor(record.ownerId)!, record.runId, record.id);
      } else throw new Error('Unknown operation.');
      process.stdout.write(JSON.stringify({ result }) + '\n');
    } catch {
      process.stdout.write(JSON.stringify({ error: 'Worker operation rejected.' }) + '\n');
    }
  }
} finally {
  store.close();
}
