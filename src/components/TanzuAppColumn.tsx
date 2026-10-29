import React from 'react';
import { mappings } from '../config/mappings.ts';
import { appLabel, resolveAppIdentity } from '../resolvers/appIdentity.ts';
import type { ResourceInput } from '../types/tanzu.ts';

export type HeadlampResource = ResourceInput & { cluster?: string };

export function TanzuAppColumn({ resource }: { resource: HeadlampResource }) {
  const identity = resolveAppIdentity(resource, mappings);
  const context = [identity?.orgName || identity?.orgId, identity?.spaceName || identity?.spaceId]
    .filter(Boolean).join(' / ');
  const title = [context, identity?.appId].filter(Boolean).join(' · ');
  return <span title={title || undefined}>{appLabel(identity) || '—'}</span>;
}
