import { Type, type Static } from '@sinclair/typebox';
import { ClaimStatusSchema, IdSchema } from './profile.js';

const strict = { additionalProperties: false };
const text = (maxLength: number) => Type.String({ minLength: 1, maxLength });

// Application-owned threat library entries; new families need reviewed content first (ADR-037).
export const threatFamilyIds = ['suspected-ransomware-file-unavailability'] as const;
export const ThreatFamilyIdSchema = Type.Union(threatFamilyIds.map((id) => Type.Literal(id)));

// One profile claim on the mapped pathway, keeping its original knowledge state.
export const PathwayClaimSchema = Type.Object(
  { claimId: IdSchema, status: ClaimStatusSchema, text: text(400) },
  strict,
);
const PathwayNodeSchema = Type.Object(
  {
    entityId: IdSchema,
    name: text(160),
    claims: Type.Array(PathwayClaimSchema, { maxItems: 20 }),
  },
  strict,
);

// Facilitator-only, derived from the immutable plan and confirmed profile; never in a package.
export const ThreatPathwaySchema = Type.Object(
  {
    libraryVersion: Type.Literal('threat-library-1'),
    familyId: ThreatFamilyIdSchema,
    title: text(160),
    entryStatement: text(400),
    entryHypotheses: Type.Array(PathwayNodeSchema, { maxItems: 20 }),
    target: PathwayNodeSchema,
    services: Type.Array(
      Type.Object({ ...PathwayNodeSchema.properties, selected: Type.Boolean() }, strict),
      { maxItems: 20 },
    ),
    recovery: Type.Array(PathwayClaimSchema, { maxItems: 30 }),
    authority: Type.Array(PathwayClaimSchema, { maxItems: 20 }),
    suppliers: Type.Array(PathwayNodeSchema, { maxItems: 10 }),
    gaps: Type.Array(PathwayClaimSchema, { maxItems: 60 }),
  },
  strict,
);

// Whether a library family applies to the confirmed profile, with the eligible choices.
export const FamilyAssessmentSchema = Type.Object(
  {
    libraryVersion: Type.Literal('threat-library-1'),
    familyId: ThreatFamilyIdSchema,
    title: text(160),
    summary: text(600),
    references: Type.Array(text(300), { maxItems: 6 }),
    rules: Type.Array(text(300), { maxItems: 10 }),
    applicable: Type.Boolean(),
    unmet: Type.Array(text(300), { maxItems: 10 }),
    // Each service-to-system pathway with the suppliers linked to it.
    targets: Type.Array(
      Type.Object(
        {
          systemId: IdSchema,
          serviceId: IdSchema,
          name: text(330),
          supplierIds: Type.Array(IdSchema, { maxItems: 10 }),
        },
        strict,
      ),
      { maxItems: 30 },
    ),
    referenceClaimIds: Type.Array(IdSchema, { maxItems: 20 }),
  },
  strict,
);

export type ThreatFamilyId = (typeof threatFamilyIds)[number];
export type PathwayClaim = Static<typeof PathwayClaimSchema>;
export type ThreatPathway = Static<typeof ThreatPathwaySchema>;
export type FamilyAssessment = Static<typeof FamilyAssessmentSchema>;
