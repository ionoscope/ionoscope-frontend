import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ForecastRequest, ForecastResponse, ParameterInfo, StationInfo } from './api.models';
import { isForecast, isParameter, isStation, record } from './guards';
import { fromCode } from './errors';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  async stations(): Promise<StationInfo[]> {
    const data = await firstValueFrom(
      this.http.get<unknown>(`${environment.apiUrl}/forecast/stations`),
    );
    if (!record(data) || !Array.isArray(data['stations']) || !data['stations'].every(isStation))
      throw fromCode('upstream_error');
    return data['stations'];
  }
  async parameters(): Promise<ParameterInfo[]> {
    const data = await firstValueFrom(
      this.http.get<unknown>(`${environment.apiUrl}/forecast/parameters`),
    );
    if (!Array.isArray(data) || !data.every(isParameter)) throw fromCode('upstream_error');
    return data;
  }
  async forecast(request: ForecastRequest): Promise<ForecastResponse> {
    const data = await firstValueFrom(
      this.http.post<unknown>(`${environment.apiUrl}/forecast`, request),
    );
    if (
      !isForecast(data) ||
      data.station !== request.station ||
      data.role !== request.role ||
      data.parameter !== request.parameter
    )
      throw fromCode('upstream_error');
    return data;
  }
}
