import Axios from 'axios';
import { DateTime } from 'luxon';

import { REQUEST_POLICY } from '@/lib/network/request-policy';
import { readCapFeedIfModified } from './rss';

// The retry / circuit-breaker / fallback behaviour itself is covered by
// lib/network/request-policy.test.ts; these tests cover how feeds use it.

jest.mock('axios');
const mockedGet = Axios.get as jest.Mock;

// Same shape as REQUEST_POLICY, with delays short enough for a test.
const FAST = { retries: 3, initialDelay: 1, maxDelay: 2, openFor: 50 };

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('readCapFeedIfModified', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    // Keep the real retry count, with test-sized delays (read when each feed's
    // policy is first created). Jest gives each test file its own module
    // instance, so this doesn't leak into other suites.
    Object.assign(REQUEST_POLICY, FAST);
  });

  const RSS = `<?xml version="1.0"?><rss version="2.0"><channel><title>TMA</title>
    <item><title>Mvua kubwa</title><link>https://met.example/cap/1.xml</link><guid>1</guid>
    <pubDate>Wed, 05 Nov 2026 06:00:00 +0300</pubDate></item></channel></rss>`;
  // What a mistyped domain (amazoaws.com) answers, with a 200.
  const PARKED_PAGE = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<script async src="x"></script>';

  test('a page that is not an RSS feed is retried, then the fallback feed is read', async () => {
    mockedGet.mockImplementation(async (url: string) =>
      url.includes('wrong') ? { status: 200, data: PARKED_PAGE } : { status: 200, data: RSS });
    const feed = { primary: 'https://wrong.example/rss.xml', fallback: 'https://good.example/rss.xml', senderId: 's' };

    const refs = await readCapFeedIfModified(feed, DateTime.now());

    expect(refs?.map(r => r.link)).toEqual(['https://met.example/cap/1.xml']);
    expect(mockedGet.mock.calls.filter(([url]) => url.includes('wrong'))).toHaveLength(4);
    expect(mockedGet.mock.calls.filter(([url]) => url.includes('good'))).toHaveLength(1);
  });

  test('valid XML that is not RSS fails the same way', async () => {
    mockedGet.mockResolvedValue({ status: 200, data: '<?xml version="1.0"?><Error><Code>NoSuchKey</Code></Error>' });
    const feed = { primary: 'https://s3.example/missing.xml', fallback: '', senderId: 's' };
    await expect(readCapFeedIfModified(feed, DateTime.now())).rejects.toThrow('not an RSS feed');
  });

  test('a feed with no current warnings gives an empty list', async () => {
    mockedGet.mockResolvedValue({ status: 200, data: '<rss version="2.0"><channel><title>TMA</title></channel></rss>' });
    const feed = { primary: 'https://quiet.example/rss.xml', fallback: '', senderId: 's' };
    await expect(readCapFeedIfModified(feed, DateTime.now())).resolves.toEqual([]);
  });

  test('a 304 means unchanged: no retries, no fallback', async () => {
    mockedGet.mockResolvedValue({ status: 304, data: '' });
    const feed = { primary: 'https://met.example/rss.xml', fallback: 'https://wmo.example/rss.xml', senderId: 's' };

    await expect(readCapFeedIfModified(feed, DateTime.now())).resolves.toBeNull();
    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(mockedGet.mock.calls[0][1].validateStatus(304)).toBe(true);
    expect(mockedGet.mock.calls[0][1].headers['If-Modified-Since']).toBeDefined();
  });
});
