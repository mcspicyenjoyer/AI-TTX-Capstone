import { Type } from '@sinclair/typebox';
import type { FastifyInstance } from 'fastify';
import { ErrorSchema, IdSchema } from '../contracts/profile.js';
import {
  InterpretationListSchema,
  InterpretationViewSchema,
  RequestInterpretationSchema,
  ReviewInterpretationSchema,
  type RequestInterpretation,
  type ReviewInterpretation,
} from '../contracts/interpretation.js';
import type { Sessions } from './access.js';
import type { InterpretationService } from './interpretation-service.js';

export function registerInterpretationRoutes(
  app: FastifyInstance,
  sessions: Sessions,
  service: InterpretationService,
): void {
  const errors = Object.fromEntries(
    [400, 401, 403, 404, 409, 413, 500].map((code) => [code, ErrorSchema]),
  );
  const params = Type.Object({ runId: IdSchema }, { additionalProperties: false });
  const base = '/api/tracks/technical/runs/:runId/interpretations';
  app.get<{ Params: { runId: string } }>(
    base,
    { schema: { params, response: { 200: InterpretationListSchema, ...errors } } },
    async (request) =>
      service.list(sessions.actor(request.cookies.ttx_session), request.params.runId),
  );
  app.post<{ Params: { runId: string }; Body: RequestInterpretation }>(
    base,
    {
      schema: {
        params,
        body: RequestInterpretationSchema,
        response: { 200: InterpretationViewSchema, ...errors },
      },
    },
    async (request) =>
      service.request(
        sessions.actor(request.cookies.ttx_session),
        request.params.runId,
        request.body,
      ),
  );
  app.post<{ Params: { runId: string; id: string }; Body: ReviewInterpretation }>(
    base + '/:id/review',
    {
      schema: {
        params: Type.Object({ runId: IdSchema, id: IdSchema }, { additionalProperties: false }),
        body: ReviewInterpretationSchema,
        response: { 200: InterpretationViewSchema, ...errors },
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
