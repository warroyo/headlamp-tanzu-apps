import type { Field, Mappings, Resource } from '../types/tanzu.ts';

export function metadataFields(resource: Resource, mappings: Mappings): Partial<Record<Field, string>> {
  const result: Partial<Record<Field, string>> = {};
  for (const field of Object.keys(mappings.fields) as Field[]) {
    for (const mapping of mappings.fields[field]) {
      const values = mapping.source === 'label'
        ? resource.metadata?.labels : resource.metadata?.annotations;
      const value = values?.[mapping.key]?.trim();
      if (value) {
        result[field] = value;
        break;
      }
    }
  }
  return result;
}
