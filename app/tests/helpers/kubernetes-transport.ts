import * as k8s from '@kubernetes/client-node';
import { createServer, type RequestListener } from 'node:http';
import { createServer as createTlsServer } from 'node:https';
import { onTestFinished } from 'vitest';
import { SecretMapCoreV1Api } from '@/lib/k8s-secret-codec';

export const SERVICE_TOKEN = 'synthetic-loopback-service-account-token';

// Synthetic, test-only self-signed certificate/key. No credential files or
// external certificate tools are used when the tests run.
const tlsFixture = {
  key: `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgfnnH8dqoEoJRYbLJ
0XIQkZy7qbI5uFpfb6KftKS02DqhRANCAATxHzNkFbVRK5O7YnII+benp0VvkxSB
P/LRyEDRxz46eFuMQXwYp66LG9xduVLEg7FJey1+Q+3vvs4q5wNbuFBD
-----END PRIVATE KEY-----`,
  cert: `-----BEGIN CERTIFICATE-----
MIIBwDCCAWWgAwIBAgIUSs6JMk1kp/hg1Oz+Fz+pyxI+ZW8wCgYIKoZIzj0EAwIw
IjEgMB4GA1UEAwwXa3ViZXJuZXRlcy5leGFtcGxlLnRlc3QwIBcNMjYxMDEzMDAy
MjUzWhgPMjEyNjA5MTkwMDIyNTNaMCIxIDAeBgNVBAMMF2t1YmVybmV0ZXMuZXhh
bXBsZS50ZXN0MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE8R8zZBW1USuTu2Jy
CPm3p6dFb5MUgT/y0chA0cc+OnhbjEF8GKeuixvcXblSxIOxSXstfkPt777OKucD
W7hQQ6N3MHUwHQYDVR0OBBYEFBz+97mrH0g/zY5RACaaqQpNpJTkMB8GA1UdIwQY
MBaAFBz+97mrH0g/zY5RACaaqQpNpJTkMA8GA1UdEwEB/wQFMAMBAf8wIgYDVR0R
BBswGYIXa3ViZXJuZXRlcy5leGFtcGxlLnRlc3QwCgYIKoZIzj0EAwIDSQAwRgIh
AIdMLN1Og8FJge3AWGe5RdvY68m6T7lvG3d47T3hMDt3AiEAhIhxl5TW98Newvlc
iAVP8zvcojMoz9Lisms5ZMJv09M=
-----END CERTIFICATE-----`,
};

export interface WireRequest {
  method: string;
  url: string;
  rawHeaders: string[];
  body: string;
}

type Reply = { status?: number; body: unknown; headers?: Record<string, string> };

/** Real generated clients, synthetic SA configuration, and loopback HTTP only. */
export async function loopbackKubernetes(
  reply: (request: WireRequest) => Reply | Promise<Reply> = () => ({ body: {} }),
  tls = false,
) {
  const requests: WireRequest[] = [];
  const dispatchers = new Set<NonNullable<ReturnType<k8s.RequestContext['getDispatcher']>>>();
  const listener: RequestListener = async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const captured = {
      method: req.method!,
      url: req.url!,
      rawHeaders: [...req.rawHeaders],
      body: Buffer.concat(chunks).toString('utf8'),
    };
    requests.push(captured);
    const response = await reply(captured);
    res.writeHead(response.status ?? 200, { 'Content-Type': 'application/json', ...response.headers });
    res.end(JSON.stringify(response.body));
  };
  const server = tls ? createTlsServer(tlsFixture, listener) : createServer(listener);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing loopback address');
  const origin = `${tls ? 'https' : 'http'}://127.0.0.1:${address.port}`;

  class SyntheticKubeConfig extends k8s.KubeConfig {
    async applySecurityAuthentication(context: k8s.RequestContext) {
      await super.applySecurityAuthentication(context);
      const dispatcher = context.getDispatcher();
      if (dispatcher) dispatchers.add(dispatcher);
    }
  }
  const kubeConfig = new SyntheticKubeConfig();
  kubeConfig.loadFromClusterAndUser(
    {
      name: 'synthetic-loopback',
      server: origin,
      skipTLSVerify: !tls,
      ...(tls
        ? {
            caData: Buffer.from(tlsFixture.cert).toString('base64'),
            tlsServerName: 'kubernetes.example.test',
          }
        : {}),
    },
    { name: 'synthetic-service-account', token: SERVICE_TOKEN },
  );

  onTestFinished(async () => {
    await Promise.all([...dispatchers].map((dispatcher) => dispatcher.destroy()));
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });
  return {
    requests,
    origin,
    kubeConfig,
    core: kubeConfig.makeApiClient(SecretMapCoreV1Api),
    apps: kubeConfig.makeApiClient(k8s.AppsV1Api),
  };
}

/** Inspect raw alternating name/value pairs, never the server's coalesced map. */
export function headerValues(request: WireRequest, name: string): string[] {
  const values: string[] = [];
  for (let i = 0; i < request.rawHeaders.length; i += 2) {
    if (request.rawHeaders[i].toLowerCase() === name.toLowerCase()) values.push(request.rawHeaders[i + 1]);
  }
  return values;
}
