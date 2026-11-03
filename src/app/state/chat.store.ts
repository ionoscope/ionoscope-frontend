import { computed, inject, Injectable, signal } from '@angular/core';
import { ApiService } from '../core/api/api.service';
import { Selection } from '../core/api/api.models';
import { appError } from '../core/api/errors';
import { HistoryEntry, HistoryStore } from './history.store';
@Injectable({ providedIn: 'root' })
export class ChatStore {
  private readonly api = inject(ApiService);
  readonly history = inject(HistoryStore);
  readonly completed = signal(0);
  readonly total = signal(0);
  readonly progress = computed(() => (this.total() ? (this.completed() / this.total()) * 100 : 0));
  readonly busy = signal(false);
  async request(selection: Selection): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.completed.set(0);
    this.total.set(selection.stations.length);
    const entry = this.history.add(selection);
    const queue = [...selection.stations];
    try {
      await Promise.all(
        Array.from({ length: Math.min(3, queue.length) }, async () => {
          let station = queue.shift();
          while (station) {
            await this.load(entry, station);
            station = queue.shift();
          }
        }),
      );
    } finally {
      this.busy.set(false);
    }
  }
  async refresh(entry: HistoryEntry, station: string): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.completed.set(0);
    this.total.set(1);
    this.history.update(entry.id, station, {
      status: 'loading',
      forecast: null,
      error: null,
      explanation: '',
    });
    try {
      await this.load(entry, station);
    } finally {
      this.busy.set(false);
    }
  }
  private async load(entry: HistoryEntry, station: string): Promise<void> {
    try {
      const forecast = await this.api.forecast({
        station,
        parameter: entry.selection.parameter,
        role: entry.selection.role,
      });
      this.history.update(entry.id, station, {
        status: 'success',
        forecast,
        error: null,
        explanation: forecast.explanation ?? '',
      });
    } catch (error: unknown) {
      this.history.update(entry.id, station, { status: 'error', error: appError(error) });
    } finally {
      this.completed.update((value) => value + 1);
    }
  }
}
