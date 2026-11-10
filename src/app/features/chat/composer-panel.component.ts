import { ProgressComponent } from '../../shared/ui/progress.component';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Selection } from '../../core/api/api.models';
import { roleLabel } from '../../core/config/roles';
import { IconComponent } from '../../shared/ui/icon.component';
@Component({
  selector: 'app-composer-panel',
  imports: [IconComponent, ProgressComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="composer-wrap">
    <div class="composer-panel">
      <div class="composer-prompt">
        Прогноз {{ selection().parameter }} для {{ selection().stations.join(', ') }}
      </div>
      <div class="composer-toolbar">
        <button
          class="composer-settings"
          (click)="edit.emit(undefined)"
          aria-label="Изменить параметры прогноза"
        >
          <app-icon name="plus" />
        </button>
        <button class="composer-tool-chip" (click)="edit.emit(1)" aria-label="Изменить станции">
          <app-icon name="globe" />{{ selection().stations.length }}
          {{ selection().stations.length === 1 ? 'станция' : 'станции' }}
        </button>
        <span class="composer-role">{{ roleLabel(selection().role) }}</span>
        <span class="composer-horizon">15 мин</span>
        <button
          class="request-button"
          [disabled]="busy()"
          (click)="request.emit()"
          [attr.aria-label]="busy() ? 'Запрашиваем прогноз' : 'Запросить прогноз'"
          [title]="busy() ? 'Запрашиваем…' : 'Запросить прогноз'"
        >
          <app-icon [name]="busy() ? 'refresh' : 'arrow'" />
        </button>
      </div>
    </div>
    @if (busy()) {
      <app-progress label="Загружаем прогнозы…" [value]="progress()" />
    }
    <p class="composer-note">
      IonoScope может ошибаться. Важные данные стоит проверять. Время — UTC.
    </p>
  </div>`,
})
export class ComposerPanelComponent {
  readonly selection = input.required<Selection>();
  readonly progress = input<number | null>(null);
  readonly busy = input(false);
  readonly request = output<void>();
  readonly edit = output<number | undefined>();
  readonly roleLabel = roleLabel;
}
