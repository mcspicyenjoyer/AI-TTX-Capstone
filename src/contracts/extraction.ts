import { Type, type Static } from '@sinclair/typebox';
import { ClaimSchema, EntitySchema, IdSchema } from './profile.js';

const strict = { additionalProperties: false };
const text = (maxLength: number) => Type.String({ minLength: 1, maxLength });
const citation = Type.Array(Type.Object({ ref: text(30), quote: text(1000) }, strict), {
  minItems: 1,
  maxItems: 3,
});
// Compact references are resolved by the application, never by model-supplied paths.
export const ExtractionOutputSchema = Type.Object(
  {
    entities: Type.Array(
      Type.Object(
        {
          key: IdSchema,
          kind: EntitySchema.properties.kind,
          name: text(160),
          evidence: citation,
        },
        strict,
      ),
      { minItems: 1, maxItems: 60 },
    ),
    claims: Type.Array(
      Type.Object(
        {
          key: IdSchema,
          subject: IdSchema,
          predicate: ClaimSchema.properties.predicate,
          object: Type.Union([IdSchema, Type.Null()]),
          value: ClaimSchema.properties.value,
          status: ClaimSchema.properties.status,
          explanation: text(1000),
          evidence: citation,
        },
        strict,
      ),
      { minItems: 1, maxItems: 100 },
    ),
  },
  strict,
);
export const ExtractionJobSchema = Type.Object(
  {
    id: IdSchema,
    status: Type.Union(
      (['queued', 'running', 'succeeded', 'failed', 'interrupted'] as const).map((x) =>
        Type.Literal(x),
      ),
    ),
    requestedRevision: Type.Integer({ minimum: 1 }),
    createdAt: text(40),
    updatedAt: text(40),
    message: text(500),
    inputTokens: Type.Union([Type.Integer({ minimum: 0 }), Type.Null()]),
    outputTokens: Type.Union([Type.Integer({ minimum: 0 }), Type.Null()]),
  },
  strict,
);
export type ExtractionOutput = Static<typeof ExtractionOutputSchema>;
export type ExtractionJob = Static<typeof ExtractionJobSchema>;
