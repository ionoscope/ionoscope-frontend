import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="confirm-dialog">
    <h2>Очистить историю?</h2>
    <p class="muted">
      Все сохранённые запросы в этом браузере будут удалены. Настройки выбора останутся.
    </p>
    <div class="dialog-buttons">
      <button class="secondary-button" (click)="ref.close(false)">Отмена</button
      ><button class="primary-button danger-button" (click)="ref.close(true)">Очистить</button>
    </div>
  </section>`,
})
export class ConfirmDialogComponent {
  readonly ref = inject<DialogRef<boolean>>(DialogRef);
}
