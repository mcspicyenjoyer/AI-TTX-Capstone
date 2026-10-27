import { Type } from '@sinclair/typebox';
import type { FastifyInstance } from 'fastify';
import { ErrorSchema, IdSchema } from '../contracts/profile.js';
import {
  GenerationContextSchema,
  PackageDraftViewSchema,
  GeneratePackageSchema,
  ReviewPositionSchema,
  ReviewPreparationSchema,
  FreezePackageSchema,
  type GeneratePackage,
  type ReviewPosition,
  type ReviewPreparation,
  type FreezePackage,
} from '../contracts/generation.js';
import type { Sessions } from './access.js';
import type { GenerationService } from './generation-service.js';

export function registerGenerationRoutes(
  app: FastifyInstance,
  sessions: Sessions,
  service: GenerationService,
): void {
  const errors = Object.fromEntries(
    [400, 401, 403, 404, 409, 413, 500].map((code) => [code, ErrorSchema]),
  );
  const params = Type.Object({ id: IdSchema }, { additionalProperties: false });
  app.get(
    '/api/packages',
    { schema: { response: { 200: GenerationContextSchema, ...errors } } },
    async (request) => service.context(sessions.actor(request.cookies.ttx_session)),
  );
  app.post<{ Body: GeneratePackage }>(
    '/api/packages',
    {
      schema: { body: GeneratePackageSchema, response: { 200: PackageDraftViewSchema, ...errors } },
    },
    async (request) => service.generate(sessions.actor(request.cookies.ttx_session), request.body),
  );
  app.get<{ Params: { id: string } }>(
    '/api/packages/:id',
    { schema: { params, response: { 200: PackageDraftViewSchema, ...errors } } },
    async (request) => service.get(sessions.actor(request.cookies.ttx_session), request.params.id),
  );
  app.post<{ Params: { id: string }; Body: ReviewPosition }>(
    '/api/packages/:id/review',
    {
      schema: {
        params,
        body: ReviewPositionSchema,
        response: { 200: PackageDraftViewSchema, ...errors },
      },
    },
    async (request) =>
      service.review(sessions.actor(request.cookies.ttx_session), request.params.id, request.body),
  );
  app.post<{ Params: { id: string }; Body: ReviewPreparation }>(
    '/api/packages/:id/preparation',
    {
      schema: {
        params,
        body: ReviewPreparationSchema,
        response: { 200: PackageDraftViewSchema, ...errors },
      },
    },
    async (request) =>
      service.reviewPreparation(
        sessions.actor(request.cookies.ttx_session),
        request.params.id,
        request.body,
      ),
  );
  app.post<{ Params: { id: string }; Body: FreezePackage }>(
    '/api/packages/:id/freeze',
    {
      schema: {
        params,
        body: FreezePackageSchema,
        response: { 200: PackageDraftViewSchema, ...errors },
      },
    },
    async (request) =>
      service.freeze(sessions.actor(request.cookies.ttx_session), request.params.id, request.body),
  );
}
