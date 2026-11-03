import { inject, Injectable, signal } from '@angular/core';
import { ApiService } from '../core/api/api.service';
import { AppError, ParameterInfo, StationInfo } from '../core/api/api.models';
import { appError } from '../core/api/errors';
@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private readonly api = inject(ApiService);
  readonly stations = signal<StationInfo[]>([]);
  readonly parameters = signal<ParameterInfo[]>([]);
  readonly loading = signal(false);
  readonly error = signal<AppError | null>(null);
  async load(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const [stations, parameters] = await Promise.all([
        this.api.stations(),
        this.api.parameters(),
      ]);
      this.stations.set(stations);
      this.parameters.set(parameters);
    } catch (error: unknown) {
      this.error.set(appError(error));
    } finally {
      this.loading.set(false);
    }
  }
}
