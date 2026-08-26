import { DateTime } from 'luxon';

import { CAPAlert, CAPInfo, alertLevel } from './alert';

type Translate = (key: string, options?: Record<string, unknown>) => string;

// Shared by AlertCard, AlertShareCard, and buildSmsText below so the
// severity+urgency wording ("RED — act now") is guaranteed identical
// everywhere it appears, rather than three components each keeping their
// own copy in sync by hand.
export const BAND_LABEL_KEYS: { [k in 'Red' | 'Yellow' | 'Orange' | 'Cyan' | 'Blue']: string } = {
  Red: 'alert.band.red',
  Orange: 'alert.band.orange',
  Yellow: 'alert.band.yellow',
  Cyan: 'alert.band.notice',
  Blue: 'alert.band.notice',
};

// Splits the raw CAP `instruction` text into a checklist of short imperative
// sentences. Returns [] (not a fabricated fallback) when there's nothing to
// show — this is safety guidance, so it must come from the CAP feed itself.
export function getWhatToDo(info: CAPInfo | undefined): string[] {
  const instruction = info?.instruction?.trim();
  if (!instruction) return [];

  return instruction
    .split(/\r?\n+|(?<=[.!?])\s+/)
    .map(s => s.trim().replace(/[.!?]+$/, ''))
    .filter(s => s.length > 3)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1));
}

function timeOfDayKey(hour: number): string {
  if (hour < 6) return 'time.night';
  if (hour < 12) return 'time.morning';
  if (hour < 18) return 'time.afternoon';
  return 'time.evening';
}

function describeMoment(t: Translate, iso: string | undefined, now: DateTime): string | undefined {
  if (!iso) return undefined;
  const dt = DateTime.fromISO(iso);
  if (!dt.isValid) return undefined;
  if (dt <= now) return t('alert.when.now');

  const sameDay = dt.hasSame(now, 'day');
  const period = t(timeOfDayKey(dt.hour));
  return sameDay ? period : `${dt.toFormat('cccc')} ${period}`;
}

// "From now until Wednesday evening." — built from onset/effective/expires,
// falling back gracefully when only one end of the window is known.
export function getWhenText(t: Translate, info: CAPInfo | undefined, now: DateTime = DateTime.now()): string | undefined {
  if (!info) return undefined;
  const start = describeMoment(t, info.onset ?? info.effective, now);
  const end = describeMoment(t, info.expires, now);

  if (start && end) return t('alert.when.range', { start, end });
  if (start) return t('alert.when.fromOnly', { start });
  if (end) return t('alert.when.untilOnly', { end });
  return undefined;
}

export function getWhereText(info: CAPInfo | undefined): string | undefined {
  return info?.area?.areaDesc;
}

// Pulled from the CAP feed's own data (senderName, sender address) rather
// than a hardcoded org name, since this app is deployed per-country against
// whichever feed EXPO_PUBLIC_APP_ALERTS_SENDER_ID points to (see
// docs/CONFIGURATION.md). Shared by getShareSourceLine (joined on one line
// for the share-image card) and buildSmsText (kept as two lines — see
// there for why).
function getSenderNameAndDomain(alert: CAPAlert, info: CAPInfo | undefined): { name?: string; domain?: string } {
  const name = info?.senderName?.trim() || undefined;
  const atIndex = alert.sender?.indexOf('@') ?? -1;
  const domain = atIndex > -1 ? alert.sender.slice(atIndex + 1).trim() : undefined;
  return { name, domain };
}

// "Ethiopian Meteorology and Hydrology Institute · ethiomet.gov.et"
export function getShareSourceLine(alert: CAPAlert, info: CAPInfo | undefined): string | undefined {
  const { name, domain } = getSenderNameAndDomain(alert, info);
  if (name && domain) return `${name} · ${domain}`;
  return name ?? domain;
}

