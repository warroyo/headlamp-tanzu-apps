# Development and release

## Build and test

Use Node.js 22.6 or later and npm.

```sh
npm ci
npm test
python3 -B -m unittest discover -s tests -p '*_test.py'
npm run test:bundle
npm run typecheck
npm run build
npm run test:e2e
npm run package
```

The Playwright tests require Chromium and a running Headlamp instance with access to Tanzu 11 Pods. Install the browser with `npx playwright install chromium --only-shell`. Set `HEADLAMP_URL` and `HEADLAMP_CLUSTER` to test another instance.

`npm run package` creates `headlamp-tanzu-apps-<version>.tar.gz` for Headlamp Desktop. To install manually, extract the archive into `~/.config/Headlamp/plugins` on Linux or macOS, or `%APPDATA%/Headlamp/Config/plugins` on Windows. Restart Headlamp after enabling Plugin Development Mode.

## Release

CI runs unit tests, bundle tests, TypeScript checks, production build, and Python collector tests on pushes to `main` and pull requests. A tag matching `v*` runs the same checks, builds the Headlamp archive, verifies that the tag version matches `package.json`, and attaches the archive to a GitHub release.

To publish a release, update the package version and lockfile, merge the change to `main`, then push the matching tag. For example, version `0.3.0` uses tag `v0.3.0`.

The browser smoke test is run locally against a Headlamp instance. CI does not deploy Headlamp or connect to a cluster.

## Verified Tanzu labels

| Field | Label |
| --- | --- |
| App name and ID | `tanzu.vmware.com/app`, `tanzu.vmware.com/app_id` |
| Organization name and ID | `tanzu.vmware.com/organization_name`, `tanzu.vmware.com/organization_id` |
| Space name and ID | `tanzu.vmware.com/space_name`, `tanzu.vmware.com/space_id` |
| Process and instance | `tanzu.vmware.com/process_type`, `tanzu.vmware.com/instance_index` |

These labels were checked on 23 live app Pods across seven namespaces on 2026-10-29. Only Tanzu Platform 11 with this VKS runtime has been validated. Apps and spaces without visible Pods are outside the current inventory.
