import { Type } from '@sinclair/typebox';
import type { FastifyInstance } from 'fastify';
import { ErrorSchema, IdSchema } from '../contracts/profile.js';
import {
  AarListSchema,
  AarViewSchema,
  RequestAarSchema,
  ReviewAarSchema,
  type RequestAar,
  type ReviewAar,
} from '../contracts/aar.js';
import type { Sessions } from './access.js';
import type { AarService } from './aar-service.js';

export function registerAarRoutes(
  app: FastifyInstance,
  sessions: Sessions,
  service: AarService,
): void {
  const errors = Object.fromEntries(
    [400, 401, 403, 404, 409, 413, 500].map((code) => [code, ErrorSchema]),
  );
  const params = Type.Object({ runId: IdSchema }, { additionalProperties: false });
  const base = '/api/tracks/technical/runs/:runId/aars';
  app.get<{ Params: { runId: string } }>(
    base,
    { schema: { params, response: { 200: AarListSchema, ...errors } } },
    async (request) =>
      service.list(sessions.actor(request.cookies.ttx_session), request.params.runId),
  );
  app.post<{ Params: { runId: string }; Body: RequestAar }>(
    base,
    { schema: { params, body: RequestAarSchema, response: { 200: AarViewSchema, ...errors } } },
    async (request) =>
      service.request(
        sessions.actor(request.cookies.ttx_session),
        request.params.runId,
        request.body,
      ),
  );
  app.post<{ Params: { runId: string; id: string }; Body: ReviewAar }>(
    base + '/:id/review',
    {
      schema: {
        params: Type.Object({ runId: IdSchema, id: IdSchema }, { additionalProperties: false }),
        body: ReviewAarSchema,
        response: { 200: AarViewSchema, ...errors },
      },
    },
    async (request) =>
      service.review(
        sessions.actor(request.cookies.ttx_session),
        request.params.runId,
        request.params.id,
        request.body,
      ),
  );
}
