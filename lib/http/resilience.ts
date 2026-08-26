import Axios from 'axios';
import {
  ConsecutiveBreaker,
  ExponentialBackoff,
  handleAll,
  circuitBreaker,
  retry,
  fallback,
  wrap,
  CircuitState,
  IPolicy,
  IDefaultPolicyContext,
} from 'cockatiel';

function errorMessage(error: unknown): string {
  if (Axios.isAxiosError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return String(error);
}

// cockatiel's FailureReason is `{ error } | { value }` — the `value` arm
// only applies to result-based filtering (e.g. handleResultType), which
// none of this app's callers use, so it's realistically always `{ error }`
// here. Handled anyway since the type doesn't guarantee it.
function reasonMessage(reason: { error: Error } | { value: unknown }): string {
  return 'error' in reason ? errorMessage(reason.error) : String(reason.value);
}

export interface BreakerOptions {
  // Consecutive failures before the breaker trips open. Default 3.
  breakerThreshold?: number;
  // How long the breaker stays open before allowing a half-open probe. Default 15s.
  halfOpenAfterMs?: number;
}

export interface RetryOptions {
  // Retry attempts against the wrapped call before giving up. Default 3.
  retryAttempts?: number;
}

// The only thing a consumer ever holds onto: call execute() to run
// something through the composed policy.
export interface ResiliencePolicy<AltReturn = never> {
  execute<T>(fn: (context: IDefaultPolicyContext) => Promise<T> | T): Promise<T | AltReturn>;
}

// Each step returns a new builder — withX() never mutates the one it was
// called on, so a builder can be composed once (e.g. in a constructor) and
// reused as the base for a fresh per-call withFallback() (see
// yr-location-forecast.provider.ts, whose fallback closes over that call's
// own lat/lon) without the earlier steps being rebuilt or duplicated.
export interface PolicyBuilder<AltReturn = never> {
  withBreaker(opts?: BreakerOptions): PolicyBuilder<AltReturn>;
  withRetry(opts?: RetryOptions): PolicyBuilder<AltReturn>;
  withFallback<F>(fallbackFactory: () => Promise<F>): PolicyBuilder<AltReturn | F>;
  compose(): ResiliencePolicy<AltReturn>;
}

interface BuilderState {
  label: string;
  steps: IPolicy<IDefaultPolicyContext, unknown>[];
}

function buildFrom<AltReturn>(state: BuilderState): PolicyBuilder<AltReturn> {
  const { label } = state;

  return {
    withBreaker(opts: BreakerOptions = {}): PolicyBuilder<AltReturn> {
      const { breakerThreshold = 3, halfOpenAfterMs = 15_000 } = opts;

      // This step's onFailure/onSuccess only fire for requests that
      // actually went out over the network (a fast-fail while the breaker
      // is Open throws before ever reaching here, which is exactly why
      // onStateChange is logged separately).
      const breakerPolicy = circuitBreaker(handleAll, {
        halfOpenAfter: halfOpenAfterMs,
        breaker: new ConsecutiveBreaker(breakerThreshold),
      });

      breakerPolicy.onBreak(() => {
        console.warn(`💥 [breaker] ${label}: tripped after ${breakerThreshold} consecutive failures`);
      });
      breakerPolicy.onReset(() => {
        console.log(`✅ [breaker] ${label}: reset, re-enabled`);
      });
      breakerPolicy.onHalfOpen(() => {
        console.info(`🔄 [breaker] ${label}: half-open, testing with the next call`);
      });
      breakerPolicy.onStateChange((circuitState) => {
        console.info(`⚡ [breaker] ${label}: state changed to ${CircuitState[circuitState]}`);
      });
      breakerPolicy.onFailure(({ duration, reason }) => {
        console.warn(`⚠️ [breaker] ${label}: request failed after ${Math.round(duration)}ms:`, reasonMessage(reason));
      });
      breakerPolicy.onSuccess(({ duration }) => {
        console.log(`✅ [breaker] ${label}: request succeeded in ${Math.round(duration)}ms`);
      });

      return buildFrom({ ...state, steps: [...state.steps, breakerPolicy] });
    },

    withRetry(opts: RetryOptions = {}): PolicyBuilder<AltReturn> {
      const { retryAttempts = 3 } = opts;

      // onFailure/onSuccess/onGiveUp reflect the whole attempt sequence
      // through whatever this wraps (e.g. a breaker added afterward —
      // withBreaker() ends up innermost — including fast-fails from an
      // Open breaker), not just one HTTP request.
      const retryPolicy = retry(handleAll, { maxAttempts: retryAttempts, backoff: new ExponentialBackoff() });
      retryPolicy.onFailure(({ duration, reason }) => {
        console.warn(`⚠️ [retry] ${label}: attempt failed after ${Math.round(duration)}ms:`, reasonMessage(reason));
      });
      retryPolicy.onRetry(({ attempt, delay }) => {
        console.warn(`⚠️ [retry] ${label}: retrying (attempt ${attempt}) in ${Math.round(delay)}ms...`);
      });
      retryPolicy.onGiveUp((reason) => {
        console.warn(`🛑 [retry] ${label}: exhausted all retry attempts, giving up:`, reasonMessage(reason));
      });
      retryPolicy.onSuccess(({ duration }) => {
        console.log(`✅ [retry] ${label}: ultimately succeeded (${Math.round(duration)}ms for the final attempt)`);
      });

      return buildFrom({ ...state, steps: [...state.steps, retryPolicy] });
    },

    withFallback<F>(fallbackFactory: () => Promise<F>): PolicyBuilder<AltReturn | F> {
      const fallbackPolicy = fallback(handleAll, fallbackFactory);
      fallbackPolicy.onFailure(({ reason }) => {
        console.warn(`⚠️ [fallback] ${label}: primary failed after retries:`, reasonMessage(reason));
      });

      return buildFrom({ ...state, steps: [fallbackPolicy, ...state.steps] });
    },

    compose(): ResiliencePolicy<AltReturn> {
      const composed = wrap(...(state.steps as [IPolicy<IDefaultPolicyContext, unknown>])) as IPolicy<
        IDefaultPolicyContext,
        AltReturn
      >;
      return {
        execute: (fn) => composed.execute(fn),
      };
    },
  };
}

// Bare starting point — an empty step list, identified by `label` (used in
// every step's log lines, e.g. "primary alerts feed"). Chain
// withBreaker/withRetry/withFallback in whatever order you want them to
// wrap (first-added = outermost), then compose().
export function createPolicy(label: string): PolicyBuilder<never> {
  return buildFrom({ label, steps: [] });
}
