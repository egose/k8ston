import type { V1Secret } from '@kubernetes/client-node';

export const dataUser = {
  sub: 'data-test-user',
  email: 'data@example.test',
  name: 'Data test',
  groups: ['unit-test-admins'],
};
export const textData = Object.fromEntries([
  ['__proto__', 'prototype-value'],
  ['constructor', 'constructor-value'],
  ['toString', 'string-value'],
  ['unicode', '\ufeffcafé 日本語 🔐\r\nlast line\n'],
  ['empty', ''],
  ['replacement', '\ufffd'],
]);
export const binaryBytes = Buffer.from(Array.from({ length: 256 }, (_, index) => index));
export const rawData: Record<string, string> = {
  ...Object.fromEntries(Object.entries(textData).map(([key, value]) => [key, Buffer.from(value).toString('base64')])),
  'archive.bin': binaryBytes.toString('base64'),
  control: Buffer.from([0, 1, 127]).toString('base64'),
};

export function nativeSecret(overrides: Partial<V1Secret> = {}): V1Secret {
  return {
    metadata: {
      name: 'credentials',
      namespace: 'unit-test',
      uid: 'synthetic-live-uid',
      resourceVersion: '17',
      creationTimestamp: new Date('2026-01-01T00:00:00Z'),
      labels: { 'example.test/application': 'synthetic' },
      annotations: {
        'k8ston.io/managed-by': 'k8ston',
        'k8ston.io/version': '2',
        'k8ston.io/description': 'live description',
      },
      ownerReferences: [
        {
          apiVersion: 'v1',
          kind: 'ConfigMap',
          name: 'owner',
          uid: 'synthetic-owner-uid',
          controller: true,
          blockOwnerDeletion: true,
        },
      ],
      finalizers: ['example.test/protect'],
    },
    type: 'Opaque',
    immutable: false,
    data: { ...rawData },
    ...overrides,
  };
}
