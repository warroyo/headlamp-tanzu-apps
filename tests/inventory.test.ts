import assert from 'node:assert/strict';
import test from 'node:test';
import { buildInventory } from '../src/resolvers/inventory.ts';

function pod(cluster: string, namespace: string, org: string, space: string, app: string, process = 'web') {
  return { cluster, kind: 'Pod', metadata: { name: `${app}-${process}`, namespace, labels: {
    'tanzu.vmware.com/app_id': app, 'tanzu.vmware.com/app': 'same-app-name',
    'tanzu.vmware.com/organization_id': org, 'tanzu.vmware.com/organization_name': 'same-org-name',
    'tanzu.vmware.com/space_id': space, 'tanzu.vmware.com/space_name': 'same-space-name',
    'tanzu.vmware.com/process_type': process,
  } } };
}

test('groups instances and processes into one app and ignores infrastructure', () => {
  const web = pod('cluster-a', 'ns', 'org', 'space', 'app');
  const worker = pod('cluster-a', 'ns', 'org', 'space', 'app', 'worker');
  const before = JSON.stringify([web, worker]);
  const result = buildInventory([web, worker, { cluster: 'cluster-a', metadata: { name: 'rep' } }]);
  assert.equal(result.length, 1);
  assert.equal(result[0].spaces.length, 1);
  assert.equal(result[0].spaces[0].apps.length, 1);
  assert.deepEqual(result[0].spaces[0].apps[0].pods, [web, worker]);
  assert.equal(JSON.stringify([web, worker]), before);
});

test('same display names and IDs never merge across cluster and namespace boundaries', () => {
  const result = buildInventory([
    pod('a', 'ns1', 'org1', 'space', 'app'),
    pod('b', 'ns1', 'org1', 'space', 'app'),
    pod('a', 'ns2', 'org1', 'space', 'app'),
    pod('a', 'ns1', 'org2', 'space', 'app'),
    pod('a', 'ns1', 'org1', 'space', 'other-app'),
  ]);
  assert.equal(result.length, 3);
  const org = result.find(item => item.cluster === 'a' && item.id === 'org1')!;
  assert.equal(org.spaces.length, 2);
  assert.equal(org.spaces.find(item => item.namespace === 'ns1')!.apps.length, 2);
});

test('missing context uses explicit unknown groups and empty inventory stays empty', () => {
  assert.deepEqual(buildInventory([]), []);
  const result = buildInventory([{ metadata: { namespace: 'space-x', labels: { 'tanzu.vmware.com/app_id': 'app-x' } } }]);
  assert.equal(result[0].name, 'Unknown organization');
  assert.equal(result[0].spaces[0].name, 'space-x');
  assert.equal(result[0].spaces[0].apps[0].name, 'app-x');
});
