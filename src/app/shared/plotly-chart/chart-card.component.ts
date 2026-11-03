import { ActionMenuComponent, MenuAction } from '../ui/action-menu.component';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { ForecastResponse, ForecastArchive, ArchivedForecast } from '../../core/api/api.models';
import { ArchiveService } from '../../core/api/archive.service';
import { comparisonMetrics, observationEnd } from './comparison-series';
import { environment } from '../../../environments/environment';
import { PlotlyChartComponent } from './plotly-chart.component';
import { IconComponent } from '../ui/icon.component';

@Component({
  selector: 'app-chart-dialog',
  imports: [PlotlyChartComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="chart-dialog">
    <div class="section-heading">
      <h2>{{ data.forecast?.station ?? data.comparison?.station }} · foF2</h2>
      <button class="icon-button" aria-label="Закрыть график" (click)="ref.close()">
        <app-icon name="close" />
      </button>
    </div>
    <app-plotly-chart
      [forecast]="data.forecast"
      [comparison]="data.comparison"
      [previousForecasts]="data.previous"
      [fullscreen]="true"
    />
  </section>`,
})
export class ChartDialogComponent {
  readonly data = inject<{
    forecast: ForecastResponse | null;
    comparison: ForecastArchive | null;
    previous: ArchivedForecast[];
  }>(DIALOG_DATA);
  readonly ref = inject(DialogRef);
}
@Component({
  selector: 'app-chart-card',
  imports: [PlotlyChartComponent, IconComponent, DecimalPipe, ActionMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="section-heading">
      <h3>Наблюдения и прогноз <span class="muted">24 часа · UTC</span></h3>
      <div class="chart-actions">
        <button
          class="icon-button"
          aria-label="Скачать график PNG"
          title="Скачать PNG"
          (click)="download()"
        >
          <app-icon name="download" /></button
        ><button
          class="icon-button"
          aria-label="Развернуть график"
          title="Развернуть"
          (click)="expand()"
        >
          <app-icon name="expand" />
        </button>
        <app-action-menu
          [items]="actions"
          [vertical]="true"
          label="Действия с графиком"
          (selected)="$event === 'png' ? download() : expand()"
        />
      </div>
    </div>
    <app-action-menu
      [items]="actions"
      [context]="true"
      [showTrigger]="false"
      (selected)="$event === 'png' ? download() : expand()"
      ><app-plotly-chart [forecast]="forecast()" [previousForecasts]="previous()"
    /></app-action-menu>
    <div class="chart-metrics" aria-label="Ошибки прошлых прогнозов в показанном периоде">
      <span
        >Старых прогнозов <strong>{{ metrics().count }}</strong></span
      ><span
        >С фактом <strong>{{ metrics().matched }}</strong></span
      ><span
        >MAE
        <strong>{{ metrics().mae === null ? '—' : (metrics().mae | number: '1.3-3') }}</strong>
        МГц</span
      ><span
        >RMSE
        <strong>{{ metrics().rmse === null ? '—' : (metrics().rmse | number: '1.3-3') }}</strong>
        МГц</span
      >
    </div>
    @if (note()) {
      <p class="chart-history-note">{{ note() }}</p>
    }
    <p class="chart-history-note">
      Синий — наблюдения, оранжевый пунктир — ранее рассчитанные прогнозы, ромб — новый прогноз.
      Точки совмещены по концу интервала.
    </p>`,
})
export class ChartCardComponent {
  readonly actions: MenuAction[] = [
    { id: 'png', label: 'Сохранить PNG', icon: 'download' },
    { id: 'expand', label: 'Развернуть график', icon: 'expand' },
  ];
  readonly forecast = input.required<ForecastResponse>();
  private readonly dialog = inject(Dialog);
  private readonly chart = viewChild(PlotlyChartComponent);
  private readonly archive = inject(ArchiveService);
  readonly previous = signal<ArchivedForecast[]>([]);
  readonly note = signal('');
  readonly metrics = computed(() => comparisonMetrics(this.previous()));
  private readonly loadingHistory = effect((onCleanup) => {
    const forecast = this.forecast();
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });
    this.previous.set([]);
    if (environment.useMocks) {
      this.note.set(
        'Текущий график демонстрационный. Реальные старые прогнозы и их ошибки доступны в «Архиве прогнозов».',
      );
      return;
    }
    const first = forecast.series.observed[0];
    if (!first || !forecast.forecast_timestamp) {
      this.note.set('Нет периода наблюдений для сравнения.');
      return;
    }
    const minTime = Date.parse(observationEnd(first, forecast.series.step_minutes));
    const maxTime = Date.parse(forecast.forecast_timestamp);
    const start = new Date(Date.parse(first.t) - 15 * 60_000).toISOString();
    this.note.set('Загружаем предыдущие прогнозы…');
    void this.archive
      .load(forecast.station, start, forecast.generated_at, 500)
      .then((archive) => {
        if (cancelled) return;
        const points = archive.items.filter(
          (item) =>
            item.forecast_id !== forecast.forecast_id &&
            item.parameter === forecast.parameter &&
            item.unit === forecast.unit &&
            item.forecast_timestamp !== null &&
            Date.parse(item.forecast_timestamp) >= minTime &&
            Date.parse(item.forecast_timestamp) <= maxTime &&
            Date.parse(item.generated_at) <= Date.parse(forecast.generated_at),
        );
        this.previous.set(points);
        this.note.set(
          !points.length
            ? 'В показанном периоде пока нет сохранённых старых прогнозов. Ошибку вычислить нельзя.'
            : archive.total > archive.items.length
              ? 'Показаны последние 500 расчётов этого периода.'
              : 'Метрики рассчитаны по точкам старых прогнозов с фактом в показанном периоде.',
        );
      })
      .catch(() => {
        if (!cancelled)
          this.note.set('Архив временно недоступен. Старые прогнозы и метрики не загружены.');
      });
  });
  download(): void {
    void this.chart()?.download();
  }
  expand(): void {
    this.dialog.open(ChartDialogComponent, {
      data: { forecast: this.forecast(), comparison: null, previous: this.previous() },
      width: '96vw',
      maxWidth: '1600px',
      height: '94dvh',
      ariaLabel: 'Полноэкранный график',
      panelClass: 'chart-dialog-panel',
    });
  }
}
