import { Type, type Static } from '@sinclair/typebox';
import { IdSchema } from './profile.js';

const strict = { additionalProperties: false };
const hash = Type.String({ pattern: '^[a-f0-9]{64}$' });
export const imagePromptVersion = 'story-image-1';
export const maxImageBytes = 8 * 1024 * 1024;
export const ImageReferenceSchema = Type.Object(
  {
    id: IdSchema,
    sha256: hash,
    mimeType: Type.Literal('image/png'),
    width: Type.Integer({ minimum: 1, maximum: 4096 }),
    height: Type.Integer({ minimum: 1, maximum: 4096 }),
    byteLength: Type.Integer({ minimum: 1, maximum: maxImageBytes }),
  },
  strict,
);
export const ImageAttachmentSchema = Type.Object(
  {
    position: Type.Integer({ minimum: 1, maximum: 5 }),
    artefactIndex: Type.Integer({ minimum: 0, maximum: 1 }),
    sourceHash: hash,
    image: ImageReferenceSchema,
  },
  strict,
);
export const DeliveredImageSchema = Type.Object(
  {
    ...ImageReferenceSchema.properties,
    title: Type.String({ minLength: 1, maxLength: 160 }),
  },
  strict,
);
export const InjectImageSchema = Type.Object(
  {
    ...DeliveredImageSchema.properties,
    recipientRoleIds: Type.Array(IdSchema, { minItems: 1, maxItems: 3, uniqueItems: true }),
  },
  strict,
);
export const ImageRequestSchema = Type.Object(
  {
    id: IdSchema,
    ownerId: IdSchema,
    packageId: IdSchema,
    revision: Type.Integer({ minimum: 1 }),
    expectedRevision: Type.Integer({ minimum: 1 }),
    expectedHash: hash,
    position: Type.Integer({ minimum: 1, maximum: 5 }),
    artefactIndex: Type.Integer({ minimum: 0, maximum: 1 }),
    sourceHash: hash,
    promptVersion: Type.Literal(imagePromptVersion),
    prompt: Type.String({ minLength: 1, maxLength: 6000 }),
    status: Type.Union(
      ['queued', 'running', 'ready', 'failed'].map((value) => Type.Literal(value)),
    ),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
    error: Type.Union([Type.String({ maxLength: 300 }), Type.Null()]),
    image: Type.Union([ImageReferenceSchema, Type.Null()]),
    inputTokens: Type.Union([Type.Integer({ minimum: 0 }), Type.Null()]),
    outputTokens: Type.Union([Type.Integer({ minimum: 0 }), Type.Null()]),
  },
  strict,
);
export const ImageJobSchema = Type.Pick(ImageRequestSchema, ['id', 'promptVersion', 'prompt']);
export const ImageRequestViewSchema = Type.Object(
  { ...ImageRequestSchema.properties, current: Type.Boolean() },
  strict,
);
const command = {
  commandId: IdSchema,
  expectedRevision: Type.Integer({ minimum: 1 }),
  expectedHash: hash,
  position: Type.Integer({ minimum: 1, maximum: 5 }),
  artefactIndex: Type.Integer({ minimum: 0, maximum: 1 }),
};
export const GenerateImageSchema = Type.Object(command, strict);
export const AttachImageSchema = Type.Object(
  { ...command, imageId: Type.Union([IdSchema, Type.Null()]) },
  strict,
);
export const ImageResultSchema = Type.Object(
  {
    id: IdSchema,
    failed: Type.Boolean(),
    pngBase64: Type.Union([
      Type.String({ minLength: 1, maxLength: Math.ceil(maxImageBytes / 3) * 4 }),
      Type.Null(),
    ]),
    inputTokens: Type.Integer({ minimum: -1 }),
    outputTokens: Type.Integer({ minimum: -1 }),
  },
  strict,
);
export type ImageReference = Static<typeof ImageReferenceSchema>;
export type ImageAttachment = Static<typeof ImageAttachmentSchema>;
export type ImageRequest = Static<typeof ImageRequestSchema>;
export type GenerateImage = Static<typeof GenerateImageSchema>;
export type AttachImage = Static<typeof AttachImageSchema>;
export type DeliveredImage = Static<typeof DeliveredImageSchema>;
