import { describe, expect, it } from 'vitest';
import { ArchivedForecast } from '../../core/api/api.models';
import {
  comparisonMetrics,
  comparisonTraces,
  observationEnd,
  plottedForecasts,
} from './comparison-series';

function item(overrides: Partial<ArchivedForecast> = {}): ArchivedForecast {
  return {
    forecast_id: 'a',
    station: 'TR169',
    parameter: 'foF2',
    unit: 'MHz',
    prediction: 6,
    generated_at: '2026-10-25T11:47:00Z',
    forecast_interval_start: '2026-10-25T11:45:00Z',
    forecast_timestamp: '2026-10-25T12:00:00Z',
    model: 'model',
    model_version: '1',
    source: 'api',
    actual: 5,
    actual_observation_timestamp: '2026-10-25T11:50:00Z',
    signed_error: 1,
    absolute_error: 1,
    percentage_error: 20,
    verification_status: 'verified',
    ...overrides,
  };
}
describe('historical comparison graph', () => {
  it('aligns observed interval starts to forecast interval ends', () => {
    expect(observationEnd({ t: '2026-10-25T11:45:00Z', value: 5 }, 15)).toBe(
      '2026-10-25T12:00:00.000Z',
    );
    const traces = comparisonTraces([item()], { observed: 'blue', forecast: 'orange' });
    expect(traces[0]?.x).toEqual(['2026-10-25T12:00:00Z']);
    expect(traces[1]?.x).toEqual(traces[0]?.x);
    expect(traces[0]?.y).toEqual([5]);
    expect(traces[1]?.y).toEqual([6]);
  });
  it('keeps only the latest actual saved run for a model and interval', () => {
    const points = [
      item(),
      item({ forecast_id: 'later', generated_at: '2026-10-25T11:55:00Z', prediction: 7 }),
    ];
    expect(plottedForecasts(points)).toHaveLength(1);
    expect(comparisonMetrics(points)).toEqual({ count: 1, matched: 1, mae: 2, rmse: 2 });
  });
  it('keeps separate model/source series', () => {
    const points = [item(), item({ source: 'shadow_original' }), item({ model_version: '2' })];
    expect(plottedForecasts(points)).toHaveLength(3);
    expect(comparisonTraces(points, { observed: 'blue', forecast: 'orange' })).toHaveLength(4);
  });
  it('does not make up actuals or zero errors', () => {
    const points = [
      item({
        actual: null,
        absolute_error: null,
        signed_error: null,
        percentage_error: null,
        verification_status: 'observation_missing',
      }),
    ];
    expect(comparisonMetrics(points)).toEqual({ count: 1, matched: 0, mae: null, rmse: null });
    expect(comparisonTraces(points, { observed: 'blue', forecast: 'orange' })[0]?.y).toEqual([
      null,
    ]);
  });
  it('breaks the orange line across missing forecast intervals', () => {
    const later = item({
      forecast_id: 'b',
      forecast_interval_start: '2026-10-25T12:45:00Z',
      forecast_timestamp: '2026-10-25T13:00:00Z',
    });
    const trace = comparisonTraces([item(), later], { observed: 'blue', forecast: 'orange' })[1];
    expect(trace?.x).toEqual(['2026-10-25T12:00:00Z', null, '2026-10-25T13:00:00Z']);
    expect(trace?.connectgaps).toBe(false);
  });
});
