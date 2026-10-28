import { Type } from '@sinclair/typebox';
import type { FastifyInstance } from 'fastify';
import { ErrorSchema, IdSchema } from '../contracts/profile.js';
import {
  CaptureRecordReportSchema,
  RecordReportListSchema,
  RecordReportViewSchema,
} from '../contracts/record-report.js';
import type { Sessions } from './access.js';
import type { RecordReportService } from './record-report-service.js';

export function registerRecordReportRoutes(
  app: FastifyInstance,
  sessions: Sessions,
  service: RecordReportService,
): void {
  const errors = Object.fromEntries(
    [400, 401, 403, 404, 409, 413, 500].map((code) => [code, ErrorSchema]),
  );
  const params = Type.Object({ runId: IdSchema }, { additionalProperties: false });
  const base = '/api/tracks/technical/runs/:runId/record-reports';
  app.get<{ Params: { runId: string } }>(
    base,
    { schema: { params, response: { 200: RecordReportListSchema, ...errors } } },
    async (request) =>
      service.list(sessions.actor(request.cookies.ttx_session), request.params.runId),
  );
  app.post<{ Params: { runId: string }; Body: { commandId: string } }>(
    base,
    {
      schema: {
        params,
        body: CaptureRecordReportSchema,
        response: { 200: RecordReportViewSchema, ...errors },
      },
    },
    async (request) =>
      service.capture(
        sessions.actor(request.cookies.ttx_session),
        request.params.runId,
        request.body.commandId,
      ),
  );
  app.get<{ Params: { runId: string; id: string } }>(
    base + '/:id',
    {
      schema: {
        params: Type.Object({ runId: IdSchema, id: IdSchema }, { additionalProperties: false }),
        response: { 200: RecordReportViewSchema, ...errors },
      },
    },
    async (request) =>
      service.get(
        sessions.actor(request.cookies.ttx_session),
        request.params.runId,
        request.params.id,
      ),
  );
}
