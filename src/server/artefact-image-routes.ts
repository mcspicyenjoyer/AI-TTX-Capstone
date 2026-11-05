import { Type } from '@sinclair/typebox';
import type { FastifyInstance } from 'fastify';
import { ErrorSchema, IdSchema } from '../contracts/profile.js';
import { PackageDraftViewSchema } from '../contracts/generation.js';
import {
  GenerateImageSchema,
  AttachImageSchema,
  type GenerateImage,
  type AttachImage,
} from '../contracts/artefact-images.js';
import type { Sessions } from './access.js';
import type { ArtefactImageService } from './artefact-image-service.js';

export function registerArtefactImageRoutes(
  app: FastifyInstance,
  sessions: Sessions,
  service: ArtefactImageService,
) {
  const errors = Object.fromEntries(
    [400, 401, 403, 404, 409, 413, 500].map((code) => [code, ErrorSchema]),
  );
  const params = Type.Object({ id: IdSchema }, { additionalProperties: false });
  app.post<{ Params: { id: string }; Body: GenerateImage }>(
    '/api/packages/:id/images',
    {
      schema: {
        params,
        body: GenerateImageSchema,
        response: { 200: PackageDraftViewSchema, ...errors },
      },
    },
    async (request) =>
      service.generate(
        sessions.actor(request.cookies.ttx_session),
        request.params.id,
        request.body,
      ),
  );
  app.post<{ Params: { id: string }; Body: AttachImage }>(
    '/api/packages/:id/images/attach',
    {
      schema: {
        params,
        body: AttachImageSchema,
        response: { 200: PackageDraftViewSchema, ...errors },
      },
    },
    async (request) =>
      service.attach(sessions.actor(request.cookies.ttx_session), request.params.id, request.body),
  );
  app.get<{ Params: { id: string } }>(
    '/api/artefact-images/:id',
    {
      schema: { params, response: errors },
    },
    async (request, reply) => {
      const png = service.read(sessions.actor(request.cookies.ttx_session), request.params.id);
      return reply
        .type('image/png')
        .header('Content-Disposition', `inline; filename="${request.params.id}.png"`)
        .send(png);
    },
  );
}
