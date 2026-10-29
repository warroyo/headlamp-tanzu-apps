import React from 'react';
import { TanzuExplorer } from './components/TanzuExplorer';
import { registerDetailsViewSection, registerResourceTableColumnsProcessor, registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { TanzuAppColumn } from './components/TanzuAppColumn';
import type { HeadlampResource } from './components/TanzuAppColumn';
import { TanzuAppInfo } from './components/TanzuAppInfo';
import { mappings } from './config/mappings.ts';
import { appLabel, resolveAppIdentity } from './resolvers/appIdentity.ts';

const tables = new Set([
  'headlamp-pods', 'headlamp-deployments', 'headlamp-statefulsets',
  'headlamp-replicasets', 'headlamp-daemonsets', 'headlamp-jobs', 'headlamp-cronjobs',
]);

// Processors are generic over all table row types; narrow at the plugin boundary.
function isResource(value: unknown): value is HeadlampResource {
  return typeof value === 'object' && value !== null
    && ('metadata' in value || 'jsonData' in value);
}

registerResourceTableColumnsProcessor(({ id, columns }) => {
  if (!tables.has(id) || columns.some(column => typeof column !== 'string' && column.id === 'tanzu-application')) return columns;
  return [...columns, {
    id: 'tanzu-application',
    label: 'Tanzu Application',
    getValue: (resource: unknown) => isResource(resource) ? appLabel(resolveAppIdentity(resource, mappings)) : '',
    render: (resource: unknown) => isResource(resource) ? <TanzuAppColumn resource={resource} /> : '—',
  }];
});

registerDetailsViewSection(({ resource }) => resource ? <TanzuAppInfo resource={resource} /> : null);

registerSidebarEntry({
  parent: null,
  name: 'tanzu-apps',
  label: 'Tanzu Apps',
  url: '/tanzu-apps',
  icon: 'mdi:application-outline',
});

registerRoute({
  path: '/tanzu-apps',
  name: 'tanzu-apps',
  sidebar: 'tanzu-apps',
  exact: true,
  component: TanzuExplorer,
});
