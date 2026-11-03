import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ForecastResponse } from '../../core/api/api.models';
import { DataGridComponent } from './data-grid.component';
@Component({
  selector: 'app-data-table',
  imports: [DataGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="section-heading">
      <h3>
        Данные прогноза <span class="muted">{{ forecast().table.rows.length }}</span>
      </h3>
    </div>
    <app-data-grid
      [table]="forecast().table"
      [caption]="'Наблюдения и прогноз ' + forecast().station"
      [filename]="
        'ionoscope_' +
        forecast().station +
        '_' +
        forecast().generated_at.replaceAll(':', '-') +
        '.csv'
      "
    />`,
})
export class DataTableComponent {
  readonly forecast = input.required<ForecastResponse>();
}
