import { AppearanceStore } from '../../state/appearance.store';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { Data, Layout, Config } from 'plotly.js';
import { ForecastResponse, ForecastArchive, ArchivedForecast } from '../../core/api/api.models';
import { comparisonTraces, observationEnd } from './comparison-series';
import { FONT_SANS } from '../../core/config/typography';
import { ThemeStore } from '../../state/theme.store';

type PlotlyModule = typeof import('plotly.js');
@Component({
  selector: 'app-plotly-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div
      #chart
      class="plotly-host"
      [class.fullscreen-chart]="fullscreen()"
      role="group"
      [attr.aria-label]="
        'График наблюдений и прогнозов станции ' +
        (forecast()?.station ?? comparison()?.station ?? '')
      "
    ></div>
    @if (error()) {
      <p class="error-text" role="alert">График не загрузился. Данные доступны в таблице ниже.</p>
    }`,
})
export class PlotlyChartComponent {
  readonly forecast = input<ForecastResponse | null>(null);
  readonly comparison = input<ForecastArchive | null>(null);
  readonly previousForecasts = input<ArchivedForecast[]>([]);
  readonly fullscreen = input(false);
  readonly error = signal(false);
  private readonly chart = viewChild<ElementRef<HTMLDivElement>>('chart');
  private readonly appearance = inject(AppearanceStore);
  private readonly theme = inject(ThemeStore);
  private readonly destroy = inject(DestroyRef);
  private plotly: PlotlyModule | undefined;
  private observer: ResizeObserver | undefined;
  private stopped = false;
  private rendering = false;
  private rerender = false;
  private readonly initialization = afterNextRender(() => {
    const host = this.chart()?.nativeElement;
    if (host) {
      this.observer = new ResizeObserver(() => {
        if (this.plotly && !this.stopped) void this.plotly.Plots.resize(host);
      });
      this.observer.observe(host);
    }
    this.destroy.onDestroy(() => {
      this.stopped = true;
      this.observer?.disconnect();
      if (host && this.plotly) this.plotly.purge(host);
    });
  });
  private readonly updates = effect(() => {
    this.forecast();
    this.comparison();
    this.previousForecasts();
    this.theme.theme();
    this.appearance.size();
    this.fullscreen();
    this.chart();
    void this.render();
  });
  private async render(): Promise<void> {
    if (this.rendering) {
      this.rerender = true;
      return;
    }
    const host = this.chart()?.nativeElement;
    if (!host || this.stopped) return;
    this.rendering = true;
    try {
      this.plotly ??= (await import('plotly.js-basic-dist-min')).default;
      if (this.stopped) return;
      const f = this.forecast();
      const comparison = this.comparison();
      if (!f && !comparison) return;
      const station = f?.station ?? comparison?.station ?? '';
      const parameter = f?.parameter ?? 'foF2';
      const unit = f?.unit ?? comparison?.unit ?? 'MHz';
      const identity = f?.forecast_id ?? `${station}_${comparison?.start}_${comparison?.end}`;
      const style = getComputedStyle(document.documentElement);
      const token = (name: string) => style.getPropertyValue(name).trim();
      let data: Data[];
      if (comparison) {
        data = comparisonTraces(comparison.items, {
          observed: token('--chart-observed'),
          forecast: token('--chart-forecast'),
        });
      } else if (f) {
        const observed = f.series.observed;
        const forecast = f.series.forecast;
        const last = [...observed].reverse().find((p) => p.value !== null);
        const hover = `%{x|%d.%m.%Y %H:%M} UTC<br>%{y:.3f} ${f.unit}<extra>%{fullData.name}</extra>`;
        data = [
          {
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Наблюдения',
            x: observed.map((p) => observationEnd(p, f.series.step_minutes)),
            y: observed.map((p) => p.value),
            connectgaps: false,
            line: { color: token('--chart-observed'), width: 2 },
            marker: { size: 4 },
            hovertemplate: hover,
          },
        ];
        for (const p of forecast) {
          if (p.lower !== null && p.upper !== null)
            data.push({
              type: 'scatter',
              x: [p.t_start, p.t_end, p.t_end, p.t_start],
              y: [p.lower, p.lower, p.upper, p.upper],
              fill: 'toself',
              fillcolor: token('--chart-band'),
              line: { width: 0 },
              name: 'Интервал',
              hoverinfo: 'skip',
              showlegend: false,
            });
        }
        if (last && forecast.length)
          data.push({
            type: 'scatter',
            mode: 'lines',
            x: [observationEnd(last, f.series.step_minutes), ...forecast.map((p) => p.t_end)],
            y: [last.value, ...forecast.map((p) => p.value)],
            line: { color: token('--chart-forecast'), dash: 'dot', width: 2 },
            showlegend: false,
            hoverinfo: 'skip',
          });
        data.push({
          type: 'scatter',
          mode: 'markers',
          name: 'Новый прогноз',
          x: forecast.map((p) => p.t_end),
          y: forecast.map((p) => p.value),
          marker: { color: token('--chart-forecast'), size: 11, symbol: 'diamond' },
          hovertemplate: hover,
        });
        data.push(
          ...comparisonTraces(
            this.previousForecasts(),
            { observed: token('--chart-observed'), forecast: token('--chart-forecast') },
            false,
          ),
        );
      } else return;
      const layout: Partial<Layout> = {
        autosize: true,
        paper_bgcolor: token('--surface'),
        plot_bgcolor: token('--surface'),
        font: {
          family: FONT_SANS,
          color: token('--text'),
          size: this.appearance.size() - 3,
        },
        margin: { l: 45, r: 22, t: 60, b: 55 },
        xaxis: {
          type: 'date',
          title: { text: 'Время, UTC', font: { size: this.appearance.size() - 4 } },
          tickformat: comparison ? '%d.%m %H:%M' : '%H:%M',
          gridcolor: token('--chart-grid'),
          zeroline: false,
          automargin: true,
        },
        yaxis: {
          title: { text: `${parameter}, ${unit}` },
          gridcolor: token('--chart-grid'),
          zeroline: false,
          automargin: true,
        },
        legend: { orientation: 'h', y: 1.05, x: 0, font: { size: this.appearance.size() - 4 } },
        hovermode: 'closest',
        dragmode: 'zoom',
        uirevision: identity,
        transition: { duration: 0, easing: 'linear' },
      };
      const config: Partial<Config> = {
        responsive: true,
        displaylogo: false,
        displayModeBar: true,
        modeBarButtons: [['toImage'], ['zoom2d', 'pan2d'], ['resetScale2d']],
        toImageButtonOptions: {
          format: 'png',
          filename: `ionoscope_${station}_${parameter}`,
          scale: 2,
        },
        locale: 'ru',
        locales: {
          ru: {
            dictionary: {
              'Download plot as a PNG': 'Скачать PNG',
              Zoom: 'Масштаб',
              Pan: 'Перемещение',
              'Zoom in': 'Приблизить',
              'Zoom out': 'Отдалить',
              Autoscale: 'Автомасштаб',
              'Reset axes': 'Сбросить масштаб',
              'Double-click to zoom back out': 'Двойной щелчок для сброса масштаба',
            },
            format: {
              days: [
                'Воскресенье',
                'Понедельник',
                'Вторник',
                'Среда',
                'Четверг',
                'Пятница',
                'Суббота',
              ],
              shortDays: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
              months: [
                'Январь',
                'Февраль',
                'Март',
                'Апрель',
                'Май',
                'Июнь',
                'Июль',
                'Август',
                'Сентябрь',
                'Октябрь',
                'Ноябрь',
                'Декабрь',
              ],
              shortMonths: [
                'янв',
                'фев',
                'мар',
                'апр',
                'май',
                'июн',
                'июл',
                'авг',
                'сен',
                'окт',
                'ноя',
                'дек',
              ],
              decimal: ',',
              thousands: ' ',
            },
          },
        },
      };
      await this.plotly.react(host, data, layout, config);
      this.error.set(false);
    } catch {
      if (!this.stopped) this.error.set(true);
    } finally {
      this.rendering = false;
      if (this.rerender && !this.stopped) {
        this.rerender = false;
        void this.render();
      }
    }
  }
  async download(): Promise<void> {
    const host = this.chart()?.nativeElement;
    if (host && this.plotly) {
      const station = this.forecast()?.station ?? this.comparison()?.station ?? 'archive';
      const parameter = this.forecast()?.parameter ?? 'foF2';
      try {
        await this.plotly.downloadImage(host, {
          format: 'png',
          filename: `ionoscope_${station}_${parameter}`,
          width: 1400,
          height: 600,
          scale: 2,
        });
      } catch {
        this.error.set(true);
      }
    }
  }
}
