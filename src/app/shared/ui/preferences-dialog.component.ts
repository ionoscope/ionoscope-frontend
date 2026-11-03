import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { AppearanceStore } from '../../state/appearance.store';
import { NoticeKind, NotificationStore } from '../../state/notification.store';
import { ThemeToggleComponent } from './theme-toggle.component';
import { IconComponent } from './icon.component';
@Component({
  selector: 'app-preferences-dialog',
  imports: [ThemeToggleComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="ref-preferences">
    <div class="dialog-heading">
      <h2>Настройки</h2>
      <button class="icon-button" aria-label="Закрыть настройки" (click)="ref.close()">
        <app-icon name="close" />
      </button>
    </div>
    <h3>Оформление</h3>
    <div class="preference-row">
      <div>
        <strong>Тёмная тема</strong>
        <p>Меняет оформление всего приложения</p>
      </div>
      <app-theme-toggle />
    </div>
    <fieldset class="preference-field">
      <legend>Размер текста</legend>
      <div class="ref-segments">
        @for (size of sizes; track size.value) {
          <button
            [class.selected]="appearance.size() === size.value"
            (click)="appearance.size.set(size.value)"
          >
            {{ size.label }}
          </button>
        }
      </div>
    </fieldset>
    <h3>Уведомления</h3>
    <p class="muted small">Настройки сохраняются в этом браузере.</p>
    <table class="notification-preferences">
      <thead>
        <tr>
          <th scope="col">Событие</th>
          <th scope="col">В приложении</th>
        </tr>
      </thead>
      <tbody>
        @for (item of events; track item.kind) {
          <tr>
            <th scope="row">{{ item.label }}</th>
            <td>
              <button
                role="switch"
                class="ref-switch"
                [attr.aria-checked]="notifications.preferences()[item.kind]"
                [attr.aria-label]="item.label + ': в приложении'"
                (click)="notifications.toggle(item.kind)"
              >
                <span></span>
              </button>
            </td>
          </tr>
        }
      </tbody>
    </table>
  </section>`,
})
export class PreferencesDialogComponent {
  readonly ref = inject(DialogRef);
  readonly appearance = inject(AppearanceStore);
  readonly notifications = inject(NotificationStore);
  readonly sizes = [
    { value: 14, label: 'Мелкий' },
    { value: 16, label: 'Обычный' },
    { value: 18, label: 'Крупный' },
  ];
  readonly events: { kind: NoticeKind; label: string }[] = [
    { kind: 'forecast', label: 'Прогноз готов' },
    { kind: 'archive', label: 'Архив загружен' },
    { kind: 'error', label: 'Ошибки запросов' },
    { kind: 'system', label: 'Системные события' },
  ];
}
