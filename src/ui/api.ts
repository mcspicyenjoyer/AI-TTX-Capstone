import { FormatRegistry, type TSchema, type Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { fullFormats } from 'ajv-formats/dist/formats.js';
import type { FormatDefinition } from 'ajv';

const dateTime = fullFormats['date-time'] as FormatDefinition<string>;
FormatRegistry.Set(
  'date-time',
  (value) => typeof dateTime.validate === 'function' && dateTime.validate(value),
);

export function readResponse<T extends TSchema>(schema: T, value: unknown): Static<T> {
  // Interpreted validation preserves strict CSP without runtime code generation.
  if (!Value.Check(schema, value))
    throw new Error('The server returned an unexpected response. Nothing has been assumed saved.');
  return value;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function request<T extends TSchema>(
  schema: T,
  path: string,
  body?: unknown,
): Promise<Static<T>> {
  const response = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const value: unknown = await response.json();
  if (!response.ok) {
    const message =
      value &&
      typeof value === 'object' &&
      'error' in value &&
      value.error &&
      typeof value.error === 'object' &&
      'message' in value.error &&
      typeof value.error.message === 'string'
        ? value.error.message
        : 'The request could not be completed.';
    throw new ApiError(response.status, message);
  }
  return readResponse(schema, value);
}

export async function signOut(): Promise<void> {
  const response = await fetch('/api/session', { method: 'DELETE', credentials: 'same-origin' });
  if (!response.ok) throw new Error('Sign out failed. Please try again.');
}
