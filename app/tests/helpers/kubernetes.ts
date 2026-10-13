import type { AppsV1Api, CoreV1Api } from '@kubernetes/client-node';
import { vi } from 'vitest';

/** Replace only client/namespace acquisition; auth, policy, and handlers stay real. */
export async function mockKubernetes() {
  const k8s = await import('@/lib/k8s');
  const unexpected = new Error('Unexpected synthetic Kubernetes API call');
  const core = {
    readNamespacedConfigMap: vi.fn<CoreV1Api['readNamespacedConfigMap']>().mockRejectedValue(unexpected),
    readNamespacedSecret: vi.fn<CoreV1Api['readNamespacedSecret']>().mockRejectedValue(unexpected),
    listNamespacedSecret: vi.fn<CoreV1Api['listNamespacedSecret']>().mockRejectedValue(unexpected),
    createNamespacedSecret: vi.fn<CoreV1Api['createNamespacedSecret']>().mockRejectedValue(unexpected),
    replaceNamespacedSecret: vi.fn<CoreV1Api['replaceNamespacedSecret']>().mockRejectedValue(unexpected),
    deleteNamespacedSecret: vi.fn<CoreV1Api['deleteNamespacedSecret']>().mockRejectedValue(unexpected),
    listNamespace: vi.fn<CoreV1Api['listNamespace']>().mockRejectedValue(unexpected),
  };
  const apps = {
    listNamespacedDeployment: vi.fn<AppsV1Api['listNamespacedDeployment']>().mockRejectedValue(unexpected),
    listNamespacedStatefulSet: vi.fn<AppsV1Api['listNamespacedStatefulSet']>().mockRejectedValue(unexpected),
    listNamespacedDaemonSet: vi.fn<AppsV1Api['listNamespacedDaemonSet']>().mockRejectedValue(unexpected),
    patchNamespacedDeployment: vi.fn<AppsV1Api['patchNamespacedDeployment']>().mockRejectedValue(unexpected),
    patchNamespacedStatefulSet: vi.fn<AppsV1Api['patchNamespacedStatefulSet']>().mockRejectedValue(unexpected),
    patchNamespacedDaemonSet: vi.fn<AppsV1Api['patchNamespacedDaemonSet']>().mockRejectedValue(unexpected),
  };
  const getCoreApi = vi.spyOn(k8s, 'getCoreApi').mockReturnValue(core as unknown as CoreV1Api);
  const getAppsApi = vi.spyOn(k8s, 'getAppsApi').mockReturnValue(apps as unknown as AppsV1Api);
  // Avoid even probing a mounted ServiceAccount namespace file.
  vi.spyOn(k8s, 'getPodNamespace').mockReturnValue('unit-test');
  return { core, apps, getCoreApi, getAppsApi };
}
