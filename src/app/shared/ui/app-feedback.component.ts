import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NotificationStore } from '../../state/notification.store';
import { IconComponent } from './icon.component';
@Component({
  selector: 'app-feedback',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (!online()) {
      <div class="ref-offline" role="status">
        <app-icon name="offline" /><span
          >Нет соединения с интернетом. Сохранённая история остаётся доступной.</span
        ><button class="secondary-button" (click)="reload()">Повторить</button>
      </div>
    }
    <div class="ref-toasts" aria-live="polite">
      @for (toast of store.toasts(); track toast.id) {
        <div class="ref-toast" [class.error]="toast.kind === 'error'">
          <app-icon [name]="toast.kind === 'error' ? 'error' : 'success'" /><span>{{
            toast.text
          }}</span>
          @if (toast.undo) {
            <button class="text-button" (click)="store.undo(toast)">Отменить</button>
          }
          <button
            class="icon-button"
            aria-label="Закрыть уведомление"
            (click)="store.dismiss(toast.id)"
          >
            <app-icon name="close" />
          </button>
        </div>
      }
    </div>`,
})
export class AppFeedbackComponent {
  readonly store = inject(NotificationStore);
  readonly online = signal(navigator.onLine);
  private readonly destroy = inject(DestroyRef);
  private readonly listener = () => {
    this.online.set(navigator.onLine);
    this.store.push(
      'system',
      navigator.onLine ? 'Соединение восстановлено' : 'Нет соединения',
      navigator.onLine ? 'Можно продолжить работу.' : 'Запросы к серверу могут быть недоступны.',
    );
  };
  private readonly initialization = (() => {
    window.addEventListener('online', this.listener);
    window.addEventListener('offline', this.listener);
    this.destroy.onDestroy(() => {
      window.removeEventListener('online', this.listener);
      window.removeEventListener('offline', this.listener);
    });
  })();
  reload(): void {
    location.reload();
  }
}
