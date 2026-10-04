import {
  PackageSchema,
  type ExercisePackage,
  type Member,
  type Run,
} from '../contracts/exercise.js';
import { readStored } from './validation.js';

export function readPackage(value: unknown): ExercisePackage {
  const definition = readStored(PackageSchema, value);
  const roles = new Set(definition.roles.map((role) => role.id));
  const injects = new Set(definition.injects.map((inject) => inject.id));
  const gaps = new Set(definition.briefing.gaps.map((gap) => gap.id));
  if (
    roles.size !== definition.roles.length ||
    injects.size !== definition.injects.length ||
    gaps.size !== definition.briefing.gaps.length
  )
    throw new Error('Duplicate exercise reference.');
  if (definition.injects.some((inject) => inject.recipientRoleIds.some((role) => !roles.has(role))))
    throw new Error('Unknown recipient role.');
  if ((definition.kind === 'development-skeleton') !== (definition.injects.length === 0))
    throw new Error(
      'A skeleton cannot contain playable injects; an engineering fixture needs content.',
    );
  return definition;
}

export function checkRunBinding(run: Run, definition: ExercisePackage, members: Member[]): void {
  if (
    run.track !== definition.track ||
    run.packageId !== definition.id ||
    run.packageRevisionId !== definition.revisionId
  )
    throw new Error('Run and package binding mismatch.');
  const roles = new Set(definition.roles.map((role) => role.id));
  if (
    new Set(members.map((member) => member.actorId)).size !== members.length ||
    !members.some((member) => member.kind === 'facilitator') ||
    members.some((member) =>
      member.kind === 'participant'
        ? !member.roleId || !roles.has(member.roleId)
        : member.roleId !== null,
    )
  )
    throw new Error('Invalid exercise membership.');
}
