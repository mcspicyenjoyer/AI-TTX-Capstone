import { join } from 'node:path';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import staticFiles from '@fastify/static';
import { Type } from '@sinclair/typebox';
import {
  ActivitySchema,
  ConfirmRequestSchema,
  ConfirmationSchema,
  ErrorSchema,
  IdSchema,
  LoginSchema,
  MeSchema,
  ProfileListSchema,
  ProfileViewSchema,
  type ConfirmRequest,
  type Login,
} from '../contracts/profile.js';
import { Store } from './storage.js';
import { Sessions, initialiseDemo } from './access.js';
import { ProfileService } from './profile-service.js';
import { AppError } from './errors.js';

export async function buildApp(options: {
  dataDirectory: string;
  publicPort: number;
  port?: number;
  staticDirectory?: string;
}) {
  const store = new Store(join(options.dataDirectory, 'ttx.sqlite'));
  try {
    initialiseDemo(store, options.dataDirectory);
  } catch (error) {
    store.close();
    throw error;
  }
  const profiles = new ProfileService(store);
  const sessions = new Sessions(store);
  const app = Fastify({
    logger: false,
    bodyLimit: 16_384,
    requestTimeout: 15_000,
    ajv: { customOptions: { removeAdditional: false, coerceTypes: false, useDefaults: false } },
  });
  app.addHook('onClose', async () => {
    store.close();
  });
  await app.register(cookie);
  const origins = new Set([
    `http://localhost:${options.publicPort}`,
    `http://127.0.0.1:${options.publicPort}`,
  ]);
  const hosts = new Set([...origins].map((origin) => new URL(origin).host));
  hosts.add(`127.0.0.1:${options.port ?? options.publicPort}`);
  const errors = {
    400: ErrorSchema,
    401: ErrorSchema,
    403: ErrorSchema,
    404: ErrorSchema,
    409: ErrorSchema,
    429: ErrorSchema,
    500: ErrorSchema,
  };

  app.addHook('onRequest', async (request, reply) => {
    reply
      .header('Cache-Control', 'no-store')
      .header('X-Content-Type-Options', 'nosniff')
      .header('Referrer-Policy', 'no-referrer')
      .header(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
      );
    if (!hosts.has(request.headers.host ?? ''))
      throw new AppError(
        403,
        'INVALID_HOST',
        'This demo is available only through its local address.',
      );
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      if (!origins.has(request.headers.origin ?? ''))
        throw new AppError(
          403,
          'INVALID_ORIGIN',
          'The request must come from the local application.',
        );
    }
  });
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError)
      return reply.code(error.status).send({ error: { code: error.code, message: error.message } });
    if (
      error instanceof Error &&
      ('validation' in error ||
        ('statusCode' in error && [400, 413, 415].includes(Number(error.statusCode))))
    )
      return reply.code(400).send({
        error: {
          code: 'INVALID_INPUT',
          message: 'The request does not match the expected format.',
        },
      });
    return reply.code(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'The operation could not be completed. Reload to check its status.',
      },
    });
  });
  app.get('/healthz', async () => ({ status: 'ok', aiEnabled: false }));
  app.post<{ Body: Login }>(
    '/api/session',
    { schema: { body: LoginSchema, response: { 200: MeSchema, ...errors } } },
    async (request, reply) => {
      const result = sessions.login(request.body.username, request.body.accessCode);
      sessions.logout(request.cookies.ttx_session);
      reply.setCookie('ttx_session', result.token, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: false,
        maxAge: 8 * 60 * 60,
      });
      return { actor: result.actor };
    },
  );
  app.delete('/api/session', async (request, reply) => {
    sessions.logout(request.cookies.ttx_session);
    return reply.clearCookie('ttx_session', { path: '/' }).code(204).send();
  });
  app.get('/api/me', { schema: { response: { 200: MeSchema, ...errors } } }, async (request) => ({
    actor: sessions.actor(request.cookies.ttx_session),
  }));
  app.get(
    '/api/profiles',
    { schema: { response: { 200: ProfileListSchema, ...errors } } },
    async (request) => {
      const actor = sessions.actor(request.cookies.ttx_session);
      if (actor.role !== 'facilitator')
        throw new AppError(403, 'FORBIDDEN', 'Organisation profiles are restricted to reviewers.');
      return store.listProfiles(actor.id);
    },
  );
  app.get<{ Params: { profileId: string; revisionId: string } }>(
    '/api/profiles/:profileId/revisions/:revisionId',
    {
      schema: {
        params: Type.Object(
          { profileId: IdSchema, revisionId: IdSchema },
          { additionalProperties: false },
        ),
        response: { 200: ProfileViewSchema, ...errors },
      },
    },
    async (request) =>
      profiles.get(
        sessions.actor(request.cookies.ttx_session),
        request.params.profileId,
        request.params.revisionId,
      ),
  );
  app.post<{ Body: ConfirmRequest }>(
    '/api/profile-confirmations',
    { schema: { body: ConfirmRequestSchema, response: { 200: ConfirmationSchema, ...errors } } },
    async (request) => profiles.confirm(sessions.actor(request.cookies.ttx_session), request.body),
  );
  app.get<{ Params: { profileId: string } }>(
    '/api/profiles/:profileId/activity',
    {
      schema: {
        params: Type.Object({ profileId: IdSchema }, { additionalProperties: false }),
        response: { 200: ActivitySchema, ...errors },
      },
    },
    async (request) => {
      profiles.requireReviewer(
        sessions.actor(request.cookies.ttx_session),
        request.params.profileId,
      );
      return store.activity(request.params.profileId);
    },
  );
  if (options.staticDirectory)
    await app.register(staticFiles, {
      root: options.staticDirectory,
      index: ['index.html'],
      dotfiles: 'deny',
    });
  app.setNotFoundHandler((_request, reply) =>
    reply
      .code(404)
      .send({ error: { code: 'NOT_FOUND', message: 'This resource is unavailable.' } }),
  );
  await app.ready();
  return app;
}
