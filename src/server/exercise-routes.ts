import type { FastifyInstance } from 'fastify';
import { Type, type TSchema } from '@sinclair/typebox';
import { IdSchema } from '../contracts/profile.js';
import {
  TrackSchema,
  RunListSchema,
  ReviewSchema,
  BriefingViewSchema,
  InboxSchema,
  RunActivitySchema,
  StartRequestSchema,
  StateRequestSchema,
  ApproveRequestSchema,
  ReleaseRequestSchema,
  RunSchema,
  ApprovalSchema,
  ReleaseSchema,
  type Track,
  type StartRequest,
  type StateRequest,
  type ApproveRequest,
  type ReleaseRequest,
} from '../contracts/exercise.js';
import type { Sessions } from './access.js';
import type { ExerciseService } from './exercise-service.js';

type Path = { track: Track; runId: string };
const params = Type.Object(
  { track: TrackSchema, runId: IdSchema },
  { additionalProperties: false },
);
const root = '/api/tracks/:track/runs/:runId';

export function registerExerciseRoutes(
  app: FastifyInstance,
  sessions: Sessions,
  service: ExerciseService,
  errors: Record<number, TSchema>,
): void {
  app.get<{ Params: { track: Track } }>(
    '/api/tracks/:track/runs',
    {
      schema: {
        params: Type.Object({ track: TrackSchema }, { additionalProperties: false }),
        response: { 200: RunListSchema, ...errors },
      },
    },
    async (req) => service.list(sessions.actor(req.cookies.ttx_session), req.params.track),
  );
  app.get<{ Params: Path }>(
    `${root}/review`,
    { schema: { params, response: { 200: ReviewSchema, ...errors } } },
    async (req) =>
      service.review(sessions.actor(req.cookies.ttx_session), req.params.track, req.params.runId),
  );
  app.get<{ Params: Path }>(
    `${root}/briefing`,
    { schema: { params, response: { 200: BriefingViewSchema, ...errors } } },
    async (req) =>
      service.briefing(sessions.actor(req.cookies.ttx_session), req.params.track, req.params.runId),
  );
  app.get<{ Params: Path }>(
    `${root}/inbox`,
    { schema: { params, response: { 200: InboxSchema, ...errors } } },
    async (req) =>
      service.inbox(sessions.actor(req.cookies.ttx_session), req.params.track, req.params.runId),
  );
  app.get<{ Params: Path }>(
    `${root}/activity`,
    { schema: { params, response: { 200: RunActivitySchema, ...errors } } },
    async (req) =>
      service.activity(sessions.actor(req.cookies.ttx_session), req.params.track, req.params.runId),
  );
  app.post<{ Params: Path; Body: StartRequest }>(
    `${root}/start`,
    {
      schema: { params, body: StartRequestSchema, response: { 200: RunSchema, ...errors } },
    },
    async (req) =>
      service.start(
        sessions.actor(req.cookies.ttx_session),
        req.params.track,
        req.params.runId,
        req.body,
      ),
  );
  for (const action of ['pause', 'resume'] as const)
    app.post<{ Params: Path; Body: StateRequest }>(
      `${root}/${action}`,
      {
        schema: { params, body: StateRequestSchema, response: { 200: RunSchema, ...errors } },
      },
      async (req) =>
        service.changeState(
          sessions.actor(req.cookies.ttx_session),
          req.params.track,
          req.params.runId,
          req.body,
          action,
        ),
    );
  app.post<{ Params: Path; Body: ApproveRequest }>(
    `${root}/approvals`,
    {
      schema: { params, body: ApproveRequestSchema, response: { 200: ApprovalSchema, ...errors } },
    },
    async (req) =>
      service.approve(
        sessions.actor(req.cookies.ttx_session),
        req.params.track,
        req.params.runId,
        req.body,
      ),
  );
  app.post<{ Params: Path; Body: ReleaseRequest }>(
    `${root}/releases`,
    {
      schema: { params, body: ReleaseRequestSchema, response: { 200: ReleaseSchema, ...errors } },
    },
    async (req) =>
      service.release(
        sessions.actor(req.cookies.ttx_session),
        req.params.track,
        req.params.runId,
        req.body,
      ),
  );
}
