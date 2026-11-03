import { computed, inject, Injectable, signal } from '@angular/core';
import { AppError, ForecastResponse, Selection } from '../core/api/api.models';
import { isForecast, isSelection, record, timestamp } from '../core/api/guards';
import { fromCode } from '../core/api/errors';
import { readJson, STORAGE, StorageLike } from './storage';

export interface ForecastCard {
  station: string;
  status: 'loading' | 'success' | 'error';
  forecast: ForecastResponse | null;
  error: AppError | null;
  explanation: string;
}
export interface HistoryEntry {
  title?: string;
  id: string;
  createdAt: string;
  selection: Selection;
  cards: ForecastCard[];
}
const KEY = 'ionoscope.history.v1';
function isCard(v: unknown): v is ForecastCard {
  return (
    record(v) &&
    typeof v['station'] === 'string' &&
    ['loading', 'success', 'error'].includes(String(v['status'])) &&
    (v['forecast'] === null || isForecast(v['forecast'])) &&
    (v['status'] !== 'success' || isForecast(v['forecast'])) &&
    (v['error'] === null ||
      (record(v['error']) &&
        typeof v['error']['code'] === 'string' &&
        typeof v['error']['message'] === 'string' &&
        typeof v['error']['retryable'] === 'boolean')) &&
    typeof v['explanation'] === 'string'
  );
}
function isEntry(v: unknown): v is HistoryEntry {
  return (
    record(v) &&
    typeof v['id'] === 'string' &&
    (v['title'] === undefined || typeof v['title'] === 'string') &&
    timestamp(v['createdAt']) &&
    isSelection(v['selection']) &&
    Array.isArray(v['cards']) &&
    v['cards'].every(isCard)
  );
}
export function persistHistory(
  storage: StorageLike,
  entries: HistoryEntry[],
): { saved: HistoryEntry[]; limited: boolean } {
  const saved = entries.slice(0, 30);
  let limited = entries.length > 30;
  while (true) {
    try {
      storage.setItem(KEY, JSON.stringify(saved));
      return { saved, limited };
    } catch {
      limited = true;
      if (!saved.length) return { saved, limited };
      saved.pop();
    }
  }
}
@Injectable({ providedIn: 'root' })
export class HistoryStore {
  private readonly storage = inject(STORAGE);
  private readonly raw = readJson(this.storage, KEY);
  readonly entries = signal<HistoryEntry[]>(
    Array.isArray(this.raw)
      ? this.raw
          .filter(isEntry)
          .slice(0, 30)
          .map((entry) => ({
            ...entry,
            cards: entry.cards.map((card) =>
              card.status === 'loading'
                ? { ...card, status: 'error', error: fromCode('forecast_unavailable') }
                : card,
            ),
          }))
      : [],
  );
  readonly activeId = signal<string | null>(null);
  readonly fromHistory = signal(false);
  readonly storageWarning = signal(false);
  readonly active = computed(() => this.entries().find((e) => e.id === this.activeId()) ?? null);
  add(selection: Selection): HistoryEntry {
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      selection: structuredClone(selection),
      cards: selection.stations.map((station) => ({
        station,
        status: 'loading',
        forecast: null,
        error: null,
        explanation: '',
      })),
    };
    this.entries.update((entries) => [entry, ...entries].slice(0, 30));
    this.activeId.set(entry.id);
    this.fromHistory.set(false);
    this.persist();
    return entry;
  }
  update(id: string, station: string, update: Partial<ForecastCard>): void {
    this.entries.update((entries) =>
      entries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              cards: entry.cards.map((card) =>
                card.station === station ? { ...card, ...update } : card,
              ),
            }
          : entry,
      ),
    );
    this.persist();
  }
  open(id: string): void {
    this.activeId.set(id);
    this.fromHistory.set(true);
  }
  newRequest(): void {
    this.activeId.set(null);
    this.fromHistory.set(false);
  }
  remove(id: string): void {
    this.entries.update((entries) => entries.filter((entry) => entry.id !== id));
    if (this.activeId() === id) this.newRequest();
    this.persist();
  }
  rename(id: string, title: string): void {
    this.entries.update((entries) =>
      entries.map((entry) =>
        entry.id === id ? { ...entry, title: title.trim().slice(0, 100) } : entry,
      ),
    );
    this.persist();
  }
  restore(entry: HistoryEntry, index: number): void {
    if (this.entries().some((value) => value.id === entry.id)) return;
    this.entries.update((entries) => {
      const next = [...entries];
      next.splice(index, 0, entry);
      return next.slice(0, 30);
    });
    this.persist();
  }
  clear(): void {
    this.entries.set([]);
    this.newRequest();
    this.persist();
  }
  private persist(): void {
    const result = persistHistory(this.storage, this.entries());
    this.storageWarning.set(result.limited);
  }
}
