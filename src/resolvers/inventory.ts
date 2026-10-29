import { mappings } from '../config/mappings.ts';
import { resolveAppIdentity } from './appIdentity.ts';
import type { ResourceInput } from '../types/tanzu.ts';

export interface AppGroup<T> {
  key: string;
  name: string;
  id?: string;
  pods: T[];
}
export interface SpaceGroup<T> {
  key: string;
  name: string;
  id?: string;
  namespace: string;
  apps: AppGroup<T>[];
}
export interface OrgGroup<T> {
  key: string;
  name: string;
  id?: string;
  cluster: string;
  spaces: SpaceGroup<T>[];
}

/** Group by stable IDs and runtime boundaries, never by display name alone. */
export function buildInventory<T extends ResourceInput & { cluster?: string }>(pods: readonly T[]): OrgGroup<T>[] {
  const orgs = new Map<string, OrgGroup<T>>();
  for (const pod of pods) {
    const identity = resolveAppIdentity(pod, mappings);
    if (!identity) continue;
    const cluster = pod.cluster || '';
    const orgKey = JSON.stringify([cluster, identity.orgId || identity.orgName || null]);
    let org = orgs.get(orgKey);
    if (!org) {
      org = { key: orgKey, name: identity.orgName || identity.orgId || 'Unknown organization',
        id: identity.orgId, cluster, spaces: [] };
      orgs.set(orgKey, org);
    }
    const spaceKey = JSON.stringify([identity.namespace, identity.spaceId || identity.spaceName || null]);
    let space = org.spaces.find(item => item.key === spaceKey);
    if (!space) {
      space = { key: spaceKey, name: identity.spaceName || identity.spaceId || identity.namespace || 'Unknown space',
        id: identity.spaceId, namespace: identity.namespace, apps: [] };
      org.spaces.push(space);
    }
    const appKey = identity.appId || identity.appName!;
    let app = space.apps.find(item => item.key === appKey);
    if (!app) {
      app = { key: appKey, name: identity.appName || identity.appId!, id: identity.appId, pods: [] };
      space.apps.push(app);
    }
    app.pods.push(pod);
  }
  const byName = (a: { name: string; key: string }, b: { name: string; key: string }) =>
    a.name.localeCompare(b.name) || a.key.localeCompare(b.key);
  const result = [...orgs.values()].sort(byName);
  for (const org of result) {
    org.spaces.sort(byName);
    for (const space of org.spaces) space.apps.sort(byName);
  }
  return result;
}
