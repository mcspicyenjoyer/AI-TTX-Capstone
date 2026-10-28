import { Type, type Static } from '@sinclair/typebox';
import { IdSchema, ProfileSchema } from './profile.js';
import { PackageSchema } from './exercise.js';

const strict = { additionalProperties: false };
const hash = Type.String({ pattern: '^[a-f0-9]{64}$' });
const choice = <T extends string>(values: readonly T[]) =>
  Type.Union(values.map((value) => Type.Literal(value)));
export const playerRoles = ['business-leadership', 'engineering-projects', 'internal-it'] as const;
export const decisions = ['containment', 'minimum-continuity', 'authorised-restoration'] as const;
export const eventKinds = [
  'files-unavailable',
  'scope-request',
  'continuity-request',
  'recovery-evidence-request',
  'restoration-decision-request',
] as const;
export const actionKinds = [
  'establish-scope',
  'preserve-evidence',
  'obtain-isolation-authority',
  'verify-contact-route',
  'select-minimum-working-set',
  'check-dependencies',
  'assess-deadline',
  'distinguish-target-and-estimate',
  'verify-recovery-source',
  'validate-engineering-integrity',
  'obtain-restoration-authority',
  'record-owner-and-review-time',
] as const;
export const noteKinds = [
  'simulation-only',
  'entry-point-unknown',
  'suppliers-by-facilitator',
  'no-agent-alert',
  'restore-evidence-unknown',
  'targets-not-capabilities',
  'authority-not-availability',
  'no-observed-action',
  'restoration-hold-valid',
  'grounded-clarifications-only',
] as const;
export const ProfileBindingSchema = Type.Object(
  { profileId: IdSchema, profileRevisionId: IdSchema, profileHash: hash },
  strict,
);
export const PackageTargetSchema = Type.Object(
  {
    ...ProfileBindingSchema.properties,
    reviewRevision: Type.Literal(8),
    reviewHash: hash,
  },
  strict,
);
export const EvidenceSelectionSchema = Type.Object(
  {
    claimId: IdSchema,
    status: choice(['fact', 'proposal', 'assumption', 'unknown', 'conflict'] as const),
  },
  strict,
);
export const PackagePreparationSchema = Type.Object(
  {
    sharedEvidence: Type.Array(EvidenceSelectionSchema, { maxItems: 6 }),
    exercisedPlanSourceId: IdSchema,
  },
  strict,
);
export const GeneratedPositionSchema = Type.Object(
  {
    position: Type.Integer({ minimum: 1, maximum: 5 }),
    elapsedMinutes: Type.Integer({ minimum: 0, maximum: 240 }),
    event: choice(eventKinds),
    decision: Type.Union([choice(decisions), Type.Null()]),
    messages: Type.Array(
      Type.Object(
        {
          roleId: choice(playerRoles),
          evidence: Type.Array(EvidenceSelectionSchema, { minItems: 1, maxItems: 6 }),
          questions: Type.Array(choice(actionKinds), {
            minItems: 1,
            maxItems: 4,
            uniqueItems: true,
          }),
        },
        strict,
      ),
      { minItems: 3, maxItems: 3 },
    ),
    expectedActions: Type.Array(choice(actionKinds), {
      minItems: 1,
      maxItems: 6,
      uniqueItems: true,
    }),
    evaluationCriteria: Type.Array(choice(actionKinds), {
      minItems: 1,
      maxItems: 6,
      uniqueItems: true,
    }),
    facilitatorNotes: Type.Array(choice(noteKinds), {
      minItems: 1,
      maxItems: 8,
      uniqueItems: true,
    }),
  },
  strict,
);

