import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AppError } from '../../core/api/api.models';
import { IconComponent } from './icon.component';
@Component({
  selector: 'app-error-state',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="ref-error-state" role="alert">
    <app-icon name="server" />
    <h3>Что-то пошло не так</h3>
    <p>{{ error().message }}</p>
    @if (error().retryable) {
      <button class="primary-button" [disabled]="busy()" (click)="retry.emit()">
        <app-icon name="refresh" /> Обновить
      </button>
    }
    <small>Код ошибки: {{ error().code }}</small>
  </section>`,
})
export class ErrorStateComponent {
  readonly error = input.required<AppError>();
  readonly busy = input(false);
  readonly retry = output<void>();
}
