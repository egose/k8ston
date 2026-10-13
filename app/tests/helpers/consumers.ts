import { ApiException, type V1PodSpec, type V1PodTemplateSpec, type V1Deployment } from '@kubernetes/client-node';
import { mockKubernetes } from './kubernetes';

export const consumerNamespace = 'unit-test';
export const consumerSecret = 'credentials';
export const consumerUser = {
  sub: 'consumer-operator',
  email: 'operator@example.test',
  name: 'Operator',
  groups: ['writers'],
};
export const privateConsumerMarker = 'synthetic-private-consumer-error';

export function consumerApiError(status: number) {
  return new ApiException(
    status,
    privateConsumerMarker,
    JSON.stringify({
      message: privateConsumerMarker,
      data: { credential: privateConsumerMarker },
    }),
    { authorization: privateConsumerMarker },
  );
}

export function consumerTemplate(spec: Partial<V1PodSpec> = {}): V1PodTemplateSpec {
  return { spec: { containers: [{ name: 'app', image: 'example.test/synthetic:1' }], ...spec } };
}

export function consumerWorkload(
  name: string,
  template = consumerTemplate({
    containers: [{ name: 'app', envFrom: [{ secretRef: { name: consumerSecret } }] }],
  }),
): Pick<V1Deployment, 'metadata' | 'spec'> {
  return {
    metadata: { namespace: consumerNamespace, name, uid: `synthetic-uid-${name}`, resourceVersion: '1001' },
    spec: { selector: {}, template },
  };
}

export async function mockConsumers() {
  const mock = await mockKubernetes();
  mock.apps.listNamespacedDeployment.mockResolvedValue({ items: [] });
  mock.apps.listNamespacedStatefulSet.mockResolvedValue({ items: [] });
  mock.apps.listNamespacedDaemonSet.mockResolvedValue({ items: [] });
  mock.apps.patchNamespacedDeployment.mockResolvedValue({});
  mock.apps.patchNamespacedStatefulSet.mockResolvedValue({});
  mock.apps.patchNamespacedDaemonSet.mockResolvedValue({});
  return mock;
}

export function statefulConsumer(name: string, template?: V1PodTemplateSpec) {
  const workload = consumerWorkload(name, template);
  return { ...workload, spec: { ...workload.spec!, serviceName: 'synthetic-service' } };
}
