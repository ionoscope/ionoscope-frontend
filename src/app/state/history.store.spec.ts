import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { HistoryEntry, HistoryStore, persistHistory } from './history.store';
import { STORAGE, StorageLike } from './storage';
function memory(limit = Infinity): StorageLike {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      if (value.length > limit) throw new DOMException('quota', 'QuotaExceededError');
      data.set(key, value);
    },
  };
}
const selection = {
  role: 'geodesist',
  stations: ['TR169'],
  parameter: 'foF2',
} satisfies HistoryEntry['selection'];
function store(storage: StorageLike): HistoryStore {
  return runInInjectionContext(
    Injector.create({ providers: [{ provide: STORAGE, useValue: storage }] }),
    () => new HistoryStore(),
  );
}
describe('history', () => {
  it('retains the last 30 requests', () => {
    const history = store(memory());
    for (let i = 0; i < 35; i++) history.add(selection);
    expect(history.entries()).toHaveLength(30);
    expect(history.entries()[0]?.id).toBe(history.activeId());
  });
  it('trims oldest saved entries when quota is exceeded', () => {
    const history = store(memory());
    for (let i = 0; i < 8; i++) history.add(selection);
    const entries = history.entries();
    const one = JSON.stringify(entries.slice(0, 2)).length;
    const storage = memory(one);
    const result = persistHistory(storage, entries);
    expect(result.limited).toBe(true);
    expect(result.saved).toHaveLength(2);
    expect(result.saved[0]?.id).toBe(entries[0]?.id);
  });
  it('does not throw when storage is completely unavailable', () => {
    const history = store(memory(0));
    expect(() => history.add(selection)).not.toThrow();
    expect(history.storageWarning()).toBe(true);
    expect(history.entries()).toHaveLength(1);
  });
  it('ignores malformed stored data', () => {
    const storage = memory();
    storage.setItem('ionoscope.history.v1', '[{"id":"bad"}]');
    expect(store(storage).entries()).toEqual([]);
  });
  it('restores interrupted loading as a retryable error', () => {
    const storage = memory();
    store(storage).add(selection);
    const restored = store(storage);
    expect(restored.entries()[0]?.cards[0]?.status).toBe('error');
  });
});
