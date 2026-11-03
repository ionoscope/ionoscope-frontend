import { effect, inject, Injectable, signal } from '@angular/core';
import { STORAGE, readJson } from './storage';
import { record } from '../core/api/guards';
@Injectable({ providedIn: 'root' })
export class AppearanceStore {
  private readonly storage = inject(STORAGE);
  private readonly saved = readJson(this.storage, 'ionoscope.appearance.v1');
  readonly size = signal(
    record(this.saved) && [14, 16, 18].includes(Number(this.saved['size']))
      ? Number(this.saved['size'])
      : 16,
  );
  private readonly sync = effect(() => {
    document.documentElement.removeAttribute('data-font');
    document.documentElement.style.setProperty('--ui-font-size', `${this.size()}px`);
    try {
      this.storage.setItem('ionoscope.appearance.v1', JSON.stringify({ size: this.size() }));
    } catch {
      /* Session preference still applies. */
    }
  });
}
