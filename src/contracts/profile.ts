import { Type, type Static } from '@sinclair/typebox';

const boundedText = (maxLength = 500) => Type.String({ minLength: 1, maxLength, pattern: '\\S' });
export const IdSchema = Type.String({ pattern: '^[a-z0-9][a-z0-9-]{0,63}$' });
const timestamp = Type.String({ format: 'date-time' });
const hash = Type.String({ pattern: '^[a-f0-9]{64}$' });
const objectOptions = { additionalProperties: false };

export const SourceSchema = Type.Object(
  {
    id: IdSchema,
    title: boundedText(120),
    version: boundedText(30),
    kind: Type.Union([
      Type.Literal('network'),
      Type.Literal('bcp'),
      Type.Literal('drp'),
      Type.Literal('bia'),
      Type.Literal('setup'),
    ]),
    synthetic: Type.Literal(true),
    contentHash: Type.Optional(hash),
  },
  objectOptions,
);
export const EvidenceSchema = Type.Object(
  {
    sourceId: IdSchema,
    locator: boundedText(240),
    excerpt: boundedText(1000),
  },
  objectOptions,
);
export const EntityKindSchema = Type.Union(
  (['system', 'service', 'role', 'third-party', 'zone', 'data', 'unclassified'] as const).map(
    (kind) => Type.Literal(kind),
  ),
);
export const ClaimStatusSchema = Type.Union(
  (['fact', 'proposal', 'assumption', 'unknown', 'conflict'] as const).map((status) =>
    Type.Literal(status),
  ),
);
export const EntitySchema = Type.Object(
  {
    id: IdSchema,
    kind: EntityKindSchema,
    name: boundedText(160),
    evidence: Type.Array(EvidenceSchema, { minItems: 1, maxItems: 10 }),
  },
  objectOptions,
);
export const ClaimSchema = Type.Object(
  {
    id: IdSchema,
    subjectId: IdSchema,
    predicate: Type.Union(
      (
        [
          'description',
          'location',
          'quantity',
          'rto-hours',
          'rpo-hours',
          'recovery-priority',
          'backup-frequency',
          'backup-retention-days',
          'mfa',
          'backup-isolation',
          'restore-tested',
          'authority',
          'diagram-link',
          'connects-to',
          'depends-on',
          'owned-by',
          'supported-by',
          'backup-to',
          'identity-sync-to',
          'access-to',
          'monitored-by',
          'uses-data',
        ] as const
      ).map((predicate) => Type.Literal(predicate)),
    ),
    objectId: Type.Union([IdSchema, Type.Null()]),
    value: Type.Union([
      boundedText(1000),
      Type.Number({ minimum: 0, maximum: 1_000_000 }),
      Type.Boolean(),
      Type.Null(),
    ]),
    status: ClaimStatusSchema,
    explanation: boundedText(1000),
    evidence: Type.Array(EvidenceSchema, { maxItems: 10 }),
  },
  objectOptions,
);
export const EnvironmentSchema = Type.Object(
  {
    entities: Type.Array(EntitySchema, { minItems: 1, maxItems: 150 }),
    claims: Type.Array(ClaimSchema, { minItems: 1, maxItems: 300 }),
  },
  objectOptions,
);
export const StatementSchema = Type.Object(
  {
    id: IdSchema,
    category: Type.Union([
      Type.Literal('organisation'),
      Type.Literal('network'),
      Type.Literal('continuity'),
      Type.Literal('responsibilities'),
    ]),
    label: boundedText(120),
    status: Type.Union([
      Type.Literal('fact'),
      Type.Literal('assumption'),
      Type.Literal('proposal'),
      Type.Literal('unknown'),
      Type.Literal('conflict'),
    ]),
    value: Type.Union([boundedText(1000), Type.Null()]),
    explanation: boundedText(1000),
    evidence: Type.Array(EvidenceSchema, { maxItems: 10 }),
  },
  objectOptions,
);
export const ProfileSchema = Type.Object(
  {
    profileId: IdSchema,
    revisionId: IdSchema,
    revisionNumber: Type.Integer({ minimum: 1 }),
    organisationName: boundedText(120),
    synthetic: Type.Literal(true),
    createdAt: timestamp,
    sources: Type.Array(SourceSchema, { minItems: 1, maxItems: 30 }),
    statements: Type.Array(StatementSchema, { minItems: 1, maxItems: 300 }),
    environment: Type.Optional(EnvironmentSchema),
  },
  objectOptions,
);
export const ActorSchema = Type.Object(
  {
    id: IdSchema,
    displayName: boundedText(120),
    role: Type.Union([Type.Literal('facilitator'), Type.Literal('participant')]),
  },
  objectOptions,
);
export const ConfirmationSchema = Type.Object(
  {
    id: IdSchema,
    profileId: IdSchema,
    revisionId: IdSchema,
    contentHash: hash,
    confirmedBy: ActorSchema,
    confirmedAt: timestamp,
    acknowledgedUncertainties: Type.Literal(true),
  },
  objectOptions,
);
export const ProfileViewSchema = Type.Object(
  {
    profile: ProfileSchema,
    contentHash: hash,
    confirmation: Type.Union([ConfirmationSchema, Type.Null()]),
  },
  objectOptions,
);
export const ConfirmRequestSchema = Type.Object(
  {
    profileId: IdSchema,
    revisionId: IdSchema,
    contentHash: hash,
    acknowledgeUncertainties: Type.Literal(true),
  },
  objectOptions,
);
export const LoginSchema = Type.Object(
  {
    username: Type.String({ minLength: 1, maxLength: 80, pattern: '^[a-z0-9-]+$' }),
    accessCode: Type.String({ minLength: 1, maxLength: 200 }),
  },
  objectOptions,
);
export const MeSchema = Type.Object({ actor: ActorSchema }, objectOptions);
export const ProfileListSchema = Type.Array(
  Type.Object(
    {
      profileId: IdSchema,
      revisionId: IdSchema,
      organisationName: boundedText(120),
    },
    objectOptions,
  ),
  { maxItems: 100 },
);
export const ActivitySchema = Type.Array(
  Type.Object(
    {
      sequence: Type.Integer({ minimum: 1 }),
      kind: Type.Literal('profile-confirmed'),
      profileId: IdSchema,
      revisionId: IdSchema,
      actorName: boundedText(120),
      occurredAt: timestamp,
    },
    objectOptions,
  ),
  { maxItems: 100 },
);
export const ErrorSchema = Type.Object(
  {
    error: Type.Object(
      {
        code: boundedText(80),
        message: boundedText(300),
      },
      objectOptions,
    ),
  },
  objectOptions,
);

export type Profile = Static<typeof ProfileSchema>;
export type ProfileView = Static<typeof ProfileViewSchema>;
export type Actor = Static<typeof ActorSchema>;
export type Confirmation = Static<typeof ConfirmationSchema>;
export type ConfirmRequest = Static<typeof ConfirmRequestSchema>;
export type Login = Static<typeof LoginSchema>;
export type ProfileList = Static<typeof ProfileListSchema>;
export type Activity = Static<typeof ActivitySchema>;
export type Entity = Static<typeof EntitySchema>;
export type Claim = Static<typeof ClaimSchema>;
export type Environment = Static<typeof EnvironmentSchema>;
export type Evidence = Static<typeof EvidenceSchema>;
