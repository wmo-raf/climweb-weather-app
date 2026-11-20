import { DateTime } from 'luxon';
import { polygon } from '@turf/turf';

import { CAPAlert, CAPInfo } from '@/lib/alerts/providers/cap-alerts/alert';
import { atSeaWarningsFor, isAtSeaWarning } from './warnings';

const KEYWORDS = ['wind', 'sea', 'wave', 'cyclone', 'upepo'];
const NOW = DateTime.fromISO('2026-11-02T09:00:00+03:00');
const DAR = { latitude: -6.8, longitude: 39.28 };

// A square around Dar es Salaam (lon/lat order, as turf expects).
const coast = polygon([[[39, -7], [39.5, -7], [39.5, -6.5], [39, -6.5], [39, -7]]]);

const makeAlert = (id: string, info: Partial<CAPInfo>): CAPAlert => ({
  xmlns: 'urn:oasis:names:tc:emergency:cap:1.2',
  identifier: id,
  sender: 'tma@meteo.go.tz',
  sent: '2026-11-02T06:00:00+03:00',
  status: 'Actual',
  msgType: 'Alert',
  scope: 'Public',
  info: [{
    category: 'Met',
    event: '',
    urgency: 'Expected',
    severity: 'Moderate',
    certainty: 'Likely',
    expires: '2026-11-03T18:00:00+03:00',
    area: { areaDesc: 'Dar es Salaam coast', polygon: [coast] },
    ...info,
  }],
});

describe('isAtSeaWarning', () => {
  test.each([
    ['Strong winds'],
    ['Strong Wind'],
    ['Large waves'],
    ['Rough sea'],
    ['Tropical cyclone'],
    ['Upepo mkali'],
  ])('matches "%s"', event => {
    expect(isAtSeaWarning(makeAlert('a', { event }), KEYWORDS)).toBe(true);
  });

  test.each([
    ['Heavy rain'],
    ['Heavy rainfall this season'], // "sea" inside another word
    ['Windows of dry weather'],     // "wind" inside another word
    ['Seaside flooding'],
  ])('ignores "%s"', event => {
    expect(isAtSeaWarning(makeAlert('a', { event }), KEYWORDS)).toBe(false);
  });

  test('also checks the headline and event codes', () => {
    expect(isAtSeaWarning(makeAlert('a', { event: 'Weather warning', headline: 'Strong winds along the coast' }), KEYWORDS)).toBe(true);
    expect(isAtSeaWarning(makeAlert('a', { event: 'Weather warning', eventCode: [{ valueName: 'TMA', value: 'Wind' }] }), KEYWORDS)).toBe(true);
  });

  test('checks every language block, not just the first', () => {
    const alert = makeAlert('a', { language: 'am', event: 'ኃይለኛ ነፋስ' });
    alert.info!.push({ ...alert.info![0], language: 'en', event: 'Strong winds' });
    expect(isAtSeaWarning(alert, KEYWORDS)).toBe(true);
  });

  test('matches nothing with no keywords configured', () => {
    expect(isAtSeaWarning(makeAlert('a', { event: 'Strong winds' }), [])).toBe(false);
  });
});

describe('atSeaWarningsFor', () => {
  test('keeps only wind/marine warnings covering the place, worst first', () => {
    const alerts = [
      makeAlert('rain', { event: 'Heavy rain' }),
      makeAlert('yellow-wind', { event: 'Strong winds', severity: 'Moderate' }),
      makeAlert('orange-waves', { event: 'Large waves', severity: 'Severe' }),
      makeAlert('elsewhere', { event: 'Strong winds', area: { areaDesc: 'Lake Victoria', polygon: [polygon([[[32, -2], [33, -2], [33, -1], [32, -1], [32, -2]]])] } }),
    ];

    expect(atSeaWarningsFor(alerts, DAR, NOW, KEYWORDS).map(a => a.identifier)).toEqual(['orange-waves', 'yellow-wind']);
  });

  test('drops expired warnings', () => {
    const alerts = [makeAlert('old', { event: 'Strong winds', expires: '2026-11-01T18:00:00+03:00' })];
    expect(atSeaWarningsFor(alerts, DAR, NOW, KEYWORDS)).toEqual([]);
  });

  test('is empty when nothing matches', () => {
    expect(atSeaWarningsFor([makeAlert('rain', { event: 'Heavy rain' })], DAR, NOW, KEYWORDS)).toEqual([]);
  });
});
