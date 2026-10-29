import importlib.util
import unittest
from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'scripts' / 'collect-metadata.py'
spec = importlib.util.spec_from_file_location('collector', path)
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)


class CollectorTests(unittest.TestCase):
    def test_drops_specs_status_unrelated_annotations_and_managed_fields(self):
        result = collector.sanitize({
            'kind': 'Pod', 'apiVersion': 'v1',
            'metadata': {'name': 'example', 'managedFields': ['private'],
                         'annotations': {'kubectl.kubernetes.io/last-applied-configuration': 'private',
                                         'tanzu.vmware.com/app': 'orders'}},
            'spec': {'containers': [{'env': [{'value': 'private'}]}]},
            'status': {'private': True},
        })
        self.assertNotIn('spec', result)
        self.assertNotIn('status', result)
        self.assertNotIn('managedFields', result['metadata'])
        self.assertEqual(result['metadata']['annotations'],
                         {'tanzu.vmware.com/app': 'orders'})

    def test_runtime_specs_and_executor_annotations_are_excluded(self):
        result = collector.sanitize({'kind': 'DiegoRepSet', 'spec': {'secret': 'private'},
                                    'metadata': {'annotations': {'executor.tanzu/run-info': 'private'},
                                                 'labels': {'tanzu.vmware.com/app_id': 'example'}}})
        self.assertNotIn('spec', result)
        self.assertEqual(result['metadata']['annotations'], {})
        self.assertEqual(result['metadata']['labels'], {'tanzu.vmware.com/app_id': 'example'})


if __name__ == '__main__':
    unittest.main()
