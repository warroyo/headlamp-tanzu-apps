import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import React from 'react';
import * as ReactJSX from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';

const pod = JSON.parse(readFileSync(new URL('../fixtures/tanzu11.json', import.meta.url), 'utf8'));
let processor, details, route, sidebar;
// Headlamp supplies these globals when loading the production UMD bundle.
vm.runInNewContext(readFileSync(new URL('../dist/main.js', import.meta.url), 'utf8'), {
  pluginLib: { React, ReactJSX, K8s: { ResourceClasses: { Pod: {} } },
    CommonComponents: { SectionBox: ({ title, children }) => React.createElement('section', null, title, children) },
    registerResourceTableColumnsProcessor: fn => { processor = fn; },
    registerDetailsViewSection: fn => { details = fn; },
    registerRoute: value => { route = value; },
    registerSidebarEntry: value => { sidebar = value; },
  },
});

test('bundle registers a searchable name column, preserves built-ins, and avoids duplicates', () => {
  const columns = ['name', 'namespace', { id: 'actions', label: 'Actions' }];
  const output = processor({ id: 'headlamp-pods', columns });
  assert.equal(columns.length, 3);
  assert.equal(output[0], columns[0]);
  assert.equal(output[2], columns[2]);
  const app = output.at(-1);
  assert.equal(app.getValue({ jsonData: pod }), 'orders-api');
  const html = renderToStaticMarkup(app.render({ jsonData: pod }));
  assert.match(html, /orders-api/);
  assert.match(html, /engineering \/ development/);
  assert.equal(processor({ id: 'headlamp-pods', columns: output }), output);
  assert.equal(processor({ id: 'headlamp-nodes', columns }), columns);
  assert.equal(app.getValue(null), '');
  assert.equal(app.getValue({ metadata: { labels: { 'app.kubernetes.io/name': 'nginx' } } }), '');
});

test('bundle renders app details and omits them for unrelated resources', () => {
  const html = renderToStaticMarkup(details({ resource: { jsonData: pod } }));
  for (const value of ['Tanzu Application', 'orders-api', 'app-example', 'engineering', 'development', 'web', 'Instance index']) {
    assert.ok(html.includes(value), value);
  }
  assert.equal(renderToStaticMarkup(details({ resource: { metadata: { name: 'ordinary-pod' } } })), '');
});

test('bundle registers the top-level Tanzu Apps navigation and authenticated route', () => {
  assert.equal(sidebar.label, 'Tanzu Apps');
  assert.equal(sidebar.parent, null);
  assert.equal(sidebar.url, '/tanzu-apps');
  assert.equal(route.path, '/tanzu-apps');
  assert.equal(route.sidebar, 'tanzu-apps');
  assert.notEqual(route.noAuthRequired, true);
  assert.equal(typeof route.component, 'function');
});
