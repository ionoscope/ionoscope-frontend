import { ContentNavComponent } from '../../shared/ui/content-nav.component';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { HistoryEntry } from '../../state/history.store';
import { roleLabel } from '../../core/config/roles';
import { ForecastCardComponent } from './forecast-card.component';
import { IconComponent } from '../../shared/ui/icon.component';
@Component({
  selector: 'app-feed',
  imports: [ForecastCardComponent, IconComponent, ContentNavComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="feed" aria-label="Результаты запроса">
    <div class="user-message">
      <span
        >Прогноз {{ entry().selection.parameter }} ·
        {{ entry().selection.stations.join(', ') }}</span
      ><small>{{ roleLabel(entry().selection.role) }}</small>
    </div>
    <div class="assistant-label">
      <span class="brand-mark small-mark"><app-icon name="wave" /></span><strong>IonoScope</strong>
    </div>
    <app-content-nav [sections]="sections()" />
    @for (card of entry().cards; track card.station) {
      <app-forecast-card
        [id]="'forecast-' + card.station"
        [card]="card"
        [historical]="historical()"
        [busy]="busy()"
        (refresh)="refresh.emit(card.station)"
        (explanationSaved)="explanationSaved.emit({ station: card.station, text: $event })"
      />
    }
  </section>`,
})
export class FeedComponent {
  readonly entry = input.required<HistoryEntry>();
  readonly sections = computed(() =>
    this.entry().cards.map((card) => ({
      id: 'forecast-' + card.station,
      label: card.station + ' · ' + this.entry().selection.parameter,
    })),
  );
  readonly historical = input(false);
  readonly busy = input(false);
  readonly refresh = output<string>();
  readonly explanationSaved = output<{ station: string; text: string }>();
  readonly roleLabel = roleLabel;
}
