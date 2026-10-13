import {
  CoreV1Api,
  ResponseContext,
  type Configuration,
  type HttpInfo,
  type RequestContext,
  type V1Secret,
} from '@kubernetes/client-node';
import {
  CoreV1ApiRequestFactory,
  CoreV1ApiResponseProcessor,
} from '@kubernetes/client-node/dist/gen/apis/CoreV1Api.js';

/**
 * client-node v2 serializes maps with `out[key] = value` on {}, losing __proto__
 * (and using inherited entries). Its public factory/processor injection seam
 * lets us preserve Secret maps without changing global SDK/prototype state.
 * Keep the generated handling of dates, errors, auth, TLS, and request options.
 */
function preserveMaps(source: V1Secret, target: V1Secret): void {
  if (source.data !== undefined) target.data = { ...source.data };
  if (source.stringData !== undefined) target.stringData = { ...source.stringData };
  if (source.metadata && target.metadata) {
    if (source.metadata.labels !== undefined) target.metadata.labels = { ...source.metadata.labels };
    if (source.metadata.annotations !== undefined) target.metadata.annotations = { ...source.metadata.annotations };
  }
}

function preserveRequest(context: RequestContext, secret: V1Secret): RequestContext {
  const serialized: V1Secret = JSON.parse(context.getBody() as string);
  preserveMaps(secret, serialized);
  context.setBody(JSON.stringify(serialized));
  return context;
}

class SecretRequestFactory extends CoreV1ApiRequestFactory {
  override async createNamespacedSecret(...args: Parameters<CoreV1ApiRequestFactory['createNamespacedSecret']>) {
    return preserveRequest(await super.createNamespacedSecret(...args), args[1]);
  }

  override async replaceNamespacedSecret(...args: Parameters<CoreV1ApiRequestFactory['replaceNamespacedSecret']>) {
    return preserveRequest(await super.replaceNamespacedSecret(...args), args[2]);
  }
}

async function preserveResponse<T>(
  response: ResponseContext,
  process: (response: ResponseContext) => Promise<HttpInfo<T>>,
  repair: (source: T, target: T) => void,
): Promise<HttpInfo<T>> {
  if (response.httpStatusCode < 200 || response.httpStatusCode >= 300) return process(response);
  const text = await response.body.text();
  const replay = new ResponseContext(response.httpStatusCode, response.headers, {
    text: async () => text,
    binary: async () => Buffer.from(text),
    stream: () => null,
  });
  const parsed = await process(replay);
  repair(JSON.parse(text) as T, parsed.data);
  return parsed;
}

class SecretResponseProcessor extends CoreV1ApiResponseProcessor {
  override readNamespacedSecretWithHttpInfo(response: ResponseContext) {
    return preserveResponse(response, (r) => super.readNamespacedSecretWithHttpInfo(r), preserveMaps);
  }

  override createNamespacedSecretWithHttpInfo(response: ResponseContext) {
    return preserveResponse(response, (r) => super.createNamespacedSecretWithHttpInfo(r), preserveMaps);
  }

  override replaceNamespacedSecretWithHttpInfo(response: ResponseContext) {
    return preserveResponse(response, (r) => super.replaceNamespacedSecretWithHttpInfo(r), preserveMaps);
  }

  override listNamespacedSecretWithHttpInfo(response: ResponseContext) {
    return preserveResponse(
      response,
      (r) => super.listNamespacedSecretWithHttpInfo(r),
      (source, target) => {
        source.items.forEach((secret, index) => preserveMaps(secret, target.items[index]));
      },
    );
  }
}

/** The four Secret read/write operations used by Krypton have own-key codecs. */
export class SecretMapCoreV1Api extends CoreV1Api {
  constructor(configuration: Configuration) {
    super(configuration, new SecretRequestFactory(configuration), new SecretResponseProcessor());
  }
}
