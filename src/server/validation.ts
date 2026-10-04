import { Ajv } from 'ajv';
import { default as addFormatsImport } from 'ajv-formats';
import { ProfileSchema, type Profile } from '../contracts/profile.js';
import type { TSchema, Static } from '@sinclair/typebox';

const ajv = new Ajv({ strict: true, coerceTypes: false, removeAdditional: false });
// CommonJS interop differs between the browser/test and NodeNext compiler targets.
const addFormats = addFormatsImport as unknown as (instance: Ajv) => void;
addFormats(ajv);
const validate = ajv.compile<Profile>(ProfileSchema);

export function readStored<T extends TSchema>(schema: T, value: unknown): Static<T> {
  const check = ajv.compile<Static<T>>(schema);
  if (!check(value)) throw new Error('Invalid stored exercise schema.');
  return value;
}

export function readProfile(value: unknown): Profile {
  if (!validate(value)) throw new Error('Invalid stored profile schema.');
  const sourceIds = new Set(value.sources.map((source) => source.id));
  const statementIds = new Set(value.statements.map((statement) => statement.id));
  if (sourceIds.size !== value.sources.length || statementIds.size !== value.statements.length) {
    throw new Error('Duplicate profile reference.');
  }
  for (const statement of value.statements) {
    if (statement.evidence.some((evidence) => !sourceIds.has(evidence.sourceId))) {
      throw new Error('Unknown profile evidence source.');
    }
    if (['unknown', 'conflict'].includes(statement.status) && statement.value !== null) {
      throw new Error('Unresolved profile data must not have a selected value.');
    }
    if (['fact', 'assumption'].includes(statement.status) && statement.value === null) {
      throw new Error('A stated fact or assumption needs a value.');
    }
    if (statement.status === 'fact' && statement.evidence.length === 0) {
      throw new Error('A profile fact needs provenance.');
    }
  }
  return value;
}
