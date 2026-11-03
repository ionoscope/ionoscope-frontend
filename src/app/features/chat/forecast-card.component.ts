import { ErrorStateComponent } from '../../shared/ui/error-state.component';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { roleLabel } from '../../core/config/roles';
import {
  ExplainHandle,
  ExplainState,
  ExplainStreamService,
} from '../../core/sse/explain-stream.service';
import { ForecastCard } from '../../state/history.store';
import { ChartCardComponent } from '../../shared/plotly-chart/chart-card.component';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { IconComponent } from '../../shared/ui/icon.component';
@Component({
  selector: 'app-forecast-card',
  imports: [
    ErrorStateComponent,
    DatePipe,
    DecimalPipe,
    ChartCardComponent,
    DataTableComponent,
    IconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forecast-card.component.html',
})
export class ForecastCardComponent {
  readonly card = input.required<ForecastCard>();
  readonly historical = input(false);
  readonly busy = input(false);
  readonly refresh = output<void>();
  readonly explanationSaved = output<string>();
  readonly roleLabel = roleLabel;
  readonly explanationsEnabled = inject(ExplainStreamService).enabled;
  readonly now = signal(Date.now());
  private readonly service = inject(ExplainStreamService);
  private readonly destroy = inject(DestroyRef);
  readonly forecast = computed(() => this.card().forecast);
  readonly expired = computed(() => {
    const f = this.forecast();
    return (
      f !== null &&
      (f.freshness_status === 'expired' ||
        f.valid_until === null ||
        Date.parse(f.valid_until) <= this.now())
    );
  });
  readonly stale = computed(() => {
    const f = this.forecast();
    return (
      !this.expired() &&
      f !== null &&
      (f.freshness_status === 'stale' ||
        (f.stale_after !== null && Date.parse(f.stale_after) <= this.now()))
    );
  });
  private readonly handle = signal<ExplainHandle | null>(null);
  readonly explanation = computed<ExplainState>(() =>
    !this.explanationsEnabled
      ? { status: 'idle', text: '', error: null }
      : (this.handle()?.state() ?? {
          status: this.card().explanation ? 'done' : 'idle',
          text: this.card().explanation,
          error: null,
        }),
  );
  private readonly clock = setInterval(() => this.now.set(Date.now()), 1000);
  private readonly cleanup = this.destroy.onDestroy(() => {
    clearInterval(this.clock);
    this.handle()?.cancel();
  });
  private readonly autoExplain = effect((onCleanup) => {
    const f = this.forecast();
    const historical = this.historical();
    const expired = this.expired();
    untracked(() => {
      this.handle()?.cancel();
      this.handle.set(null);
    });
    if (
      this.explanationsEnabled &&
      f &&
      !historical &&
      !expired &&
      !untracked(() => this.card().explanation)
    ) {
      const handle = this.service.open(f.forecast_id, f.role);
      this.handle.set(handle);
      onCleanup(() => handle.cancel());
    }
  });
  private readonly persistence = effect(() => {
    const state = this.explanation();
    if (state.status === 'done' && state.text)
      untracked(() => this.explanationSaved.emit(state.text));
  });
  retryExplanation(): void {
    const f = this.forecast();
    if (!this.explanationsEnabled || !f || this.expired()) return;
    this.handle()?.cancel();
    this.handle.set(this.service.open(f.forecast_id, f.role));
  }
  freshnessMessage(): string {
    const message = this.forecast()?.freshness_message;
    return message && /[а-яё]/iu.test(message)
      ? message
      : 'Наблюдения поступают с задержкой. Учитывайте свежесть данных.';
  }
  localTime(value: string | null): string {
    return value ? new Date(value).toLocaleString('ru-RU') + ' · местное время' : '';
  }
}
