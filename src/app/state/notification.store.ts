import { computed, inject, Injectable, signal } from '@angular/core';
import { STORAGE, readJson } from './storage';
import { record } from '../core/api/guards';
export type NoticeKind = 'forecast' | 'archive' | 'error' | 'system';
export interface Notice {
  id: string;
  kind: NoticeKind;
  title: string;
  message: string;
  time: string;
  read: boolean;
}
export interface Toast {
  id: string;
  text: string;
  kind: NoticeKind;
  undo?: () => void;
}
@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly storage = inject(STORAGE);
  private readonly raw = readJson(this.storage, 'ionoscope.notification-preferences.v1');
  readonly preferences = signal<Record<NoticeKind, boolean>>({
    forecast: true,
    archive: true,
    error: true,
    system: true,
  });
  readonly items = signal<Notice[]>([]);
  readonly toasts = signal<Toast[]>([]);
  readonly unread = computed(() => this.items().filter((item) => !item.read).length);
  private readonly initialization = (() => {
    if (record(this.raw)) {
      const raw = this.raw;
      this.preferences.update((value) => ({
        ...value,
        ...Object.fromEntries(
          Object.keys(value)
            .filter((key) => typeof raw[key] === 'boolean')
            .map((key) => [key, raw[key]]),
        ),
      }));
    }
  })();
  push(kind: NoticeKind, title: string, message: string): void {
    if (!this.preferences()[kind]) return;
    this.items.update((items) =>
      [
        {
          id: crypto.randomUUID(),
          kind,
          title,
          message,
          time: new Date().toISOString(),
          read: false,
        },
        ...items,
      ].slice(0, 50),
    );
    this.toast(title, undefined, kind);
  }
  toast(text: string, undo?: () => void, kind: NoticeKind = 'system'): void {
    const toast: Toast = { id: crypto.randomUUID(), text, kind, ...(undo ? { undo } : {}) };
    this.toasts.update((items) => [...items, toast].slice(-3));
    setTimeout(() => this.dismiss(toast.id), undo ? 10000 : 5500);
  }
  dismiss(id: string): void {
    this.toasts.update((items) => items.filter((item) => item.id !== id));
  }
  undo(toast: Toast): void {
    toast.undo?.();
    this.dismiss(toast.id);
  }
  markRead(): void {
    this.items.update((items) => items.map((item) => ({ ...item, read: true })));
  }
  clear(): void {
    this.items.set([]);
  }
  toggle(kind: NoticeKind): void {
    this.preferences.update((value) => ({ ...value, [kind]: !value[kind] }));
    try {
      this.storage.setItem(
        'ionoscope.notification-preferences.v1',
        JSON.stringify(this.preferences()),
      );
    } catch {
      /* Session preference still applies. */
    }
  }
}
