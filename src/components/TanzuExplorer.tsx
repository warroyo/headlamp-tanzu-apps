import React from 'react';
import { Alert, Box, Breadcrumbs, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { Link, Loader, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type { TableColumn } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { buildInventory } from '../resolvers/inventory.ts';
import { resolveAppIdentity } from '../resolvers/appIdentity.ts';

const Pod = K8s.ResourceClasses.Pod;
type RuntimePod = InstanceType<typeof Pod>;
const ready = (pod: RuntimePod) => pod.jsonData.status?.conditions?.some(condition => condition.type === 'Ready' && condition.status === 'True') || false;
const readyCount = (pods: RuntimePod[]) => `${pods.filter(ready).length} / ${pods.length}`;
const podCount = (spaces: { apps: { pods: RuntimePod[] }[] }[]) => spaces.reduce((sum, space) => sum + space.apps.reduce((n, app) => n + app.pods.length, 0), 0);

export function TanzuExplorer() {
  const query = new URLSearchParams(useLocation().search);
  const result = Pod.useList();
  const [pods, error] = result;
  const orgs = buildInventory(pods || []);
  const orgKey = query.get('org');
  const spaceKey = query.get('space');
  const appKey = query.get('app');
  const org = orgs.find(item => item.key === orgKey);
  const space = org?.spaces.find(item => item.key === spaceKey);
  const app = space?.apps.find(item => item.key === appKey);
  const invalid = Boolean((orgKey && !org) || (spaceKey && !space) || (appKey && !app));
  const hasError = Boolean(error || result.errors?.length);
  const loading = result.isLoading || pods === null;
  const search = (org?: string, space?: string, app?: string) => Object.fromEntries(
    Object.entries({ org, space, app }).filter((entry): entry is [string, string] => entry[1] !== undefined));

  return <Box>
    <Breadcrumbs sx={{ mb: 2 }} aria-label="Tanzu navigation">
      <Link routeName="tanzu-apps">Tanzu Apps</Link>
      {org && <Link routeName="tanzu-apps" search={search(org.key)}>{org.name}</Link>}
      {space && <Link routeName="tanzu-apps" search={search(org!.key, space.key)}>{space.name}</Link>}
      {app && <Typography color="text.primary">{app.name}</Typography>}
    </Breadcrumbs>
    <Typography variant="h4" sx={{ mb: 1 }}>{app?.name || space?.name || org?.name || 'Tanzu Apps'}</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>
      {app ? `Application ID: ${app.id || 'Unknown'} · Namespace: ${space!.namespace}`
        : 'Browse organizations, spaces, and applications discovered from visible runtime Pods.'}
    </Typography>
    {hasError && <Alert severity="error" sx={{ mb: 2 }}>Unable to read some runtime Pods. Check cluster connectivity and Pod list permissions. Any results below may be incomplete.</Alert>}
    {loading ? <Loader title="Loading Tanzu applications" />
      : invalid ? <Alert severity="info">This selection has no visible runtime Pods. It may have stopped, moved, or become unavailable. Use the breadcrumbs to browse again.</Alert>
      : app ? <SectionBox title="Pod instances">
        <Table key={`pods:${app.key}`} data={app.pods} columns={[
          { id: 'name', header: 'Pod', accessorFn: pod => pod.getName(), Cell: ({ row }) => <Link kubeObject={row.original} /> },
          { id: 'process', header: 'Process', accessorFn: pod => resolveAppIdentity(pod)?.processType || 'Unknown' },
          { id: 'instance', header: 'Instance', accessorFn: pod => resolveAppIdentity(pod)?.instanceIndex || 'Unknown' },
          { id: 'phase', header: 'Phase', accessorFn: pod => pod.jsonData.status?.phase || 'Unknown' },
          { id: 'ready', header: 'Ready', accessorFn: pod => ready(pod) ? 'Yes' : 'No' },
          { id: 'restarts', header: 'Restarts', accessorFn: pod => pod.jsonData.status?.containerStatuses?.reduce((sum, container) => sum + container.restartCount, 0) || 0 },
          { id: 'node', header: 'Node', accessorFn: pod => pod.jsonData.spec?.nodeName || 'Unknown' },
        ] satisfies TableColumn<RuntimePod>[]} />
      </SectionBox>
      : space ? <SectionBox title="Applications">
        <Table key={`apps:${space.key}`} data={space.apps} columns={[
          { id: 'name', header: 'Application', accessorKey: 'name', Cell: ({ row }) => <Link routeName="tanzu-apps" search={search(org!.key, space.key, row.original.key)}>{row.original.name}</Link> },
          { id: 'id', header: 'Application ID', accessorFn: item => item.id || 'Unknown' },
          { id: 'processes', header: 'Processes', accessorFn: item => [...new Set(item.pods.map(pod => resolveAppIdentity(pod)?.processType || 'Unknown'))].sort().join(', ') },
          { id: 'pods', header: 'Pods', accessorFn: item => item.pods.length },
          { id: 'ready', header: 'Ready Pods', accessorFn: item => readyCount(item.pods) },
        ]} />
      </SectionBox>
      : org ? <SectionBox title="Spaces">
        <Table key={`spaces:${org.key}`} data={org.spaces} columns={[
          { id: 'name', header: 'Space', accessorKey: 'name', Cell: ({ row }) => <Link routeName="tanzu-apps" search={search(org.key, row.original.key)}>{row.original.name}</Link> },
          { id: 'namespace', header: 'Namespace', accessorKey: 'namespace' },
          { id: 'apps', header: 'Applications', accessorFn: item => item.apps.length },
          { id: 'pods', header: 'Pods', accessorFn: item => podCount([item]) },
        ]} />
      </SectionBox>
      : <SectionBox title="Organizations">
        <Table key="organizations" data={orgs} emptyMessage="No Tanzu application Pods are visible in the selected clusters and allowed namespaces." columns={[
          { id: 'name', header: 'Organization', accessorKey: 'name', Cell: ({ row }) => <Link routeName="tanzu-apps" search={search(row.original.key)}>{row.original.name}</Link> },
          { id: 'cluster', header: 'Cluster', accessorFn: item => item.cluster || 'Current cluster' },
          { id: 'spaces', header: 'Spaces', accessorFn: item => item.spaces.length },
          { id: 'apps', header: 'Applications', accessorFn: item => item.spaces.reduce((sum, space) => sum + space.apps.length, 0) },
          { id: 'pods', header: 'Pods', accessorFn: item => podCount(item.spaces) },
        ]} />
      </SectionBox>}
  </Box>;
}
