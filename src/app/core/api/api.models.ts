export type Role = 'drone_pilot' | 'geodesist' | 'aviation_emergency';
export type FreshnessStatus = 'fresh' | 'stale' | 'expired';
export interface Selection {
  role: Role;
  stations: string[];
  parameter: string;
}
export interface ForecastRequest {
  station: string;
  parameter: string;
  role: Role;
}
export interface ObservedPoint {
  t: string;
  value: number | null;
}
export interface ForecastPoint {
  t_start: string;
  t_end: string;
  value: number;
  lower: number | null;
  upper: number | null;
}
export interface TableColumn {
  key: string;
  label: string;
  unit: string | null;
}
export interface ForecastTable {
  columns: TableColumn[];
  rows: Record<string, string | number | null>[];
}
export interface ForecastResponse {
  forecast_id: string;
  station: string;
  parameter: string;
  role: Role;
  unit: string;
  horizon: string;
  prediction: number;
  source_timestamp: string;
  forecast_interval_start: string | null;
  forecast_timestamp: string | null;
  observation_timestamp: string | null;
  generated_at: string;
  model: string;
  model_version: string;
  cached: boolean;
  freshness_status: FreshnessStatus;
  freshness_message: string | null;
  stale_after: string | null;
  valid_until: string | null;
  series: { step_minutes: number; observed: ObservedPoint[]; forecast: ForecastPoint[] };
  table: ForecastTable;
  explanation: string | null;
}
export interface StationInfo {
  code: string;
  name: string;
  lat: number | null;
  lon: number | null;
  active: boolean;
  freshness_status: FreshnessStatus | 'missing';
  mock?: boolean;
}
export interface ParameterInfo {
  id: string;
  label: string;
  unit: string;
  available: boolean;
}
export type ApiErrorCode =
  | 'invalid_station'
  | 'station_not_found'
  | 'parameter_unavailable'
  | 'forecast_unavailable'
  | 'insufficient_observations'
  | 'forecast_expired'
  | 'explanation_unavailable'
  | 'upstream_error'
  | 'upstream_timeout'
  | 'station_inactive'
  | 'cache_unavailable'
  | 'rate_limited'
  | 'invalid_request'
  | 'internal_error';
export interface ApiErrorBody {
  detail: { code: ApiErrorCode; message: string };
}
export interface AppError {
  code: string;
  message: string;
  retryable: boolean;
}

export type VerificationStatus =
  'verified' | 'pending' | 'observation_missing' | 'observations_unavailable' | 'unverifiable';
export interface ArchivedForecast {
  forecast_id: string;
  station: string;
  parameter: string;
  unit: string;
  prediction: number;
  generated_at: string;
  forecast_interval_start: string | null;
  forecast_timestamp: string | null;
  model: string;
  model_version: string;
  source: 'api' | 'shadow_original';
  actual: number | null;
  actual_observation_timestamp: string | null;
  signed_error: number | null;
  absolute_error: number | null;
  percentage_error: number | null;
  verification_status: VerificationStatus;
}
export interface ForecastArchive {
  station: string;
  start: string;
  end: string;
  items: ArchivedForecast[];
  total: number;
  limit: number;
  verified_count: number;
  mae: number | null;
  rmse: number | null;
  unit: string;
  observations_available: boolean;
}