// Organisation prose is rendered from confirmed claims, never invented free text.
export const GeneratedPlanSchema = Type.Object(
  {
    ...ProfileBindingSchema.properties,
    objectives: Type.Array(choice(decisions), { minItems: 3, maxItems: 3, uniqueItems: true }),
    scenario: Type.Object(
      {
        family: Type.Literal('suspected-ransomware-file-unavailability'),
        systemId: IdSchema,
        serviceId: IdSchema,
        referenceClaimId: IdSchema,
        entryPoint: Type.Literal('unknown'),
        disruptionAtReference: Type.Literal(true),
      },
      strict,
    ),
    roles: Type.Array(
      Type.Object(
        {
          roleId: choice(playerRoles),
          personIds: Type.Array(IdSchema, { minItems: 1, maxItems: 4, uniqueItems: true }),
          briefingEvidence: Type.Array(EvidenceSelectionSchema, { minItems: 1, maxItems: 6 }),
        },
        strict,
      ),
      { minItems: 3, maxItems: 3 },
    ),
    facilitatorSupplierIds: Type.Array(IdSchema, { minItems: 2, maxItems: 2, uniqueItems: true }),
    positions: Type.Array(GeneratedPositionSchema, { minItems: 5, maxItems: 5 }),
  },
  strict,
);
export const PackageDraftSchema = Type.Object(
  {
    id: IdSchema,
    ownerId: IdSchema,
    revision: Type.Integer({ minimum: 1 }),
    target: PackageTargetSchema,
    status: choice(['queued', 'running', 'failed', 'review', 'frozen'] as const),
    plan: Type.Union([GeneratedPlanSchema, Type.Null()]),
    preparation: Type.Optional(PackagePreparationSchema),
    reviews: Type.Array(choice(['pending', 'accepted', 'rejected'] as const), { maxItems: 5 }),
    error: Type.Union([Type.String({ maxLength: 300 }), Type.Null()]),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
    runId: Type.Union([IdSchema, Type.Null()]),
    frozenPackageHash: Type.Union([hash, Type.Null()]),
    inputTokens: Type.Union([Type.Integer({ minimum: 0 }), Type.Null()]),
    outputTokens: Type.Union([Type.Integer({ minimum: 0 }), Type.Null()]),
  },
  strict,
);
export const PackageDraftViewSchema = Type.Object(
  { draft: PackageDraftSchema, hash, preview: Type.Union([PackageSchema, Type.Null()]) },
  strict,
);
export const GenerationContextSchema = Type.Object(
  {
    target: Type.Union([PackageTargetSchema, Type.Null()]),
    profile: Type.Union([ProfileSchema, Type.Null()]),
    ready: Type.Boolean(),
    reason: Type.String({ maxLength: 300 }),
    drafts: Type.Array(PackageDraftViewSchema, { maxItems: 10 }),
  },
  strict,
);
export const GeneratePackageSchema = Type.Object(
  { commandId: IdSchema, ...ProfileBindingSchema.properties },
  strict,
);
const revisionCommand = {
  commandId: IdSchema,
  expectedRevision: Type.Integer({ minimum: 1 }),
  expectedHash: hash,
};
export const ReviewPositionSchema = Type.Object(
  {
    ...revisionCommand,
    position: GeneratedPositionSchema,
    decision: choice(['pending', 'accepted', 'rejected'] as const),
  },
  strict,
);
export const FreezePackageSchema = Type.Object(revisionCommand, strict);
export const ReviewPreparationSchema = Type.Object(
  {
    ...revisionCommand,
    preparation: PackagePreparationSchema,
    roles: Type.Array(
      Type.Pick(GeneratedPlanSchema.properties.roles.items, [
        'roleId',
        'personIds',
        'briefingEvidence',
      ]),
      { minItems: 3, maxItems: 3 },
    ),
  },
  strict,
);
export const GenerationJobSchema = Type.Object(
  { id: IdSchema, target: PackageTargetSchema, profile: ProfileSchema },
  strict,
);
export const GenerationResultSchema = Type.Object(
  {
    id: IdSchema,
    failed: Type.Boolean(),
    output: Type.Unknown(),
    inputTokens: Type.Integer({ minimum: -1 }),
    outputTokens: Type.Integer({ minimum: -1 }),
  },
  strict,
);
export type PackageTarget = Static<typeof PackageTargetSchema>;
export type GeneratedPlan = Static<typeof GeneratedPlanSchema>;
export type GeneratedPosition = Static<typeof GeneratedPositionSchema>;
export type PackageDraft = Static<typeof PackageDraftSchema>;
export type PackageDraftView = Static<typeof PackageDraftViewSchema>;
export type GenerationContext = Static<typeof GenerationContextSchema>;
export type GeneratePackage = Static<typeof GeneratePackageSchema>;
export type ReviewPosition = Static<typeof ReviewPositionSchema>;
export type ReviewPreparation = Static<typeof ReviewPreparationSchema>;
export type PackagePreparation = Static<typeof PackagePreparationSchema>;
export type FreezePackage = Static<typeof FreezePackageSchema>;
export type EvidenceSelection = Static<typeof EvidenceSelectionSchema>;
