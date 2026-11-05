import { executeWithFallback, requestPolicy } from './request-policy';

// Same shape as REQUEST_POLICY, with delays short enough for a test.
const FAST = { retries: 3, initialDelay: 1, maxDelay: 2, openFor: 50 };
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('request policy', () => {
  test('retries the primary three times, then uses the fallback', async () => {
    const primary = jest.fn().mockRejectedValue(new Error('timeout'));
    const fallbackRoute = jest.fn().mockResolvedValue('fallback');

    await expect(executeWithFallback(requestPolicy('test', FAST), primary, fallbackRoute)).resolves.toBe('fallback');
    expect(primary).toHaveBeenCalledTimes(4); // first try + 3 retries
    expect(fallbackRoute).toHaveBeenCalledTimes(1);
  });

  test('while the circuit is open, goes straight to the fallback', async () => {
    const policy = requestPolicy('test', FAST);
    const primary = jest.fn().mockRejectedValue(new Error('timeout'));
    const fallbackRoute = jest.fn().mockResolvedValue('fallback');

    await executeWithFallback(policy, primary, fallbackRoute); // opens the circuit
    primary.mockClear();

    await expect(executeWithFallback(policy, primary, fallbackRoute)).resolves.toBe('fallback');
    expect(primary).not.toHaveBeenCalled();
  });

  test('after the open period, tries the primary again and resets once it answers', async () => {
    const policy = requestPolicy('test', FAST);
    const primary = jest.fn().mockRejectedValue(new Error('timeout'));
    const fallbackRoute = jest.fn().mockResolvedValue('fallback');
    await executeWithFallback(policy, primary, fallbackRoute);

    await sleep(FAST.openFor + 10);
    primary.mockReset().mockResolvedValue('primary');

    await expect(executeWithFallback(policy, primary, fallbackRoute)).resolves.toBe('primary');
    await expect(executeWithFallback(policy, primary, fallbackRoute)).resolves.toBe('primary');
    expect(primary).toHaveBeenCalledTimes(2);
  });

  test('a primary that recovers during the retries is used', async () => {
    const primary = jest.fn().mockRejectedValueOnce(new Error('timeout')).mockResolvedValue('primary');
    const fallbackRoute = jest.fn();

    await expect(executeWithFallback(requestPolicy('test', FAST), primary, fallbackRoute)).resolves.toBe('primary');
    expect(fallbackRoute).not.toHaveBeenCalled();
  });

  test('without a fallback, the error comes through', async () => {
    const primary = jest.fn().mockRejectedValue(new Error('timeout'));
    await expect(executeWithFallback(requestPolicy('test', FAST), primary)).rejects.toThrow('timeout');
  });
});
