import type { FastifyInstance } from 'fastify';
import { Type, type TSchema, type Static } from '@sinclair/typebox';
import { IdSchema, type Actor } from '../contracts/profile.js';
import { TrackSchema, type Track } from '../contracts/exercise.js';
import {
  ResponseRequestSchema,
  ResponseViewSchema,
  DispositionRequestSchema,
  DispositionSchema,
  ClosureRequestSchema,
  ClosureSchema,
  CompletionRequestSchema,
  CompletionSchema,
  TeamOutcomesSchema,
  OutcomeReviewSchema,
} from '../contracts/outcomes.js';
import type { Sessions } from './access.js';
import type { OutcomeService } from './outcome-service.js';

type Path = { track: Track; runId: string };
const params = Type.Object(
  { track: TrackSchema, runId: IdSchema },
  { additionalProperties: false },
);
const root = '/api/tracks/:track/runs/:runId';

export function registerOutcomeRoutes(
  app: FastifyInstance,
  sessions: Sessions,
  service: OutcomeService,
  errors: Record<number, TSchema>,
): void {
  app.get<{ Params: Path }>(
    `${root}/outcomes`,
    { schema: { params, response: { 200: OutcomeReviewSchema, ...errors } } },
    async (req) =>
      service.review(sessions.actor(req.cookies.ttx_session), req.params.track, req.params.runId),
  );
  app.get<{ Params: Path }>(
    `${root}/team-responses`,
    { schema: { params, response: { 200: TeamOutcomesSchema, ...errors } } },
    async (req) =>
      service.team(sessions.actor(req.cookies.ttx_session), req.params.track, req.params.runId),
  );

  function post<T extends TSchema>(
    path: string,
    body: T,
    result: TSchema,
    handle: (actor: Actor, track: Track, runId: string, input: Static<T>) => unknown,
  ) {
    app.post<{ Params: Path; Body: Static<T> }>(
      `${root}/${path}`,
      { schema: { params, body, response: { 200: result, ...errors } } },
      async (req) =>
        handle(
          sessions.actor(req.cookies.ttx_session),
          req.params.track,
          req.params.runId,
          req.body,
        ),
    );
  }
  post('team-responses', ResponseRequestSchema, ResponseViewSchema, service.respond.bind(service));
  post(
    'dispositions',
    DispositionRequestSchema,
    DispositionSchema,
    service.disposition.bind(service),
  );
  post('closures', ClosureRequestSchema, ClosureSchema, service.close.bind(service));
  post('complete', CompletionRequestSchema, CompletionSchema, service.complete.bind(service));
}
