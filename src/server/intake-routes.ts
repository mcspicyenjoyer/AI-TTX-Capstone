import { Type } from '@sinclair/typebox';
import type { FastifyInstance } from 'fastify';
import { IdSchema, ErrorSchema } from '../contracts/profile.js';
import {
  CreateIntakeSchema,
  UploadSourceSchema,
  ReviewIntakeSchema,
  ExtractIntakeSchema,
  ConfirmIntakeSchema,
  ConfirmIntakeResultSchema,
  IntakeViewSchema,
  IntakeListSchema,
  type CreateIntake,
  type UploadSource,
  type ReviewIntake,
  type IntakeCommand,
  type ConfirmIntake,
} from '../contracts/intake.js';
import { Sessions } from './access.js';
import { IntakeService } from './intake-service.js';

export function registerIntakeRoutes(
  app: FastifyInstance,
  sessions: Sessions,
  service: IntakeService,
): void {
  const errors = Object.fromEntries(
    [400, 401, 403, 404, 409, 413, 429, 500, 502, 503].map((status) => [status, ErrorSchema]),
  );
  const params = Type.Object({ id: IdSchema }, { additionalProperties: false });
  app.get(
    '/api/intakes',
    { schema: { response: { 200: IntakeListSchema, ...errors } } },
    async (request) => service.list(sessions.actor(request.cookies.ttx_session)),
  );
  app.post<{ Body: CreateIntake }>(
    '/api/intakes',
    { schema: { body: CreateIntakeSchema, response: { 200: IntakeViewSchema, ...errors } } },
    async (request) => service.create(sessions.actor(request.cookies.ttx_session), request.body),
  );
  app.get<{ Params: { id: string } }>(
    '/api/intakes/:id',
    { schema: { params, response: { 200: IntakeViewSchema, ...errors } } },
    async (request) => service.get(sessions.actor(request.cookies.ttx_session), request.params.id),
  );
  app.post<{ Params: { id: string }; Body: UploadSource }>(
    '/api/intakes/:id/sources',
    {
      bodyLimit: 5_600_000,
      schema: { params, body: UploadSourceSchema, response: { 200: IntakeViewSchema, ...errors } },
    },
    async (request) =>
      service.upload(sessions.actor(request.cookies.ttx_session), request.params.id, request.body),
  );
  app.post<{ Params: { id: string }; Body: ReviewIntake }>(
    '/api/intakes/:id/review',
    {
      bodyLimit: 1_500_000,
      schema: { params, body: ReviewIntakeSchema, response: { 200: IntakeViewSchema, ...errors } },
    },
    async (request) =>
      service.review(sessions.actor(request.cookies.ttx_session), request.params.id, request.body),
  );
  app.post<{ Params: { id: string }; Body: IntakeCommand }>(
    '/api/intakes/:id/extract',
    {
      schema: { params, body: ExtractIntakeSchema, response: { 200: IntakeViewSchema, ...errors } },
    },
    async (request) =>
      service.extract(sessions.actor(request.cookies.ttx_session), request.params.id, request.body),
  );
  app.post<{ Params: { id: string }; Body: ConfirmIntake }>(
    '/api/intakes/:id/confirm',
    {
      schema: {
        params,
        body: ConfirmIntakeSchema,
        response: { 200: ConfirmIntakeResultSchema, ...errors },
      },
    },
    async (request) =>
      service.confirm(sessions.actor(request.cookies.ttx_session), request.params.id, request.body),
  );
}
