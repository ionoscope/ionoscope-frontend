import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ForecastArchive } from './api.models';
import { isArchive } from './guards';
import { fromCode } from './errors';

@Injectable({ providedIn: 'root' })
export class ArchiveService {
  private readonly http = inject(HttpClient);
  async load(station: string, start: string, end: string, limit = 100): Promise<ForecastArchive> {
    const value = await firstValueFrom(
      this.http.get<unknown>(`${environment.apiUrl}/forecast/history`, {
        params: { station, start, end, limit },
      }),
    );
    if (!isArchive(value)) throw fromCode('upstream_error');
    return value;
  }
}
