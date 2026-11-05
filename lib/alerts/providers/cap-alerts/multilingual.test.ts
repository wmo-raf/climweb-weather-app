import { CAPAlert, CAPInfo, alertInLocation, baseLanguage, parseFromXML, selectInfo } from './alert';

const info = (language: string | undefined, event: string, extra: Partial<CAPInfo> = {}): CAPInfo => ({
  category: 'Met', event, urgency: 'Expected', severity: 'Severe', certainty: 'Likely', language, ...extra,
});

const alertWith = (...infos: CAPInfo[]): CAPAlert => ({
  xmlns: 'urn:oasis:names:tc:emergency:cap:1.2', identifier: 'a', sender: 's', sent: '2026-11-05T06:00:00+03:00',
  status: 'Actual', msgType: 'Alert', scope: 'Public', info: infos,
});

// Two <info> blocks, English then Swahili; only the English one has a polygon.
const XML = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>TMA-2026-11-05-001</identifier>
  <sender>tma@meteo.go.tz</sender>
  <sent>2026-11-05T06:00:00+03:00</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <language>en-US</language>
    <category>Met</category>
    <event>Heavy rain</event>
    <urgency>Expected</urgency>
    <severity>Severe</severity>
    <certainty>Likely</certainty>
    <headline>Heavy rain expected in Dar es Salaam</headline>
    <instruction>Avoid flooded roads.</instruction>
    <area>
      <areaDesc>Dar es Salaam</areaDesc>
      <polygon>-7.0,39.0 -7.0,39.5 -6.5,39.5 -6.5,39.0 -7.0,39.0</polygon>
    </area>
  </info>
  <info>
    <language>sw-TZ</language>
    <category>Met</category>
    <event>Mvua kubwa</event>
    <urgency>Expected</urgency>
    <severity>Severe</severity>
    <certainty>Likely</certainty>
    <headline>Mvua kubwa inatarajiwa Dar es Salaam</headline>
    <instruction>Epuka barabara zilizofurika maji.</instruction>
  </info>
</alert>`;

const DAR = { latitude: -6.8, longitude: 39.28 };

describe('a CAP message in two languages', () => {
  let alert: CAPAlert;
  beforeAll(async () => { alert = await parseFromXML(XML); });

  test('keeps both info blocks with their language tags', () => {
    expect(alert.info?.map(i => [i.language, i.event])).toEqual([['en-US', 'Heavy rain'], ['sw-TZ', 'Mvua kubwa']]);
  });

  test('shows the Swahili text in Swahili and the English text in English', () => {
    expect(selectInfo(alert, 'sw')?.headline).toBe('Mvua kubwa inatarajiwa Dar es Salaam');
    expect(selectInfo(alert, 'en')?.headline).toBe('Heavy rain expected in Dar es Salaam');
  });

  test('the Swahili block borrows the English block\'s area', () => {
    const sw = selectInfo(alert, 'sw');
    expect(sw?.area?.areaDesc).toBe('Dar es Salaam');
    expect(sw?.area?.polygon).toHaveLength(1);
    expect(alert.info?.[1].area).toBeUndefined(); // the parsed alert itself is left alone
  });

  test('covers the place whichever block holds the polygon', () => {
    expect(alertInLocation(alert, DAR)).toBe(true);
    expect(alertInLocation({ ...alert, info: [...alert.info!].reverse() }, DAR)).toBe(true);
    expect(alertInLocation(alert, { latitude: -3.4, longitude: 36.7 })).toBe(false);
  });
});

describe('baseLanguage', () => {
  test.each([
    ['en-US', 'en'], ['sw-TZ', 'sw'], ['SW_tz', 'sw'], ['swa', 'swa'], ['am', 'am'], [undefined, ''],
  ])('%p -> %p', (code, expected) => {
    expect(baseLanguage(code)).toBe(expected);
  });
});

describe('selectInfo', () => {
  test('matches the configured language, ignoring case and region', () => {
    const alert = alertWith(info('en-US', 'Strong winds'), info('SW_tz', 'Upepo mkali'));
    expect(selectInfo(alert, 'sw')?.event).toBe('Upepo mkali');
  });

  test("also matches the codes listed in the language file's cap_language_aliases", () => {
    // swahili.json lists "swa", english.json "eng".
    const alert = alertWith(info('eng', 'Strong winds'), info('swa', 'Upepo mkali'));
    expect(selectInfo(alert, 'sw')?.event).toBe('Upepo mkali');
    expect(selectInfo(alert, 'en')?.event).toBe('Strong winds');
  });

  test('a code no language file claims matches nothing, so the first block shows', () => {
    const alert = alertWith(info('en', 'Strong winds'), info('kis', 'Upepo mkali'));
    expect(selectInfo(alert, 'sw')?.event).toBe('Strong winds');
  });

  test('falls back to the first block when there is none in the language', () => {
    const alert = alertWith(info('sw-TZ', 'Upepo mkali'), info('en-GB', 'Strong winds'));
    expect(selectInfo(alert, 'am')?.event).toBe('Upepo mkali');
  });

  test('a single-language alert shows its only block in every language', () => {
    expect(selectInfo(alertWith(info(undefined, 'Strong winds')), 'sw')?.event).toBe('Strong winds');
  });

  test('no info blocks gives nothing', () => {
    expect(selectInfo({ ...alertWith(), info: undefined }, 'en')).toBeUndefined();
  });
});
