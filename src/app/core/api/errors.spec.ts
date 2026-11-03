import { describe, expect, it } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { appError } from './errors';
describe('API errors', () => {
  it('uses a local dictionary, not upstream message', () => {
    expect(
      appError(
        new HttpErrorResponse({
          status: 404,
          error: { detail: { code: 'station_not_found', message: '<script>bad</script>' } },
        }),
      ),
    ).toEqual({
      code: 'station_not_found',
      message: 'Станция не найдена. Выберите другую.',
      retryable: false,
    });
  });
  it.each([null, 'bad', { detail: [] }, new HttpErrorResponse({ status: 0 })])(
    'maps malformed and network failures',
    (value) => {
      expect(appError(value).retryable).toBe(true);
      expect(appError(value).message).toContain('Сервис временно недоступен');
    },
  );
  it('makes expired forecasts retryable', () =>
    expect(appError({ detail: { code: 'forecast_expired' } }).retryable).toBe(true));
});
