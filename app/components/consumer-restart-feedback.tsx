import { Alert } from '@egose/shadcn-theme/components/ui/alert';
import type { RestartResult } from '@/lib/consumers';

/** Persistent metadata-only feedback, including failures after the toast expires. */
export function ConsumerRestartFeedback({ result }: { result: RestartResult }) {
  const variant = result.status === 'failed' ? 'danger' : result.status === 'partial' ? 'warning' : 'info';
  return (
    <section aria-label="Consumer rollout result">
      <Alert variant={variant}>
        <div className="flex flex-col gap-2 text-xs">
          <p className="font-medium">{result.message}</p>
          <p>{result.note}</p>
          {result.requested.length > 0 && (
            <div>
              <p>Rollout requested:</p>
              <ul aria-label="Rollout requested" className="list-inside list-disc">
                {result.requested.map(({ kind, name }) => (
                  <li key={`${kind}/${name}`}>
                    <code>
                      {kind}/{name}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.failures.length > 0 && (
            <div>
              <p>Unconfirmed rollout requests:</p>
              <ul aria-label="Unconfirmed rollout requests" className="list-inside list-disc">
                {result.failures.map(({ kind, name, message, httpStatus }) => (
                  <li key={`${kind}/${name}`}>
                    <code>
                      {kind}/{name}
                    </code>{' '}
                    — {message}
                    {httpStatus && ` (HTTP ${httpStatus})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.discoveryFailures.length > 0 && (
            <div>
              <p>Unknown inventory; no workloads of these kinds were patched:</p>
              <ul aria-label="Workload discovery failures" className="list-inside list-disc">
                {result.discoveryFailures.map(({ kind, message, httpStatus }) => (
                  <li key={kind}>
                    <code>{kind}</code> — {message}
                    {httpStatus && ` (HTTP ${httpStatus})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(result.status === 'partial' || result.status === 'failed') && (
            <p>
              Review workload state and resolve failures before using Restart apps again. Retrying scans all kinds and
              can request another rollout for earlier successes.
            </p>
          )}
        </div>
      </Alert>
    </section>
  );
}
