import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
@Component({
  selector: 'app-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="ref-progress-label">
      <span>{{ label() }}</span>
      @if (value() !== null) {
        <span>{{ percent() }}%</span>
      }
    </div>
    <div
      class="ref-progress"
      role="progressbar"
      [attr.aria-label]="label()"
      [attr.aria-valuemin]="0"
      [attr.aria-valuemax]="100"
      [attr.aria-valuenow]="value() === null ? null : percent()"
      [class.indeterminate]="value() === null"
    >
      <span [style.width.%]="value() === null ? 35 : percent()"></span>
    </div>`,
})
export class ProgressComponent {
  readonly value = input<number | null>(null);
  readonly label = input('Загрузка');
  readonly percent = computed(() => Math.round(Math.max(0, Math.min(100, this.value() ?? 0))));
}
