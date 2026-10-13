/** Only application-authored guidance may cross the HTTP boundary verbatim. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Never parse messages, bodies, headers, or string codes to discover a status. */
export function errorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const err = error as { code?: unknown; status?: unknown; statusCode?: unknown };
  return [err.code, err.status, err.statusCode].find(
    (status): status is number =>
      typeof status === 'number' && Number.isInteger(status) && status >= 400 && status <= 599,
  );
}

export interface RequestFailure {
  code:
    | 'unauthenticated'
    | 'forbidden'
    | 'not_found'
    | 'conflict'
    | 'invalid_request'
    | 'rate_limited'
    | 'unavailable'
    | 'unconfirmed';
  message: string;
  httpStatus?: number;
}

/** Fixed diagnostics: even Kubernetes Status.message can contain Secret values. */
export function kubernetesFailure(error: unknown): RequestFailure {
  const httpStatus = errorStatus(error);
  const status = httpStatus === undefined ? {} : { httpStatus };
  switch (httpStatus) {
    case 401:
      return {
        ...status,
        code: 'unauthenticated',
        message: 'Kubernetes authentication failed. Check the configured identity.',
      };
    case 403:
      return {
        ...status,
        code: 'forbidden',
        message:
          'Access denied. Check Kubernetes permissions for the effective identity and, when enabled, ServiceAccount impersonation permissions.',
      };
    case 404:
      return {
        ...status,
        code: 'not_found',
        message: 'The Kubernetes resource was not found. Reload before retrying.',
      };
    case 409:
      return {
        ...status,
        code: 'conflict',
        message: 'The resource changed. Review its current state before retrying.',
      };
    case 400:
    case 422:
      return {
        ...status,
        code: 'invalid_request',
        message: 'Kubernetes rejected the request. Check the documented data and metadata constraints.',
      };
    case 429:
      return { ...status, code: 'rate_limited', message: 'Kubernetes rate-limited the request. Wait before retrying.' };
    default:
      return httpStatus !== undefined && httpStatus >= 500
        ? {
            ...status,
            code: 'unavailable',
            message: 'Kubernetes is unavailable. Check resource state before retrying.',
          }
        : {
            ...status,
            code: 'unconfirmed',
            message: 'The Kubernetes request was not confirmed. Check resource state before retrying.',
          };
  }
}
