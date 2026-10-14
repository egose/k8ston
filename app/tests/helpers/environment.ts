export const TEST_SESSION_SECRET = 'synthetic-unit-test-session-secret-0123456789';
export const TEST_APP_URL = 'https://k8ston.example.test';
export const TEST_ISSUER = 'https://idp.example.test';
export const TEST_CLIENT_ID = 'unit-test-client';

export function resetTestEnvironment(): void {
  // Inspect names only, never inherited credential values. All app configuration
  // comes from synthetic values or code defaults, including after module resets.
  for (const name of Object.keys(process.env)) {
    if (
      /^(OIDC_|SESSION_|K8STON_|KUBERNETES_|AUTH_DISABLED$|APP_URL$|NEXT_PUBLIC_APP_URL$|POD_NAMESPACE$|KUBECONFIG$)/.test(
        name,
      )
    ) {
      delete process.env[name];
    }
  }
  Object.assign(process.env, {
    NODE_ENV: 'test',
    AUTH_DISABLED: 'false',
    SESSION_SECRET: TEST_SESSION_SECRET,
    NEXT_PUBLIC_APP_URL: TEST_APP_URL,
    OIDC_ISSUER: TEST_ISSUER,
    OIDC_CLIENT_ID: TEST_CLIENT_ID,
    OIDC_CLIENT_SECRET: 'synthetic-oidc-client-secret',
    K8STON_NAMESPACE: 'unit-test',
    K8STON_ADMIN_GROUPS: 'unit-test-admins',
    // No file is needed: SDK credential loaders are blocked in setup.ts.
    KUBECONFIG: new URL('../fixtures/unused-kubeconfig', import.meta.url).pathname,
  });
}
