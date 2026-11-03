import { HttpErrorResponse } from '@angular/common/http';
import { AppError } from './api.models';
import { record } from './guards';

const messages: Record<string, string> = {
  invalid_station: 'Станция не найдена. Выберите другую.',
  station_not_found: 'Станция не найдена. Выберите другую.',
  parameter_unavailable: 'Этот признак пока недоступен.',
  forecast_unavailable: 'Прогноз сейчас недоступен. Попробуйте позже.',
  insufficient_observations: 'Недостаточно свежих наблюдений на станции для прогноза.',
  forecast_expired: 'Прогноз устарел. Запросите новый.',
  explanation_unavailable: 'Не удалось получить объяснение.',
  station_inactive: 'На станции нет свежих наблюдений. Выберите другую.',
  rate_limited: 'Слишком много запросов. Подождите немного и повторите попытку.',
};
export function appError(value: unknown): AppError {
  if (record(value) && typeof value['code'] === 'string' && typeof value['retryable'] === 'boolean')
    return fromCode(value['code']);
  const body: unknown = value instanceof HttpErrorResponse ? value.error : value;
  const code =
    record(body) && record(body['detail']) && typeof body['detail']['code'] === 'string'
      ? body['detail']['code']
      : 'upstream_error';
  return fromCode(code);
}
export function fromCode(code: string): AppError {
  return {
    code,
    message: messages[code] ?? 'Сервис временно недоступен. Повторите попытку.',
    retryable: ![
      'invalid_station',
      'station_not_found',
      'parameter_unavailable',
      'station_inactive',
      'invalid_request',
    ].includes(code),
  };
}
