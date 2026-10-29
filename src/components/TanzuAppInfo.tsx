import React from 'react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { mappings } from '../config/mappings.ts';
import { resolveAppIdentity } from '../resolvers/appIdentity.ts';
import type { HeadlampResource } from './TanzuAppColumn.tsx';

export function TanzuAppInfo({ resource }: { resource: HeadlampResource }) {
  const identity = resolveAppIdentity(resource, mappings);
  if (!identity) return null;
  const rows = [
    ['Application', identity.appName],
    ['Application ID', identity.appId],
    ['Organization', identity.orgName || identity.orgId],
    ['Organization ID', identity.orgId],
    ['Space', identity.spaceName || identity.spaceId],
    ['Space ID', identity.spaceId],
    ['Namespace', identity.namespace],
    ['Process', identity.processType],
    ['Instance index', identity.instanceIndex],
  ];
  return <SectionBox title="Tanzu Application">
    <dl style={{ padding: '0 16px' }}>
      {rows.map(([label, value]) => <React.Fragment key={label}>
        <dt style={{ fontWeight: 600 }}>{label}</dt>
        <dd style={{ margin: '0 0 12px', overflowWrap: 'anywhere' }}>{value || 'Unknown'}</dd>
      </React.Fragment>)}
    </dl>
  </SectionBox>;
}
