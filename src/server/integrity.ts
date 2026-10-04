import { createHash } from 'node:crypto';

export function contentHash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function fingerprint(value: unknown): string {
  const canonical = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(canonical);
    if (item !== null && typeof item === 'object')
      return Object.fromEntries(
        Object.entries(item)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, child]) => [key, canonical(child)]),
      );
    return item;
  };
  return contentHash(JSON.stringify(canonical(value)));
}
