/* eslint-disable @typescript-eslint/no-require-imports -- Node preload for build/browser verification. */
/** Run with NODE_OPTIONS=--require=<repo>/app/tests/helpers/offline-runtime.cjs.
 * Synthetic runtime configuration only; never reads developer env/credentials.
 * The caller sets TMPDIR to the repo-scoped tests/.runtime directory.
 */
const fs = require('node:fs');
const path = require('node:path');
const { createRequire, syncBuiltinESMExports } = require('node:module');

for (const name of Object.keys(process.env)) {
  if (/^(OIDC_|SESSION_|K8STON_|KUBERNETES_|AUTH_DISABLED$|APP_URL$|NEXT_PUBLIC_APP_URL$|POD_NAMESPACE$|KUBECONFIG$)/.test(name)) delete process.env[name];
}
Object.assign(process.env, {
  AUTH_DISABLED: 'false', SESSION_SECRET: 'synthetic-offline-build-browser-session-secret-0123456789',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3100', K8STON_NAMESPACE: 'demo',
  K8STON_ADMIN_GROUPS: 'synthetic-admins', NEXT_TELEMETRY_DISABLED: '1',
  KUBECONFIG: path.resolve(__dirname, '../.runtime/unused-kubeconfig'),
});

const appRequire = createRequire(require.resolve(path.resolve(__dirname, '../../node_modules/next/package.json')));
const envPath = appRequire.resolve('@next/env');
const nextEnv = appRequire(envPath);
require.cache[envPath].exports = {
  ...nextEnv,
  loadEnvConfig: () => ({ combinedEnv: process.env, parsedEnv: {}, loadedEnvFiles: [] }),
};

// A second guard catches accidental file access by other JS tooling. It doesn't
// change any files, and the actual Kubernetes/IdP endpoints are never configured.
function blocked(file) {
  if (typeof file !== 'string' && !(file instanceof URL)) return false;
  const name = String(file);
  return /(?:^|\/)(?:\.env(?:\..*)?|token\.txt|id_ed25519|[^/]*\.secret\.yaml)$/.test(name)
    || name.includes('/.kube/') || name.includes('/serviceaccount/');
}
function absent() { return Object.assign(new Error('Credential access disabled for offline verification'), { code: 'ENOENT' }); }
for (const method of ['readFileSync', 'statSync']) {
  const original = fs[method];
  fs[method] = function (file, ...args) {
    if (blocked(file)) throw absent();
    return original.call(this, file, ...args);
  };
}
const originalReadFile = fs.readFile;
fs.readFile = function (file, ...args) {
  if (blocked(file)) { args.at(-1)(absent()); return; }
  return originalReadFile.call(this, file, ...args);
};
const originalPromiseRead = fs.promises.readFile;
fs.promises.readFile = async function (file, ...args) {
  if (blocked(file)) throw absent();
  return originalPromiseRead.call(this, file, ...args);
};
syncBuiltinESMExports();
