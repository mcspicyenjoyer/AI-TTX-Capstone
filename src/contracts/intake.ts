import { Type, type Static } from '@sinclair/typebox';
import { ClaimSchema, EntitySchema, IdSchema, ProfileViewSchema, SourceSchema } from './profile.js';
import { ExtractionJobSchema } from './extraction.js';

const strict = { additionalProperties: false };
const text = (maxLength: number) => Type.String({ minLength: 1, maxLength, pattern: '\\S' });
const review = Type.Union(
  (['pending', 'accepted', 'rejected'] as const).map((value) => Type.Literal(value)),
);
export const FileFormatSchema = Type.Union(
  (['drawio', 'drawio-svg', 'docx', 'pdf', 'text', 'guided'] as const).map((value) =>
    Type.Literal(value),
  ),
);
export const UnitSchema = Type.Object(
  {
    id: IdSchema,
    locator: text(240),
    text: text(4000),
    kind: Type.Union((['text', 'node', 'edge'] as const).map((value) => Type.Literal(value))),
    nodeId: Type.Optional(text(240)),
    from: Type.Optional(text(240)),
    to: Type.Optional(text(240)),
  },
  strict,
);
export const IntakeSourceSchema = Type.Object(
  {
    ...SourceSchema.properties,
    contentHash: Type.String({ pattern: '^[a-f0-9]{64}$' }),
    format: FileFormatSchema,
    units: Type.Array(UnitSchema, { minItems: 1, maxItems: 400 }),
    warnings: Type.Array(text(500), { maxItems: 20 }),
  },
  strict,
);
export const CandidateEntitySchema = Type.Object({ ...EntitySchema.properties, review }, strict);
export const CandidateClaimSchema = Type.Object({ ...ClaimSchema.properties, review }, strict);
export const ProposalSchema = Type.Object(
  {
    entities: Type.Array(CandidateEntitySchema, { maxItems: 150 }),
    claims: Type.Array(CandidateClaimSchema, { maxItems: 300 }),
  },
  strict,
);
export const IntakeSchema = Type.Object(
  {
    id: IdSchema,
    revision: Type.Integer({ minimum: 1 }),
    organisationName: text(120),
    synthetic: Type.Literal(true),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
    sources: Type.Array(IntakeSourceSchema, { maxItems: 10 }),
    ...ProposalSchema.properties,
    confirmedProfile: Type.Union([
      Type.Object({ profileId: IdSchema, revisionId: IdSchema }, strict),
      Type.Null(),
    ]),
  },
  strict,
);
export const IntakeViewSchema = Type.Object(
  {
    draft: IntakeSchema,
    contentHash: Type.String({ pattern: '^[a-f0-9]{64}$' }),
    extractionAvailable: Type.Boolean(),
    extractionJob: Type.Union([ExtractionJobSchema, Type.Null()]),
    questions: Type.Array(text(500), { maxItems: 20 }),
    events: Type.Array(
      Type.Object(
        {
          revision: Type.Integer({ minimum: 1 }),
          action: text(80),
          actorName: text(120),
          at: Type.String({ format: 'date-time' }),
          rationale: text(1000),
        },
        strict,
      ),
      { maxItems: 500 },
    ),
  },
  strict,
);
export const IntakeListSchema = Type.Array(
  Type.Object(
    {
      id: IdSchema,
      organisationName: text(120),
      revision: Type.Integer({ minimum: 1 }),
      confirmed: Type.Boolean(),
    },
    strict,
  ),
  { maxItems: 20 },
);
export const CreateIntakeSchema = Type.Object(
  { organisationName: text(120), synthetic: Type.Literal(true), commandId: IdSchema },
  strict,
);
const command = {
  commandId: IdSchema,
  expectedRevision: Type.Integer({ minimum: 1 }),
  expectedHash: Type.String({ pattern: '^[a-f0-9]{64}$' }),
};
export const UploadSourceSchema = Type.Object(
  {
    ...command,
    title: text(120),
    version: text(30),
    kind: SourceSchema.properties.kind,
    format: FileFormatSchema,
    content: text(5_592_408),
    synthetic: Type.Literal(true),
  },
  strict,
);
export const ReviewIntakeSchema = Type.Object(
  { ...command, organisationName: text(120), ...ProposalSchema.properties, rationale: text(1000) },
  strict,
);
export const ExtractIntakeSchema = Type.Object(command, strict);
export const ConfirmIntakeSchema = Type.Object(
  { ...command, acknowledgeUncertainties: Type.Literal(true) },
  strict,
);
export const ConfirmIntakeResultSchema = Type.Object(
  { intake: IntakeViewSchema, profile: ProfileViewSchema },
  strict,
);
export type SourceUnit = Static<typeof UnitSchema>;
export type IntakeSource = Static<typeof IntakeSourceSchema>;
export type Intake = Static<typeof IntakeSchema>;
export type IntakeView = Static<typeof IntakeViewSchema>;
export type Proposal = Static<typeof ProposalSchema>;
export type UploadSource = Static<typeof UploadSourceSchema>;
export type ReviewIntake = Static<typeof ReviewIntakeSchema>;
export type IntakeCommand = Static<typeof ExtractIntakeSchema>;
export type CreateIntake = Static<typeof CreateIntakeSchema>;
export type ConfirmIntake = Static<typeof ConfirmIntakeSchema>;
