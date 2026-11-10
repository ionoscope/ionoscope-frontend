import {
  ForecastResponse,
  ParameterInfo,
  Role,
  Selection,
  StationInfo,
  ForecastArchive,
} from './api.models';

export function record(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
export function finite(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}
function nullableNumber(v: unknown): boolean {
  return v === null || finite(v);
}
export function timestamp(v: unknown): v is string {
  return typeof v === 'string' && v.endsWith('Z') && Number.isFinite(Date.parse(v));
}
function nullableTime(v: unknown): boolean {
  return v === null || timestamp(v);
}
export function isRole(v: unknown): v is Role {
  return v === 'drone_pilot' || v === 'geodesist' || v === 'aviation_emergency';
}
export function isSelection(v: unknown): v is Selection {
  return (
    record(v) &&
    isRole(v['role']) &&
    Array.isArray(v['stations']) &&
    v['stations'].length >= 1 &&
    v['stations'].length <= 5 &&
    v['stations'].every((s: unknown) => typeof s === 'string' && /^[A-Z0-9_-]{1,32}$/.test(s)) &&
    new Set(v['stations']).size === v['stations'].length &&
    typeof v['parameter'] === 'string'
  );
}
export function isStation(v: unknown): v is StationInfo {
  return (
    record(v) &&
    typeof v['code'] === 'string' &&
    typeof v['name'] === 'string' &&
    nullableNumber(v['lat']) &&
    nullableNumber(v['lon']) &&
    typeof v['active'] === 'boolean' &&
    (v['forecast_available'] === undefined || typeof v['forecast_available'] === 'boolean') &&
    (v['last_observation'] === undefined || nullableTime(v['last_observation'])) &&
    ['fresh', 'stale', 'expired', 'missing'].includes(String(v['freshness_status']))
  );
}
export function isParameter(v: unknown): v is ParameterInfo {
  return (
    record(v) &&
    typeof v['id'] === 'string' &&
    typeof v['label'] === 'string' &&
    typeof v['unit'] === 'string' &&
    typeof v['available'] === 'boolean'
  );
}
export function isForecast(v: unknown): v is ForecastResponse {
  if (
    !record(v) ||
    !isRole(v['role']) ||
    !['fresh', 'stale', 'expired'].includes(String(v['freshness_status']))
  )
    return false;
  for (const key of [
    'forecast_id',
    'station',
    'parameter',
    'unit',
    'horizon',
    'model',
    'model_version',
  ])
    if (typeof v[key] !== 'string' || !v[key]) return false;
  if (
    !finite(v['prediction']) ||
    typeof v['cached'] !== 'boolean' ||
    !timestamp(v['source_timestamp']) ||
    !timestamp(v['generated_at'])
  )
    return false;
  for (const key of [
    'forecast_interval_start',
    'forecast_timestamp',
    'observation_timestamp',
    'stale_after',
    'valid_until',
  ])
    if (!nullableTime(v[key])) return false;
  if (
    !(v['explanation'] === null || typeof v['explanation'] === 'string') ||
    !(v['freshness_message'] === null || typeof v['freshness_message'] === 'string')
  )
    return false;
  const series = v['series'];
  const table = v['table'];
  if (
    !record(series) ||
    !finite(series['step_minutes']) ||
    series['step_minutes'] <= 0 ||
    !Array.isArray(series['observed']) ||
    !Array.isArray(series['forecast'])
  )
    return false;
  if (
    !series['observed'].every(
      (p: unknown) => record(p) && timestamp(p['t']) && nullableNumber(p['value']),
    )
  )
    return false;
  if (
    !series['forecast'].every(
      (p: unknown) =>
        record(p) &&
        timestamp(p['t_start']) &&
        timestamp(p['t_end']) &&
        finite(p['value']) &&
        nullableNumber(p['lower']) &&
        nullableNumber(p['upper']),
    )
  )
    return false;
  if (
    !record(table) ||
    !Array.isArray(table['columns']) ||
    !table['columns'].length ||
    !Array.isArray(table['rows'])
  )
    return false;
  if (
    !table['columns'].every(
      (c: unknown) =>
        record(c) &&
        typeof c['key'] === 'string' &&
        typeof c['label'] === 'string' &&
        (c['unit'] === null || typeof c['unit'] === 'string'),
    )
  )
    return false;
  return table['rows'].every(
    (r: unknown) =>
      record(r) &&
      Object.values(r).every((cell) => cell === null || typeof cell === 'string' || finite(cell)),
  );
}

export function isArchive(v: unknown): v is ForecastArchive {
  return (
    record(v) &&
    typeof v['station'] === 'string' &&
    timestamp(v['start']) &&
    timestamp(v['end']) &&
    typeof v['unit'] === 'string' &&
    typeof v['observations_available'] === 'boolean' &&
    ['total', 'limit', 'verified_count'].every(
      (key) => finite(v[key]) && Number.isInteger(v[key]) && Number(v[key]) >= 0,
    ) &&
    nullableNumber(v['mae']) &&
    nullableNumber(v['rmse']) &&
    Array.isArray(v['items']) &&
    v['items'].every(
      (item: unknown) =>
        record(item) &&
        ['forecast_id', 'station', 'parameter', 'unit', 'model', 'model_version'].every(
          (key) => typeof item[key] === 'string',
        ) &&
        timestamp(item['generated_at']) &&
        nullableTime(item['forecast_interval_start']) &&
        nullableTime(item['forecast_timestamp']) &&
        nullableTime(item['actual_observation_timestamp']) &&
        finite(item['prediction']) &&
        ['actual', 'signed_error', 'absolute_error', 'percentage_error'].every((key) =>
          nullableNumber(item[key]),
        ) &&
        ['api', 'shadow_original'].includes(String(item['source'])) &&
        [
          'verified',
          'pending',
          'observation_missing',
          'observations_unavailable',
          'unverifiable',
        ].includes(String(item['verification_status'])),
    )
  );
}
