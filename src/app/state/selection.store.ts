import { inject, Injectable, signal } from '@angular/core';
import { Selection } from '../core/api/api.models';
import { isSelection } from '../core/api/guards';
import { readJson, STORAGE } from './storage';
const KEY = 'ionoscope.selection.v1';
@Injectable({ providedIn: 'root' })
export class SelectionStore {
  private readonly storage = inject(STORAGE);
  private readonly initial = readJson(this.storage, KEY);
  readonly value = signal<Selection | null>(isSelection(this.initial) ? this.initial : null);
  readonly storageWarning = signal(false);
  save(value: Selection): void {
    if (!isSelection(value)) return;
    this.value.set(structuredClone(value));
    try {
      this.storage.setItem(KEY, JSON.stringify(value));
      this.storageWarning.set(false);
    } catch {
      this.storageWarning.set(true);
    }
  }
}
