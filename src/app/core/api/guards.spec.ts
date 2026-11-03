import { describe, expect, it } from 'vitest';
import { mockForecast } from '../../mocks/fixtures';
import { isForecast, isSelection } from './guards';

describe('boundary validation', () => {
  const valid = () =>
    mockForecast({ station: 'TR169', parameter: 'foF2', role: 'geodesist' }, Date.now(), '');
  it('accepts complete mock responses, including nullable bounds', () =>
    expect(isForecast(valid())).toBe(true));
  it.each([
    null,
    [],
    { prediction: 5 },
    { ...valid(), prediction: NaN },
    { ...valid(), generated_at: '2026-01-01T03:00:00+03:00' },
    { ...valid(), series: { observed: [] } },
  ])('rejects unexpected payloads', (value) => expect(isForecast(value)).toBe(false));
  it('accepts nullable fields from the actual backend contract', () =>
    expect(isForecast({ ...valid(), observation_timestamp: null, stale_after: null })).toBe(true));
  it('requires one to five unique station codes', () => {
    const base = { role: 'geodesist', parameter: 'foF2' };
    expect(isSelection({ ...base, stations: [] })).toBe(false);
    expect(isSelection({ ...base, stations: ['TR169', 'TR169'] })).toBe(false);
    expect(isSelection({ ...base, stations: ['A', 'B', 'C', 'D', 'E', 'F'] })).toBe(false);
    expect(isSelection({ ...base, stations: ['A', 'B', 'C', 'D', 'E'] })).toBe(true);
  });
});
