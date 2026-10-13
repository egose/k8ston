import { ApiException } from '@kubernetes/client-node';
import { beforeEach, expect, it, vi } from 'vitest';
import { TEST_APP_URL } from './helpers/environment';
import { boundSnapshot, mockHistoryStore } from './helpers/history';
import { headerValues, loopbackKubernetes, SERVICE_TOKEN } from './helpers/kubernetes-transport';
import { dataUser, nativeSecret, rawData, textData } from './helpers/secret-data';

const namespace = 'unit-test';
const name = 'credentials';

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

it.each([false, true])(
  'real SDK routes retain own keys/bytes across HTTP with impersonation=%s',
  async (impersonation) => {
    process.env.KRYPTON_IMPERSONATION = String(impersonation);
    const initial = nativeSecret({
      data: Object.fromEntries(
        Object.entries(textData).map(([key, value]) => [key, Buffer.from(value).toString('base64')]),
      ),
    });
    const source = nativeSecret();
    source.metadata!.resourceVersion = '11';
    const target = boundSnapshot(source, 1);
    const mock = await mockHistoryStore([initial, target]);
    const server = await loopbackKubernetes(mock.reply);
    mock.getCoreApi.mockReturnValue(server.core);
    const auth = await import('@/lib/auth');
    await auth.setSessionCookie(await auth.createSessionToken(dataUser));
    const { GET, PUT } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
    const ctx = { params: Promise.resolve({ namespace, name }) };
    const url = `${TEST_APP_URL}/api/namespaces/${namespace}/secrets/${name}`;
    const detail = await (await GET(new Request(url), ctx)).json();
    expect(detail.secret.data).toEqual(textData);
    expect(Object.hasOwn(detail.secret.data, '__proto__')).toBe(true);
    const update = await PUT(
      new Request(url, { method: 'PUT', body: JSON.stringify({ resourceVersion: '17', data: textData }) }),
      ctx,
    );
    expect(update.status).toBe(200);
    const updated = (await update.json()).secret;
    expect(updated.data).toEqual(textData);
    const { POST } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/restore/route');
    const restored = await POST(
      new Request(`${url}/restore`, {
        method: 'POST',
        body: JSON.stringify({ version: 1, resourceVersion: updated.resourceVersion }),
      }),
      ctx,
    );
    expect(restored.status).toBe(200);
    expect((await restored.json()).secret.binaryData['archive.bin']).toBe(rawData['archive.bin']);
    const live = mock.get(namespace, name);
    expect(live.data).toEqual(rawData);
    expect(live.metadata?.uid).toBe('synthetic-live-uid');
    for (const request of server.requests) {
      expect(headerValues(request, 'Authorization')).toEqual([`Bearer ${SERVICE_TOKEN}`]);
      expect(headerValues(request, 'Impersonate-Group')).toEqual(impersonation ? dataUser.groups : []);
      if (request.method === 'POST' || request.method === 'PUT') {
        expect(Object.hasOwn(JSON.parse(request.body).data, '__proto__')).toBe(true);
      }
    }
  },
);

it('SDK create/replace serialize only own map entries and preserve binary __proto__ responses', async () => {
  const server = await loopbackKubernetes((request) => ({
    status: request.method === 'POST' ? 201 : 200,
    body: JSON.parse(request.body),
  }));
  const data: Record<string, string> = Object.create({ inherited: 'c2hvdWxkLW5vdC1iZS13cml0dGVu' });
  Object.defineProperty(data, '__proto__', { value: '/wAB', enumerable: true });
  Object.defineProperties(data, {
    constructor: { value: 'eA==', enumerable: true },
    toString: { value: 'eQ==', enumerable: true },
  });
  for (const result of [
    await server.core.createNamespacedSecret({ namespace, body: nativeSecret({ data }) }),
    await server.core.replaceNamespacedSecret({ namespace, name, body: nativeSecret({ data }) }),
  ]) {
    expect(Object.entries(result.data!)).toEqual([
      ['__proto__', '/wAB'],
      ['constructor', 'eA=='],
      ['toString', 'eQ=='],
    ]);
    expect(result.metadata?.creationTimestamp).toBeInstanceOf(Date);
    expect(result.metadata?.finalizers).toEqual(['example.test/protect']);
  }
  for (const request of server.requests) expect(JSON.parse(request.body).data).not.toHaveProperty('inherited');
});

it.each([401, 403, 404, 409])('own-map codec retains SDK HTTP %s error handling', async (status) => {
  const server = await loopbackKubernetes(() => ({ status, body: { message: 'synthetic-error' } }));
  await expect(server.core.readNamespacedSecret({ namespace, name })).rejects.toMatchObject({ code: status });
  await expect(server.core.replaceNamespacedSecret({ namespace, name, body: nativeSecret() })).rejects.toBeInstanceOf(
    ApiException,
  );
});
