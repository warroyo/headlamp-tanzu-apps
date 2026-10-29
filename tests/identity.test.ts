import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { defaultMappings } from '../src/config/mappings.ts';
import { appLabel, resolveAppIdentity } from '../src/resolvers/appIdentity.ts';
import type { Resource } from '../src/types/tanzu.ts';

const pod: Resource = JSON.parse(readFileSync(new URL('../fixtures/tanzu11.json', import.meta.url), 'utf8'));

test('resolves Tanzu 11 labels without mutating the workload', () => {
  const before = JSON.stringify(pod);
  assert.deepEqual(resolveAppIdentity(pod), {
    appName: 'orders-api', appId: 'app-example', orgName: 'engineering', orgId: 'org-example',
    spaceName: 'development', spaceId: 'space-example', processType: 'web', instanceIndex: '0',
    namespace: 'space-example',
  });
  assert.equal(JSON.stringify(pod), before);
});

test('Headlamp wrappers use the same synchronous name as raw Pods', () => {
  assert.equal(appLabel(resolveAppIdentity({ jsonData: pod })), 'orders-api');
});

test('missing friendly name falls back to app ID', () => {
  const labels = { ...pod.metadata!.labels };
  delete labels['tanzu.vmware.com/app'];
  assert.equal(appLabel(resolveAppIdentity({ ...pod, metadata: { ...pod.metadata, labels } })), 'app-example');
});

test('ordinary resources, runtime infrastructure, and Korifi labels are unresolved', () => {
  for (const labels of [{}, { 'app.kubernetes.io/name': 'nginx' },
    { 'tanzu.vmware.com/managed-by': 'rep' }, { 'tanzu.vmware.com/space_id': 'space-example' },
    { 'korifi.cloudfoundry.org/app-guid': 'old-app' }]) {
    assert.equal(resolveAppIdentity({ kind: 'Pod', metadata: { labels } }), undefined);
  }
});

test('blank labels do not invent an identity; values are trimmed', () => {
  assert.equal(resolveAppIdentity({ metadata: { labels: { 'tanzu.vmware.com/app': '  ' } } }), undefined);
  assert.equal(appLabel(resolveAppIdentity({ metadata: { labels: { 'tanzu.vmware.com/app': ' orders ' } } })), 'orders');
});

test('overlapping names in different namespaces keep their own IDs and context', () => {
  const other = { ...pod, metadata: { ...pod.metadata, namespace: 'space-other', labels: {
    ...pod.metadata!.labels, 'tanzu.vmware.com/app_id': 'app-other', 'tanzu.vmware.com/space_name': 'production',
  } } };
  assert.equal(resolveAppIdentity(other)?.appName, resolveAppIdentity(pod)?.appName);
  assert.notEqual(resolveAppIdentity(other)?.appId, resolveAppIdentity(pod)?.appId);
  assert.equal(resolveAppIdentity(other)?.spaceName, 'production');
  assert.equal(resolveAppIdentity(pod)?.spaceName, 'development');
});

test('custom annotation mappings can override labels', () => {
  const config = { fields: { ...defaultMappings.fields,
    appName: [{ source: 'annotation' as const, key: 'example.com/app-name' }, ...defaultMappings.fields.appName],
  } };
  const annotated = { ...pod, metadata: { ...pod.metadata, annotations: { 'example.com/app-name': 'custom-name' } } };
  assert.equal(appLabel(resolveAppIdentity(annotated, config)), 'custom-name');
  assert.equal(appLabel(resolveAppIdentity(pod, config)), 'orders-api');
});

test('does not infer app identity from Pod names or owner references', () => {
  assert.equal(resolveAppIdentity({ metadata: { name: 'lrp-example', namespace: 'space-example',
    ownerReferences: [{ kind: 'DiegoRepSet', name: 'rep' }],
  } }), undefined);
});
