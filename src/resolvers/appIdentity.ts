import { defaultMappings } from '../config/mappings.ts';
import type { AppIdentity, Mappings, Resource, ResourceInput } from '../types/tanzu.ts';
import { metadataFields } from './labelResolver.ts';

export function rawResource(input: ResourceInput): Resource {
  return 'jsonData' in input ? input.jsonData : input;
}

/** Resolve only the resource's own labels; no cross-cluster or API lookups. */
export function resolveAppIdentity(
  input: ResourceInput,
  mappings: Mappings = defaultMappings,
): AppIdentity | undefined {
  const resource = rawResource(input);
  const fields = metadataFields(resource, mappings);
  if (!fields.appId && !fields.appName) return undefined;
  return { ...fields, namespace: resource.metadata?.namespace || '' };
}

export function appLabel(identity: AppIdentity | undefined): string {
  return identity?.appName || identity?.appId || '';
}
