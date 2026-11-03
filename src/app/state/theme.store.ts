import { effect, inject, Injectable, signal } from '@angular/core';
import { STORAGE } from './storage';
@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly storage = inject(STORAGE);
  private readonly media = matchMedia('(prefers-color-scheme: dark)');
  private readonly saved = this.read();
  readonly theme = signal<'light' | 'dark'>(this.saved ?? (this.media.matches ? 'dark' : 'light'));
  private chosen = this.saved !== null;
  private readonly synchronize = effect((onCleanup) => {
    document.documentElement.dataset['theme'] = this.theme();
    const listener = (event: MediaQueryListEvent) => {
      if (!this.chosen) this.theme.set(event.matches ? 'dark' : 'light');
    };
    this.media.addEventListener('change', listener);
    onCleanup(() => this.media.removeEventListener('change', listener));
  });
  toggle(): void {
    this.chosen = true;
    this.theme.update((value) => (value === 'light' ? 'dark' : 'light'));
    try {
      this.storage.setItem('ionoscope.theme.v1', this.theme());
    } catch {
      /* Theme still works for this session. */
    }
  }
  private read(): 'light' | 'dark' | null {
    try {
      const value = this.storage.getItem('ionoscope.theme.v1');
      return value === 'light' || value === 'dark' ? value : null;
    } catch {
      return null;
    }
  }
}
