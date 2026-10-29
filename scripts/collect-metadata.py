#!/usr/bin/env python3
"""Read-only discovery; emit allowlisted metadata, never full workload specs."""
import argparse
import json
import subprocess
import sys


def kubectl(config, *args):
    result = subprocess.run(
        ['kubectl', '--kubeconfig', config, '--request-timeout=20s', *args, '-o', 'json'],
        capture_output=True, text=True, check=False,
    )
    if result.returncode:
        # Avoid persisting raw authentication/plugin errors in the shared artifact.
        raise RuntimeError('kubectl failed; check connectivity and read permissions')
    return json.loads(result.stdout)


def sanitize(item):
    metadata = item.get('metadata', {})
    # Values can still contain business names. Review the resulting file before sharing.
    prefixes = ('tanzu.vmware.com/',)
    output = {
        'apiVersion': item.get('apiVersion'), 'kind': item.get('kind'),
        'metadata': {key: metadata[key] for key in
                     ('name', 'namespace', 'uid', 'ownerReferences') if key in metadata},
    }
    for key in ('labels', 'annotations'):
        output['metadata'][key] = {
            k: v for k, v in metadata.get(key, {}).items() if k.startswith(prefixes)
        }
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--kubeconfig', required=True)
    parser.add_argument('--namespace', help='Limit workload discovery to one runtime namespace')
    options = parser.parse_args()
    # Discover CRDs first so absent runtime resources do not produce false errors.
    crds = kubectl(options.kubeconfig, 'get', 'crd').get('items', [])
    relevant = [item for item in crds if any(word in item['metadata']['name']
                for word in ('korifi', 'cloudfoundry', 'tanzu'))]
    output = {'crds': [], 'resources': [], 'errors': []}
    for item in relevant:
        spec = item.get('spec', {})
        output['crds'].append({
            'name': item['metadata']['name'], 'group': spec.get('group'),
            'names': spec.get('names'), 'scope': spec.get('scope'),
            'versions': [{key: version.get(key) for key in ('name', 'served', 'storage')}
                         for version in spec.get('versions', [])],
        })
    resources = ['pods', 'deployments', 'statefulsets', 'replicasets', 'jobs', 'cronjobs']
    wanted = {'DiegoRepSet'}
    resources += [item['metadata']['name'] for item in relevant
                  if item.get('spec', {}).get('names', {}).get('kind') in wanted]
    scope = ['-n', options.namespace] if options.namespace else ['-A']
    for resource in resources:
        try:
            items = kubectl(options.kubeconfig, 'get', resource, *scope).get('items', [])
            output['resources'].extend(sanitize(item) for item in items)
        except RuntimeError:
            output['errors'].append({'resource': resource, 'error': 'Read unavailable'})
    json.dump(output, sys.stdout, indent=2)
    sys.stdout.write('\n')


if __name__ == '__main__':
    try:
        main()
    except RuntimeError as error:
        sys.exit(str(error))
