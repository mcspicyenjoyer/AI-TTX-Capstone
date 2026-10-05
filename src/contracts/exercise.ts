import { Type, type Static } from '@sinclair/typebox';
import { IdSchema } from './profile.js';

const strict = { additionalProperties: false };
const text = (maxLength = 1000) => Type.String({ minLength: 1, maxLength, pattern: '\\S' });
const hash = Type.String({ pattern: '^[a-f0-9]{64}$' });
const at = Type.String({ format: 'date-time' });
const revision = Type.Integer({ minimum: 1 });
export const TrackSchema = Type.Union([Type.Literal('technical'), Type.Literal('operational')]);
export const RunStateSchema = Type.Union([
  Type.Literal('draft'),
  Type.Literal('active'),
  Type.Literal('paused'),
  Type.Literal('completed'),
]);
export const PackageKindSchema = Type.Union([
  Type.Literal('engineering-fixture'),
  Type.Literal('development-skeleton'),
]);
export const RoleSchema = Type.Object(
  { id: IdSchema, name: text(120), briefing: text(3000) },
  strict,
);
export const InjectSchema = Type.Object(
  {
    id: IdSchema,
    revisionId: IdSchema,
    title: text(160),
    body: text(6000),
    recipientRoleIds: Type.Array(IdSchema, { minItems: 1, maxItems: 20, uniqueItems: true }),
    facilitatorNotes: text(3000),
  },
  strict,
);
export const PackageSchema = Type.Object(
  {
    id: IdSchema,
    revisionId: IdSchema,
    track: TrackSchema,
    kind: PackageKindSchema,
    title: text(160),
    synthetic: Type.Literal(true),
    profileId: IdSchema,
    profileRevisionId: IdSchema,
    profileHash: hash,
    briefing: Type.Object(
      {
        revisionId: IdSchema,
        common: text(4000),
        references: Type.Array(text(500), { minItems: 1, maxItems: 20 }),
        gaps: Type.Array(
          Type.Object(
            {
              id: IdSchema,
              description: text(),
              disposition: Type.Union([
                Type.Literal('exercise-assumption'),
                Type.Literal('retained-gap'),
                Type.Literal('hold'),
              ]),
              rationale: text(),
            },
            strict,
          ),
          { maxItems: 20 },
        ),
      },
      strict,
    ),
    roles: Type.Array(RoleSchema, { minItems: 1, maxItems: 20 }),
    injects: Type.Array(InjectSchema, { maxItems: 15 }),
  },
  strict,
);
export const MemberSchema = Type.Object(
  {
    actorId: IdSchema,
    displayName: text(120),
    kind: Type.Union([Type.Literal('facilitator'), Type.Literal('participant')]),
    roleId: Type.Union([IdSchema, Type.Null()]),
  },
  strict,
);
export const RunSchema = Type.Object(
  {
    id: IdSchema,
    track: TrackSchema,
    packageId: IdSchema,
    packageRevisionId: IdSchema,
    revision,
    state: RunStateSchema,
  },
  strict,
);
export const RunListSchema = Type.Array(
  Type.Object(
    {
      id: IdSchema,
      track: TrackSchema,
      title: text(160),
      state: RunStateSchema,
      kind: PackageKindSchema,
    },
    strict,
  ),
  { maxItems: 100 },
);
export const PreparationSchema = Type.Object(
  {
    actorId: IdSchema,
    confirmedAt: at,
    packageHash: hash,
    assignmentHash: hash,
    briefingRevisionId: IdSchema,
  },
  strict,
);
export const Step0DecisionSchema = Type.Union([
  Type.Literal('ready'),
  Type.Literal('clarification-required'),
  Type.Literal('hold'),
]);
const step0Evidence = {
  respondentIds: Type.Array(IdSchema, { minItems: 1, maxItems: 50, uniqueItems: true }),
  firstContact: text(1500),
  contactRoute: text(1500),
  fallback: text(1500),
  decision: Step0DecisionSchema,
  rationale: text(2000),
};
export const Step0CheckSchema = Type.Object(
  {
    ...step0Evidence,
    id: IdSchema,
    runId: IdSchema,
    packageHash: hash,
    assignmentHash: hash,
    actorId: IdSchema,
    recordedAt: at,
    runRevision: revision,
  },
  strict,
);
export const ApprovalSchema = Type.Object(
  {
    id: IdSchema,
    runId: IdSchema,
    runRevision: revision,
    packageRevisionId: IdSchema,
    packageHash: hash,
    assignmentHash: hash,
    injectId: IdSchema,
    injectRevisionId: IdSchema,
    contentHash: hash,
    recipientIds: Type.Array(IdSchema, { minItems: 1, maxItems: 50, uniqueItems: true }),
    actorId: IdSchema,
    approvedAt: at,
  },
  strict,
);
export const ReleaseSchema = Type.Object(
  {
    id: IdSchema,
    runId: IdSchema,
    approvalId: IdSchema,
    injectId: IdSchema,
    injectRevisionId: IdSchema,
    title: text(160),
    body: text(6000),
    releasedAt: at,
    recipientIds: Type.Array(IdSchema, { minItems: 1, maxItems: 50, uniqueItems: true }),
  },
  strict,
);
export const InboxSchema = Type.Array(
  Type.Pick(ReleaseSchema, [
    'id',
    'runId',
    'injectId',
    'injectRevisionId',
    'title',
    'body',
    'releasedAt',
  ]),
  { maxItems: 15 },
);
export const BriefingViewSchema = Type.Object(
  {
    runId: IdSchema,
    track: TrackSchema,
    state: RunStateSchema,
    step0Status: Type.Union([Type.Literal('pending'), Step0DecisionSchema]),
    revisionId: IdSchema,
    common: text(4000),
    references: Type.Array(text(500), { maxItems: 20 }),
    role: RoleSchema,
  },
  strict,
);
export const ReviewSchema = Type.Object(
  {
    run: RunSchema,
    package: PackageSchema,
    packageHash: hash,
    assignmentHash: hash,
    members: Type.Array(MemberSchema, { maxItems: 50 }),
    profileConfirmed: Type.Boolean(),
    preparation: Type.Union([PreparationSchema, Type.Null()]),
    step0Checks: Type.Array(Step0CheckSchema, { maxItems: 100 }),
    step0Ready: Type.Boolean(),
    approval: Type.Union([ApprovalSchema, Type.Null()]),
    nextInject: Type.Union([Type.Object({ id: IdSchema, contentHash: hash }, strict), Type.Null()]),
    releases: Type.Array(ReleaseSchema, { maxItems: 15 }),
  },
  strict,
);
const command = { expectedRunRevision: revision, idempotencyKey: IdSchema };
export const Step0RequestSchema = Type.Object(
  { ...command, ...step0Evidence, packageHash: hash, assignmentHash: hash },
  strict,
);
export const StartRequestSchema = Type.Object(
  {
    ...command,
    packageHash: hash,
    assignmentHash: hash,
    acknowledgeBriefing: Type.Literal(true),
    acknowledgeGaps: Type.Literal(true),
    acknowledgeSimulation: Type.Literal(true),
  },
  strict,
);
export const StateRequestSchema = Type.Object({ ...command }, strict);
export const ApproveRequestSchema = Type.Object(
  {
    ...command,
    packageHash: hash,
    injectId: IdSchema,
    injectRevisionId: IdSchema,
    contentHash: hash,
    recipientIds: Type.Array(IdSchema, { minItems: 1, maxItems: 50, uniqueItems: true }),
  },
  strict,
);
export const ReleaseRequestSchema = Type.Object({ ...command, approvalId: IdSchema }, strict);
export const RunActivitySchema = Type.Array(
  Type.Object(
    {
      sequence: Type.Integer({ minimum: 1 }),
      runId: IdSchema,
      kind: Type.Union([
        Type.Literal('step0-recorded'),
        Type.Literal('briefing-confirmed'),
        Type.Literal('inject-approved'),
        Type.Literal('inject-released'),
        Type.Literal('run-paused'),
        Type.Literal('run-resumed'),
        Type.Literal('run-recovered'),
      ]),
      actorId: Type.Union([IdSchema, Type.Null()]),
      occurredAt: at,
      referenceId: Type.Union([IdSchema, Type.Null()]),
      runRevision: revision,
    },
    strict,
  ),
  { maxItems: 100 },
);

export type Track = Static<typeof TrackSchema>;
export type ExercisePackage = Static<typeof PackageSchema>;
export type Inject = Static<typeof InjectSchema>;
export type Member = Static<typeof MemberSchema>;
export type Run = Static<typeof RunSchema>;
export type RunList = Static<typeof RunListSchema>;
export type Preparation = Static<typeof PreparationSchema>;
export type Step0Check = Static<typeof Step0CheckSchema>;
export type Step0Request = Static<typeof Step0RequestSchema>;
export type Approval = Static<typeof ApprovalSchema>;
export type Release = Static<typeof ReleaseSchema>;
export type Inbox = Static<typeof InboxSchema>;
export type BriefingView = Static<typeof BriefingViewSchema>;
export type Review = Static<typeof ReviewSchema>;
export type StartRequest = Static<typeof StartRequestSchema>;
export type StateRequest = Static<typeof StateRequestSchema>;
export type ApproveRequest = Static<typeof ApproveRequestSchema>;
export type ReleaseRequest = Static<typeof ReleaseRequestSchema>;
export type RunActivity = Static<typeof RunActivitySchema>;
