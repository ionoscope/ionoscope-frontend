import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { ApiService } from '../core/api/api.service';
import { ForecastRequest, ForecastResponse } from '../core/api/api.models';
import { mockForecast } from '../mocks/fixtures';
import { ChatStore } from './chat.store';
import { HistoryStore } from './history.store';
import { STORAGE } from './storage';

describe('forecast concurrency', () => {
  it('processes five stations with at most three simultaneous requests', async () => {
    let active = 0;
    let maximum = 0;
    const completions: (() => void)[] = [];
    const forecast = (request: ForecastRequest) =>
      new Promise<ForecastResponse>((resolve) => {
        active++;
        maximum = Math.max(maximum, active);
        completions.push(() => {
          active--;
          resolve(mockForecast(request, Date.now(), ''));
        });
      });
    const injector = Injector.create({
      providers: [
        HistoryStore,
        { provide: ApiService, useValue: { forecast } },
        { provide: STORAGE, useValue: { getItem: () => null, setItem: () => undefined } },
      ],
    });
    const chat = runInInjectionContext(injector, () => new ChatStore());
    const pending = chat.request({
      stations: ['A', 'B', 'C', 'D', 'E'],
      role: 'geodesist',
      parameter: 'foF2',
    });
    expect(active).toBe(3);
    completions.shift()?.();
    await vi.waitFor(() => expect(completions.length).toBe(3));
    while (completions.length) {
      completions.shift()?.();
      await Promise.resolve();
    }
    await pending;
    expect(maximum).toBe(3);
    expect(chat.busy()).toBe(false);
    expect(chat.history.active()?.cards.every((card) => card.status === 'success')).toBe(true);
  });
});
