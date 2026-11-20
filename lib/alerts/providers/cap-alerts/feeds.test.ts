import { addInfo, createCAPAlert, createCAPInfo, CAPAlert } from './alert';

// Language files (lib/localization/translations): English and Swahili share
// one multi-language feed and sender; Amharic has its own feed and fallback;
// Somali has no feed of its own, so it uses the default language's. Oromo
// is set up like TMA's Swahili feed: its own feed and sender.
jest.mock('@/lib/localization/translations', () => {
  const lang = (capFeedUrl: string, fallbackCapFeedUrl: string, capSenderId = '') =>
    ({ capFeedUrl, fallbackCapFeedUrl, capSenderId });
  return {
    DEFAULT_LANGUAGE: 'en',
    LANGUAGES: {
      en: lang('https://met.example/rss.xml', 'https://wmo.example/rss.xml', 'severe@met.example'),
      sw: lang('https://met.example/rss.xml', 'https://wmo.example/rss.xml', 'severe@met.example'),
      am: lang('https://met.example/am/rss.xml', 'https://wmo.example/am/rss.xml', 'severe@met.example'),
      so: lang('', ''),
      om: lang('https://met.example/om/rss.xml', '', 'met@met.example'),
      ti: lang('https://met.example/rss.xml', 'https://wmo.example/rss.xml', 'other@met.example'),
    },
  };
});

// Only the network call is mocked; feed resolution is the real code.
const mockReadFeed = jest.fn(async (_feed: AlertsFeed, _since: unknown) => []);
jest.mock('./rss', () => ({
  ...jest.requireActual('./rss'),
  readCapFeedIfModified: (feed: AlertsFeed, since: unknown) => mockReadFeed(feed, since),
}));

// eslint-disable-next-line import/first
import { alertsFeed, AlertsFeed } from './rss';
// eslint-disable-next-line import/first
import { CAPAlertsProvider } from './cap-alerts.provider';
// eslint-disable-next-line import/first
import { CAPCollector } from './collector';
// eslint-disable-next-line import/first
import { LANGUAGES } from '@/lib/localization/translations';
// eslint-disable-next-line import/first
import { alertsQueryKey } from '@/lib/hooks/alerts.hook';

describe('per-language feeds', () => {
  beforeEach(() => mockReadFeed.mockClear());

  test("each language uses its language file's feed, fallback and sender", () => {
    const shared = { primary: 'https://met.example/rss.xml', fallback: 'https://wmo.example/rss.xml', senderId: 'severe@met.example' };
    expect(alertsFeed('en')).toEqual(shared);
    expect(alertsFeed('sw-TZ')).toEqual(shared);
    expect(alertsFeed('am')).toEqual({
      primary: 'https://met.example/am/rss.xml',
      fallback: 'https://wmo.example/am/rss.xml',
      senderId: 'severe@met.example',
    });
  });

  test("a language without its own feed, or without a file, uses the default language's", () => {
    const english = alertsFeed('en');
    expect(alertsFeed('so')).toEqual(english);
    expect(alertsFeed('fr')).toEqual(english);
  });

  test('no feed for the language or the default means no alerts', async () => {
    const english = LANGUAGES.en;
    const feedUrl = english.capFeedUrl;
    english.capFeedUrl = '';
    try {
      expect(alertsFeed('so')).toBeNull();
      await expect(new CAPAlertsProvider().getAlerts('so')).resolves.toEqual([]);
      expect(mockReadFeed).not.toHaveBeenCalled();
    } finally {
      english.capFeedUrl = feedUrl;
    }
  });

  test("switching language reads that language's feed", async () => {
    const provider = new CAPAlertsProvider();
    await provider.getAlerts('am');
    await provider.getAlerts('om');
    expect(mockReadFeed.mock.calls.map(([feed]) => feed.primary)).toEqual([
      'https://met.example/am/rss.xml',
      'https://met.example/om/rss.xml',
    ]);
  });

  test('languages sharing a feed and sender share one collector', async () => {
    const provider = new CAPAlertsProvider();
    await provider.getAlerts('en');
    await provider.getAlerts('sw');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((provider as any).collectors.size).toBe(1);
  });

  test('the same URL with a different sender gets its own collector', async () => {
    const provider = new CAPAlertsProvider();
    await provider.getAlerts('en');
    await provider.getAlerts('ti');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((provider as any).collectors.size).toBe(2);
  });

  test('the alerts cache is separate per language and per feed', () => {
    expect(alertsQueryKey('en')).not.toEqual(alertsQueryKey('am'));
    expect(alertsQueryKey('en')).not.toEqual(alertsQueryKey('sw')); // same feed, different language
    expect(alertsQueryKey('sw-TZ')).toEqual(alertsQueryKey('sw'));
  });
});

describe('sender filtering', () => {
  const fromSender = (identifier: string, sender: string): CAPAlert => {
    const info = createCAPInfo('Met', 'Strong winds', 'Expected', 'Severe', 'Likely');
    info.language = 'sw';
    return addInfo(createCAPAlert(identifier, sender, '2026-11-05T06:00:00+03:00', 'Actual', 'Alert', 'Public'), info);
  };

  // TMA case: the Swahili feed's messages come from met@, the English feed's
  // from severe@. A single sender setting would silently drop every Swahili warning.
  test("keeps messages from the language's sender and drops the rest", () => {
    const collector = new CAPCollector(alertsFeed('om')!);
    collector._messages = {
      a: fromSender('a', 'met@met.example'),
      b: fromSender('b', 'severe@met.example'),
      c: fromSender('c', 'someone-else@example.org'),
    };
    expect(collector.activeMessages().map(alert => alert.identifier)).toEqual(['a']);
  });
});
