# Headlamp Tanzu Application Explorer

[![CI](https://github.com/warroyo/headlamp-tanzu-apps/actions/workflows/ci.yaml/badge.svg)](https://github.com/warroyo/headlamp-tanzu-apps/actions/workflows/ci.yaml) [![Release](https://github.com/warroyo/headlamp-tanzu-apps/actions/workflows/release.yaml/badge.svg)](https://github.com/warroyo/headlamp-tanzu-apps/actions/workflows/release.yaml) [![Latest release](https://img.shields.io/github/v/release/warroyo/headlamp-tanzu-apps?sort=semver)](https://github.com/warroyo/headlamp-tanzu-apps/releases)

## Overview

Browse Tanzu Platform 11 applications running on a VKS runtime backend from Headlamp. The **Tanzu Apps** view drills from organization to space, app, and Pod instances. It shows readiness, process, restart, and node details, and links into Headlamp’s Pod details. It also adds an app column and details section to existing workload views.

The explorer groups live Pods using Tanzu labels. Apps without running Pods and empty orgs or spaces do not appear. It needs Pod read access in the selected clusters and namespaces; it does not need Cloud Foundry credentials or app CRDs.

## How it works

1. Headlamp lists Pods using the user’s existing cluster access.
2. The plugin groups Pods by cluster, org, space, and app IDs from `tanzu.vmware.com/` labels.
3. The app view shows Pod state and links to Headlamp’s native Pod details.

## Quick start

Requires Headlamp Desktop or web version 0.46.0 or compatible, Node.js 22.6+, and npm.

1. Download the [latest desktop plugin archive](https://github.com/warroyo/headlamp-tanzu-apps/releases/latest).
2. On Linux or macOS, extract it into Headlamp’s plugin directory:

   ```sh
   mkdir -p ~/.config/Headlamp/plugins
   tar -xzf headlamp-tanzu-apps-*.tar.gz -C ~/.config/Headlamp/plugins
   ```

   On Windows, use `%APPDATA%/Headlamp/Config/plugins`.
3. Restart Headlamp, select the VKS cluster, and open **Tanzu Apps** in the sidebar.

For local development, run `npm ci`, `npm run build`, and `npm run package`. See [development and release](docs/development.md) for tests, browser validation, and release steps. The archive contains no kubeconfig or credentials.

## Repo structure

- `src/` — Headlamp plugin, Tanzu label resolver, and org/space/app explorer.
- `tests/` — resolver, collector, bundle, and browser tests.
- `fixtures/` — sanitized synthetic Tanzu 11 Pod metadata.
- `.github/workflows/` — CI and tagged release workflows.
- `scripts/` — metadata collector.
- `docs/development.md` — build, validation, install, and release details.
