# Headlamp Tanzu Application Explorer

Browse Tanzu Platform 11 apps on a VKS runtime backend through the top-level
**Tanzu Apps** menu: organization → space → application → Pod instances.
Application pages show readiness, process types, instance indexes, restart counts,
and nodes, with native Headlamp Pod details and logs controls. A Tanzu Application
column and resource details section are also available in existing workload views.

The explorer watches Pods through Headlamp's authenticated client in the selected
clusters and allowed namespaces. It groups the verified Tanzu labels locally; no
Cloud Foundry credentials or application CRDs are needed. Existing workload
columns and details resolve labels synchronously without additional API calls.
Only apps with visible runtime Pods appear; empty orgs/spaces and stopped apps
without Pods require a future Cloud Foundry inventory integration.

## Current validation

- All 23 live application Pods across seven runtime namespaces resolved app ID,
  app name, org ID/name, space ID/name, process type, and instance index on
  2026-10-29. Metadata collection reported no read errors.
- Eleven resolver/grouping tests, two collector tests, and three production
  bundle smoke tests pass. Grouping keeps clusters, GUIDs, and namespaces separate.
- SDK 0.14.0 typecheck, production build, and package generation pass.
- Two Playwright browser tests pass against live Headlamp v0.46.0: full
  org/space/app drill-down, correct table headings, direct URL refresh, native
  Pod details and logs control, breadcrumbs, browser history, and stale selections.
- Live inventory shows 3 orgs, 7 spaces, 18 apps, and 23 Pods. Richer operational
  views, routes, and the relationship graph remain future work.

## Identity mappings

The following labels were verified on live Tanzu 11 app Pods:

| Field | Label |
| --- | --- |
| App name | `tanzu.vmware.com/app` |
| App GUID | `tanzu.vmware.com/app_id` |
| Organization | `tanzu.vmware.com/organization_name` |
| Organization GUID | `tanzu.vmware.com/organization_id` |
| Space | `tanzu.vmware.com/space_name` |
| Space GUID | `tanzu.vmware.com/space_id` |
| Process type | `tanzu.vmware.com/process_type` |
| Instance index | `tanzu.vmware.com/instance_index` |

The friendly name is available immediately for table search and sorting. Missing
names fall back to the app GUID. Missing context is shown as Unknown in details.
Ordinary Kubernetes labels, Pod names, and owner references do not establish app
identity. Resources without an app name or ID label show a dash in the column
and no app details section. Infrastructure resources such as DiegoRepSets are
not treated as applications merely because they belong to the runtime.

Mappings are configurable in `src/config/mappings.ts`; rebuild after changes.
Each field accepts an ordered list of `{ source: 'label' | 'annotation', key }`
entries. The first nonempty value wins. Labels can be absent or transformed by
other platform versions; only this live Tanzu 11 runtime has been checked.

## Develop and build

Requires Node 22.6+ and npm. Validated here using Node 24.19 and npm 11.17.

```sh
npm ci
npm test
python3 -B -m unittest discover -s tests -p '*_test.py'
npm run typecheck
npm run build
npm run test:bundle
# With the local Headlamp instance running and Chromium installed:
# npx playwright install chromium --only-shell
npm run test:e2e
npm run package
```

`dist/main.js` is the production plugin bundle. Packaging produces
`headlamp-tanzu-apps-0.2.0.tar.gz` in Headlamp's plugin archive format.
`npm start` watches and copies development builds to the local Headlamp desktop
plugin directory. Enable Plugin Development Mode in the desktop settings when
using that workflow.

## Local browser access

The reproducible container launcher lives in the machine provisioning repo:

```sh
bash ~/workspace/dev-environment/provision/headlamp-dev.sh start
bash ~/workspace/dev-environment/provision/headlamp-dev.sh status
bash ~/workspace/dev-environment/provision/headlamp-dev.sh logs
bash ~/workspace/dev-environment/provision/headlamp-dev.sh stop
```

It runs Headlamp v0.46.0 on port 4466, with the existing kubeconfig and plugin
mounted read-only. It does not deploy anything to the cluster. The defaults use
this workspace and `~/.kube/goad-tanzu.kubeconfig`. Override the paths using
`HEADLAMP_PLUGIN_REPO` and `HEADLAMP_KUBECONFIG` on first start. The container is
started on demand and is not configured to restart on boot. Rebuild the plugin
and refresh the browser after changes.

Open **Tanzu Apps** in the cluster sidebar. Select an organization, space, and
application to see its Pods. Breadcrumbs and browser history return to earlier
levels; URLs retain the selected GUIDs. Each table supports search and sorting.
Pod links follow Headlamp's native details behavior, including its details drawer.
The original Workloads → Pods column and app details section remain available.

## Install in Headlamp Desktop

Copy `headlamp-tanzu-apps-0.2.0.tar.gz` to the machine running Headlamp. On
Linux/macOS, extract it into the local development plugin directory:

```sh
mkdir -p ~/.config/Headlamp/plugins
tar -xzf headlamp-tanzu-apps-0.2.0.tar.gz -C ~/.config/Headlamp/plugins
```

Enable **Settings → Plugins → Plugin Development Mode**, then restart Headlamp.
On Windows, the documented directory is `%APPDATA%/Headlamp/Config/plugins`.
Select the VKS cluster and open **Tanzu Apps** in the sidebar. The desktop client
needs its own working kubeconfig, cluster connectivity, and Pod read permissions;
the plugin archive contains no kubeconfig or credentials. Browser integration has
been tested on Headlamp v0.46.0; a desktop installation has not been exercised here.

See [Headlamp manual plugin installation](https://headlamp.dev/docs/latest/development/plugins/building/)
and [Plugin Development Mode](https://headlamp.dev/docs/latest/development/plugins/getting-started/).

## Metadata collection

```sh
python3 scripts/collect-metadata.py \
  --kubeconfig "$HOME/.kube/goad-tanzu.kubeconfig" \
  > cluster-metadata.json
```

Optionally pass `--namespace` to limit workload reads. The collector keeps
resource identities, owner references, and `tanzu.vmware.com/` labels/annotations.
It excludes specs, status, environment values, executor run-info, and Secret
contents. Output is gitignored; review business names before sharing.

The old HANDOFF.md records the earlier implementation and connectivity failures;
this README reflects the current Tanzu 11 implementation.

## References

- [Headlamp plugin functionality](https://headlamp.dev/docs/latest/development/plugins/functionality/)
- [Headlamp container and plugin directory options](https://headlamp.dev/docs/latest/development/)
- [Headlamp SDK source](https://github.com/kubernetes-sigs/headlamp/tree/main/plugins/headlamp-plugin)
