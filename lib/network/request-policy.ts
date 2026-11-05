import {
  ConsecutiveBreaker,
  ExponentialBackoff,
  IPolicy,
  circuitBreaker,
  fallback,
  handleAll,
  retry,
  wrap,
} from 'cockatiel';

/**
 * How a request to a primary URL is made: it's retried up to `retries`
 * times with exponential backoff. If that still fails, the circuit opens and
 * requests go straight to the fallback route for `openFor` ms; after that
 * the primary is tried again, and the circuit closes once it answers.
 */
export const REQUEST_POLICY = {
  retries: 3,
  initialDelay: 200, // ms before the first retry; doubles each retry
  maxDelay: 2_000,
  openFor: 10_000,
};

/**
 * Retry wrapped in a circuit breaker, for one primary route. One failed
 * execution means every retry failed, so the breaker opens on the first.
 * `name` labels the log lines, e.g. "Forecast API".
 */
export function requestPolicy(name: string, options = REQUEST_POLICY): IPolicy {
  const retryPolicy = retry(handleAll, {
    maxAttempts: options.retries,
    backoff: new ExponentialBackoff({ initialDelay: options.initialDelay, maxDelay: options.maxDelay }),
  });
  const breakerPolicy = circuitBreaker(handleAll, {
    halfOpenAfter: options.openFor,
    breaker: new ConsecutiveBreaker(1),
  });

  retryPolicy.onRetry(({ delay }) => console.warn(`⚠️ ${name} failed; retrying in ${Math.round(delay)} ms`));
  breakerPolicy.onBreak(() => console.warn(`🚨 ${name} still failing; using the fallback for ${options.openFor / 1000} s`));
  breakerPolicy.onHalfOpen(() => console.info(`⚡ Trying ${name} again`));
  breakerPolicy.onReset(() => console.log(`✅ ${name} is back`));

  return wrap(breakerPolicy, retryPolicy);
}

/**
 * Runs `primary` through `policy`, falling back to `fallbackRoute` (when
 * given) if the primary fails after its retries or the circuit is open.
 */
export function executeWithFallback<T>(policy: IPolicy, primary: () => Promise<T>, fallbackRoute?: () => Promise<T>): Promise<T> {
  return fallbackRoute
    ? wrap(fallback(handleAll, fallbackRoute), policy).execute(primary)
    : policy.execute(primary);
}
