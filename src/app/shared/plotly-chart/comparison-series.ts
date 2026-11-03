import type { PlotData } from 'plotly.js';
import { ArchivedForecast, ObservedPoint } from '../../core/api/api.models';

export function observationEnd(point: ObservedPoint, stepMinutes: number): string {
  return new Date(Date.parse(point.t) + stepMinutes * 60_000).toISOString();
}

/** One latest saved run per model/source and target interval; gaps stay visible. */
export function plottedForecasts(items: ArchivedForecast[]): ArchivedForecast[] {
  const points = new Map<string, ArchivedForecast>();
  for (const item of items) {
    if (!item.forecast_timestamp || !item.forecast_interval_start) continue;
    const key = `${item.source}|${item.model}|${item.model_version}|${item.forecast_timestamp}`;
    const previous = points.get(key);
    if (!previous || Date.parse(item.generated_at) > Date.parse(previous.generated_at))
      points.set(key, item);
  }
  return [...points.values()].sort(
    (a, b) => Date.parse(a.forecast_timestamp ?? '') - Date.parse(b.forecast_timestamp ?? ''),
  );
}

export function comparisonMetrics(items: ArchivedForecast[]): {
  count: number;
  matched: number;
  mae: number | null;
  rmse: number | null;
} {
  const points = plottedForecasts(items);
  const errors = points
    .filter((item) => item.verification_status === 'verified' && item.actual !== null)
    .map((item) => item.prediction - Number(item.actual));
  return {
    count: points.length,
    matched: errors.length,
    mae: errors.length
      ? errors.reduce((sum, error) => sum + Math.abs(error), 0) / errors.length
      : null,
    rmse: errors.length ? Math.hypot(...errors) / Math.sqrt(errors.length) : null,
  };
}

export function comparisonTraces(
  items: ArchivedForecast[],
  colors: { observed: string; forecast: string },
  showActual = true,
): Partial<PlotData>[] {
  const points = plottedForecasts(items);
  const traces: Partial<PlotData>[] = [];
  if (showActual) {
    const actual = new Map<string, number>();
    for (const item of points)
      if (
        item.forecast_timestamp &&
        item.actual !== null &&
        item.verification_status === 'verified'
      )
        actual.set(item.forecast_timestamp, item.actual);
    const allTimes = [
      ...new Set(
        points.map((item) => item.forecast_timestamp).filter((t): t is string => t !== null),
      ),
    ].sort();
    const x: (string | null)[] = [];
    const y: (number | null)[] = [];
    for (const t of allTimes) {
      const previous = x[x.length - 1];
      if (previous && Date.parse(t) - Date.parse(previous) > 15 * 60_000) {
        x.push(null);
        y.push(null);
      }
      x.push(t);
      y.push(actual.get(t) ?? null);
    }
    traces.push({
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Фактические значения',
      x,
      y,
      connectgaps: false,
      line: { color: colors.observed, width: 2 },
      marker: { size: 7 },
      hovertemplate: '%{x|%d.%m.%Y %H:%M} UTC<br>Факт: %{y:.3f} МГц<extra></extra>',
    });
  }
  const groups = new Map<string, ArchivedForecast[]>();
  for (const item of points) {
    const key = `${item.source}|${item.model}|${item.model_version}`;
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    const first = group[0];
    if (!first) continue;
    const x: (string | null)[] = [];
    const y: (number | null)[] = [];
    const hover: string[] = [];
    for (const item of group) {
      const t = item.forecast_timestamp;
      if (!t) continue;
      const previous = x[x.length - 1];
      if (previous && Date.parse(t) - Date.parse(previous) > 15 * 60_000) {
        x.push(null);
        y.push(null);
        hover.push('');
      }
      x.push(t);
      y.push(item.prediction);
      const error =
        item.actual !== null && item.verification_status === 'verified'
          ? Math.abs(item.prediction - item.actual)
          : null;
      hover.push(
        `%{x|%d.%m.%Y %H:%M} UTC<br>Прогноз: %{y:.3f} ${item.unit}<br>${error === null ? 'Факт пока отсутствует' : `Факт: ${item.actual?.toFixed(3)} ${item.unit}<br>|Ошибка|: ${error.toFixed(3)} ${item.unit}`}<br>Расчёт: ${item.generated_at}<br>Модель: ${item.model_version}<extra></extra>`,
      );
    }
    const label = first.source === 'api' ? 'Прогнозы сервиса' : 'Контрольные расчёты модели';
    traces.push({
      type: 'scatter',
      mode: 'lines+markers',
      name: label,
      x,
      y,
      connectgaps: false,
      line: { color: colors.forecast, width: 2, dash: 'dash' },
      marker: {
        color: colors.forecast,
        size: 8,
        symbol: first.source === 'api' ? 'diamond' : 'circle-open',
      },
      hovertemplate: hover,
    });
  }
  return traces;
}
