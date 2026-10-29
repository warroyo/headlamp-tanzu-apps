# Handoff: Build the Headlamp Tanzu Application Explorer

2026-10-29 · project `headlamp-tanzu-apps` · no Git repository, branch, or HEAD
For: Resume with network access, inspect the deployed Tanzu apps, and validate M1/M2.

## Goal
Make Tanzu-pushed apps recognizable in Headlamp through friendly names and org/space context while preserving Kubernetes names and actions. The user supplied a phased plan; M1 (existing table columns) and M2 (existing details sections) are the first usable release.

## State
- Done and verified: created the project at `/home/warroyo/workspace/headlamp-tanzu-apps`. Eleven resolver cases pass with `node --experimental-strip-types tests/identity.test.ts`; two collector tests pass with `python3 -B -m unittest discover -s tests -p '*_test.py'`.
- Done and verified: cached esbuild parsed/bundled `src/index.tsx` with packages external. This checks syntax only, not SDK imports, types, or runtime behavior.
- Done but not verified: Headlamp table column and details section registration, authenticated namespaced CFApp lookup, query caching behavior, SDK compatibility, and target table IDs. No plugin has been loaded in Headlamp.
- Done but not verified against the cluster: configurable label/annotation mappings, upstream-shaped synthetic fixtures, and metadata-only collection script. No live manifests have been collected.
- Discussed only: M3 inventory, M4 operational app details, and M5 relationship graph. None are implemented.

## Decisions
- Keep identity resolution in plain TypeScript, independent of Headlamp and React.
- Defaults use upstream `korifi.cloudfoundry.org/app-guid`, legacy runner annotations, and `CFApp.spec.displayName`. Validate these against actual Tanzu resources before claiming support.
- Match CFApps by configured API group, kind, exact name, and namespace. UI queries use the resource's explicit Headlamp cluster.
- Preserve built-in names/links/actions. Leave ordinary Kubernetes resources unresolved; generic `app.kubernetes.io/name` is opt-in.
- Fall back to available workload metadata/GUID on failed CFApp reads. Org/space currently come from metadata; no CFOrg/CFSpace joins or transitive owner traversal.
- Sort/search values currently use synchronous metadata/GUIDs; asynchronously fetched friendly names update cells but not the search/sort index. This is a known M1 limitation.

## What didn't work
- Live read-only kubectl using the user-provided kubeconfig failed: `Unable to connect to the server: dial tcp 10.47.7.89:6443: socket: operation not permitted`.
- Shell curl failed with `Could not resolve host: raw.githubusercontent.com`.
- npm install failed with `getaddrinfo EAI_AGAIN registry.npmjs.org`. No dependencies or lockfile were installed. Build/typecheck failed with `headlamp-plugin: not found` and `tsc: not found`.
- `npm test` reported one file passing in this environment; direct execution of `tests/identity.test.ts` displayed all 11 passing cases.
- Will then provided global instructions: launch with **`cx` or `codex-open`**, which enable network in the workspace-write sandbox. Plain `codex` or a new ChatGPT app thread may lack it. Tell Will on failure; do not work around the sandbox. This machine-specific guidance supersedes the earlier generic config advice.

## Working tree
All project files are new and should be retained. Neither this directory nor the workspace is a usable Git repository; no commits, stashes, remotes, PRs, or issues were created. No deployment or live cluster changes were made. With no `.git/info/exclude` available, the handoff has not been added to a Git exclude file.

## Live state
No plugin dev server, port-forward, or cluster mutation was started. Temporary syntax artifact: `/tmp/headlamp-tanzu-apps-syntax.js`; failed install cache/logs: `/tmp/headlamp-tanzu-npm-cache`. Neither is needed to resume. The initial `npm view` had a tool session ID of 4888; do not depend on it.

## References
- [README](README.md): commands, architecture, known limits, upstream references, and smoke-test checklist.
- [Entry point](src/index.tsx), [UI hook](src/hooks/useTanzuApp.ts), [mappings](src/config/mappings.ts), [resolver](src/resolvers/appIdentity.ts).
- [Metadata collector](scripts/collect-metadata.py), [synthetic fixtures](fixtures/korifi.json).
- Kubeconfig supplied by Will: `~/.kube/goad-tanzu.kubeconfig`. Do not copy its contents or credentials into documentation, fixtures, or commits.
- Provisioning/config source: `~/workspace/dev-environment`. Global instructions were supplied in the conversation and should be retained in the next session.

## Next steps
1. Launch the next session with `cx` or `codex-open`, change to `/home/warroyo/workspace/headlamp-tanzu-apps`, and read this handoff.
2. Test read-only cluster access: `kubectl --kubeconfig ~/.kube/goad-tanzu.kubeconfig --request-timeout=15s get crd`. If authentication fails, use `lab-creds` before asking Will to log in. If network remains blocked, tell Will.
3. Run `python3 scripts/collect-metadata.py --kubeconfig ~/.kube/goad-tanzu.kubeconfig > cluster-metadata.json`. Review metadata, actual CRD versions, and app/workload relationships; adapt mappings and add sanitized representative fixtures without credentials.
4. Run `npm install`, `npm run typecheck`, `npm test`, the Python tests, and `npm run build`. Fix actual SDK type/import/registration issues; create a lockfile. SDK `^0.14.0` is declared based on upstream source and has not been installed or matched to the user's Headlamp version.
5. Load in Headlamp and validate actual friendly names, details, denied/missing CFApp behavior, namespace/cluster switching, and built-in resource links/actions. Address the sort/search limitation before calling the release complete if required.
6. Continue later milestones only after the first release is validated. Do not deploy to or modify the cluster merely to inspect resources.

## Open questions
Which Headlamp version and deployment should be used for runtime validation? Which metadata and Korifi CRD versions does this Tanzu installation actually expose? The user has supplied access, but neither question has been resolved.

## Suggested skills
- `resume-handoff`: read and brief on this document; that skill stops after the briefing unless further work is requested.
- `lab-creds`: client-lab auth/token refresh if needed; `homelab` if lab connectivity/tunnels require investigation.
- `github-repo`: if creating a warroyo-owned repository or revising its documentation. No Git remote exists yet.
- `handoff`: refresh this document before another session change. Do not write vault notes or dev-log entries unless requested.
