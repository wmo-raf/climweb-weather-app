import { DateTime } from 'luxon';

import { AT_SEA_WARNING_KEYWORDS } from './settings';
import { CAPAlert, alertInLocation, alertLevel } from '@/lib/alerts/providers/cap-alerts/alert';
import { ALERT_SEVERITY_RANK } from '@/lib/alerts/providers/cap-alerts/icons';

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Whole-word match, so "sea" doesn't catch "season" and "wind" doesn't
// catch "window"; a trailing "s" is allowed ("winds", "waves").
export function keywordMatcher(keywords: string[]): RegExp | undefined {
  const words = keywords.map(k => k.trim()).filter(Boolean).map(escapeRegExp);
  return words.length ? new RegExp(`\\b(?:${words.join('|')})s?\\b`, 'i') : undefined;
}

// Whether a CAP alert is about wind or conditions at sea, judged from the
// event, headline and eventCode values. Any info block counts: a
// multi-language alert has one block per language, and the keywords may
// only cover some of those languages.
export function isAtSeaWarning(alert: CAPAlert, keywords: string[] = AT_SEA_WARNING_KEYWORDS): boolean {
  const matcher = keywordMatcher(keywords);
  if (!matcher) return false;

  return (alert.info ?? []).some(info =>
    [info.event, info.headline, ...(info.eventCode ?? []).map(code => code.value)]
      .some(field => typeof field === 'string' && matcher.test(field))
  );
}

// The At sea page's advisories: wind/marine warnings that cover the place
// and haven't expired, worst first. Alerts passed in are already filtered
// to Yellow and above by useAlertsQuery.
export function atSeaWarningsFor(
  alerts: CAPAlert[],
  location: { latitude: number; longitude: number },
  now: DateTime = DateTime.now(),
  keywords: string[] = AT_SEA_WARNING_KEYWORDS,
): CAPAlert[] {
  return alerts
    .filter(alert => {
      const expires = alert.info?.[0]?.expires;
      return !expires || DateTime.fromISO(expires) > now;
    })
    .filter(alert => alertInLocation(alert, location))
    .filter(alert => isAtSeaWarning(alert, keywords))
    .sort((a, b) => ALERT_SEVERITY_RANK[alertLevel(a.info![0])] - ALERT_SEVERITY_RANK[alertLevel(b.info![0])]);
}
