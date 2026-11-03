import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { isRole, record } from '../core/api/guards';
import { MOCK_PARAMETERS, MOCK_STATIONS, mockForecast, mockMode } from './fixtures';

export const mockApiInterceptor: HttpInterceptorFn = (request, next) => {
  // Historical results are never fabricated, even while current forecasts use demo data.
  if (request.method === 'GET' && request.url.endsWith('/forecast/history')) return next(request);
  if (!environment.useMocks || !request.url.startsWith(environment.apiUrl)) return next(request);
  if (request.url.endsWith('/forecast/stations'))
    return of(new HttpResponse({ body: { stations: MOCK_STATIONS } })).pipe(delay(200));
  if (request.url.endsWith('/forecast/parameters'))
    return of(new HttpResponse({ body: MOCK_PARAMETERS })).pipe(delay(150));
  const body: unknown = request.body;
  if (
    request.method === 'POST' &&
    request.url.endsWith('/forecast') &&
    record(body) &&
    typeof body['station'] === 'string' &&
    typeof body['parameter'] === 'string' &&
    isRole(body['role'])
  ) {
    if (mockMode() === 'error')
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 503,
            error: { detail: { code: 'forecast_unavailable', message: 'mock' } },
          }),
      ).pipe(delay(400));
    return of(
      new HttpResponse({
        body: mockForecast({
          station: body['station'],
          parameter: body['parameter'],
          role: body['role'],
        }),
      }),
    ).pipe(delay(650));
  }
  return throwError(
    () =>
      new HttpErrorResponse({
        status: 404,
        error: { detail: { code: 'station_not_found', message: 'mock' } },
      }),
  );
};