// Terser sibling of describeMoment for SMS: "Wed evening" instead of
// "Wednesday evening" — every character costs in a text message, unlike the
// share-image card or in-app text.
function shortMoment(t: Translate, iso: string | undefined, now: DateTime): string | undefined {
  if (!iso) return undefined;
  const dt = DateTime.fromISO(iso);
  if (!dt.isValid) return undefined;
  if (dt <= now) return t('alert.when.now');

  const sameDay = dt.hasSame(now, 'day');
  const period = t(timeOfDayKey(dt.hour));
  return sameDay ? period : `${dt.toFormat('ccc')} ${period}`;
}

// "now until Wed evening" — the SMS-specific counterpart to getWhenText,
// using shortMoment and its own (shorter, unpunctuated) translation strings.
function getSmsWhenText(t: Translate, info: CAPInfo | undefined, now: DateTime = DateTime.now()): string | undefined {
  if (!info) return undefined;
  const start = shortMoment(t, info.onset ?? info.effective, now);
  const end = shortMoment(t, info.expires, now);

  if (start && end) return t('alert.when.sms.range', { start, end });
  if (start) return t('alert.when.sms.fromOnly', { start });
  if (end) return t('alert.when.sms.untilOnly', { end });
  return undefined;
}

// Builds a plain-text SMS body for an alert — no image, no map, no styling,
// since MMS/image delivery over SMS is unreliable and costly compared to a
// plain text message, and some recipients' phones/carriers won't render an
// image attachment at all. Caps the "what to do" checklist at 3 items to
// keep the message within a couple of SMS segments; the full checklist
// remains available in the app itself (AlertCard).
//
// Layout:
//   ⚠️ RED — act now
//   <headline>
//
//   Where: <area>
//   When: <window>
//
//   What to do:
//   - <item>
//   - <item>
//
//   — <sender name>
//   <sender domain>
const SMS_MAX_ACTIONS = 3;

export function buildSmsText(t: Translate, alert: CAPAlert): string | undefined {
  const info = alert.info?.[0];
  if (!info) return undefined;

  const level = alertLevel(info);
  const headline = info.headline || info.event;
  const whereText = getWhereText(info);
  const whenText = getSmsWhenText(t, info);
  const whatToDo = getWhatToDo(info).slice(0, SMS_MAX_ACTIONS);
  const { name: senderName, domain: senderDomain } = getSenderNameAndDomain(alert, info);

  const lines: string[] = [`⚠️ ${t(BAND_LABEL_KEYS[level])}`];
  if (headline) lines.push(headline);

  const whereWhen = [
    whereText && `${t('alert.whereLabel')}: ${whereText}`,
    whenText && `${t('alert.whenLabel')}: ${whenText}`,
  ].filter(Boolean) as string[];
  if (whereWhen.length) lines.push('', ...whereWhen);

  if (whatToDo.length) {
    lines.push('', `${t('alert.whatToDo')}:`, ...whatToDo.map(item => `- ${item}`));
  }

  if (senderName || senderDomain) {
    lines.push('', senderName ? `— ${senderName}` : `— ${senderDomain}`);
    if (senderName && senderDomain) lines.push(senderDomain);
  }

  return lines.join('\n');
}

// Finds the first alert (already filtered to relevant ones by the caller)
// whose effective window overlaps the given calendar day — used to show an
// inline warning chip under a day in the 5-day list.
export function getAlertForDay(alerts: CAPAlert[], day: DateTime): CAPAlert | undefined {
  const dayStart = day.startOf('day');
  const dayEnd = day.endOf('day');

  return alerts.find(alert => {
    const info = alert.info?.[0];
    if (!info) return false;

    const start = DateTime.fromISO(info.onset ?? info.effective ?? alert.sent);
    if (!start.isValid) return false;

    const end = info.expires ? DateTime.fromISO(info.expires) : start;
    const effectiveEnd = end.isValid ? end : start;

    return start <= dayEnd && effectiveEnd >= dayStart;
  });
}
