import { DataGridComponent } from '../../shared/data-table/data-grid.component';
import { ForecastTable } from '../../core/api/api.models';
import { DatePickerComponent } from '../../shared/ui/date-picker.component';
import { ComboboxComponent } from '../../shared/ui/combobox.component';
import { ProgressComponent } from '../../shared/ui/progress.component';
import { ErrorStateComponent } from '../../shared/ui/error-state.component';
import { NotificationStore } from '../../state/notification.store';
import { DecimalPipe } from '@angular/common';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { PlotlyChartComponent } from '../../shared/plotly-chart/plotly-chart.component';
import { ChartDialogComponent } from '../../shared/plotly-chart/chart-card.component';
import { comparisonMetrics } from '../../shared/plotly-chart/comparison-series';
import {
  AppError,
  ForecastArchive,
  Selection,
  VerificationStatus,
} from '../../core/api/api.models';
import { ArchiveService } from '../../core/api/archive.service';
import { appError } from '../../core/api/errors';
import { CatalogStore } from '../../state/catalog.store';
import { IconComponent } from '../../shared/ui/icon.component';

@Component({
  selector: 'app-archive-dialog',
  imports: [
    DataGridComponent,
    DecimalPipe,
    IconComponent,
    PlotlyChartComponent,
    DatePickerComponent,
    ComboboxComponent,
    ProgressComponent,
    ErrorStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './archive-dialog.component.html',
})
export class ArchiveDialogComponent {
  readonly ref = inject(DialogRef);
  private readonly selection = inject<Selection>(DIALOG_DATA);
  private readonly api = inject(ArchiveService);
  readonly catalog = inject(CatalogStore);
  private readonly notifications = inject(NotificationStore);
  readonly stationOptions = computed(() =>
    this.catalog
      .stations()
      .map((station) => ({ value: station.code, label: station.code + ' · ' + station.name })),
  );
  readonly station = signal(this.selection.stations[0] ?? '');
  readonly end = signal(new Date().toISOString().slice(0, 10));
  readonly start = signal(new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10));
  readonly result = signal<ForecastArchive | null>(null);
  readonly loading = signal(false);
  readonly error = signal<AppError | null>(null);
  readonly validationError = signal('');
  readonly graphMetrics = computed(() => comparisonMetrics(this.result()?.items ?? []));
  private readonly chart = viewChild(PlotlyChartComponent);
  private readonly dialog = inject(Dialog);
  private readonly initialization = this.load();
  async load(): Promise<void> {
    if (this.loading()) return;
    this.validationError.set('');
    const station = this.station().trim().toUpperCase();
    const start = `${this.start()}T00:00:00Z`;
    const end = `${this.end()}T23:59:59.999Z`;
    const span = Date.parse(end) - Date.parse(start);
    if (
      !/^[A-Z0-9_-]{1,32}$/.test(station) ||
      !Number.isFinite(span) ||
      span < 0 ||
      span > 31 * 86400000
    ) {
      this.validationError.set(
        'Укажите код станции и период до 31 дня. Даты фильтруются по времени расчёта в UTC.',
      );
      return;
    }
    this.station.set(station);
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);
    try {
      const result = await this.api.load(station, start, end);
      this.result.set(result);
      this.notifications.push(
        'archive',
        'Архив загружен',
        station + ': ' + result.total + ' прогнозов',
      );
    } catch (error: unknown) {
      this.error.set(appError(error));
      this.notifications.push('error', 'Архив недоступен', appError(error).message);
    } finally {
      this.loading.set(false);
    }
  }
  label(status: VerificationStatus): string {
    return {
      verified: 'Сопоставлен',
      pending: 'Ожидаем наблюдения',
      observation_missing: 'Нет наблюдения',
      observations_unavailable: 'Источник недоступен',
      unverifiable: 'Нельзя сопоставить',
    }[status];
  }
  downloadChart(): void {
    void this.chart()?.download();
  }
  expandChart(): void {
    const result = this.result();
    if (!result) return;
    this.dialog.open(ChartDialogComponent, {
      data: { forecast: null, comparison: result, previous: [] },
      width: '96vw',
      maxWidth: '1600px',
      height: '94dvh',
      ariaLabel: 'Полноэкранный график архива',
      panelClass: 'chart-dialog-panel',
    });
  }
  readonly archiveTable = computed<ForecastTable>(() => {
    const result = this.result();
    return {
      columns: [
        { key: 'generated_at', label: 'Расчёт (UTC)', unit: null },
        { key: 'interval_start', label: 'Начало интервала (UTC)', unit: null },
        { key: 'forecast_timestamp', label: 'Конец интервала (UTC)', unit: null },
        { key: 'prediction', label: 'Прогноз', unit: result?.unit ?? 'MHz' },
        { key: 'actual', label: 'Факт', unit: result?.unit ?? 'MHz' },
        { key: 'absolute_error', label: '|Ошибка|', unit: result?.unit ?? 'MHz' },
        { key: 'percentage_error', label: 'Ошибка', unit: '%' },
        { key: 'source', label: 'Источник', unit: null },
        { key: 'status', label: 'Статус', unit: null },
        { key: 'model', label: 'Модель', unit: null },
      ],
      rows:
        result?.items.map((item) => ({
          generated_at: item.generated_at,
          interval_start: item.forecast_interval_start,
          forecast_timestamp: item.forecast_timestamp,
          prediction: item.prediction,
          actual: item.actual,
          absolute_error: item.absolute_error,
          percentage_error: item.percentage_error,
          source: item.source === 'api' ? 'Прогноз сервиса' : 'Контрольный расчёт',
          status: this.label(item.verification_status),
          model: item.model + ' · ' + item.model_version,
        })) ?? [],
    };
  });
}
