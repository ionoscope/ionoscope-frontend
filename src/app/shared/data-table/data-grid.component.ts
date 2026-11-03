import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { ForecastTable } from '../../core/api/api.models';
import { downloadCsv } from '../csv/to-csv';
import { IconComponent } from '../ui/icon.component';
export function compareCells(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
  direction: number,
): number {
  if (a == null) return b == null ? 0 : 1;
  if (b == null) return -1;
  return (
    direction *
    (typeof a === 'number' && typeof b === 'number'
      ? a - b
      : String(a).localeCompare(String(b), 'ru', { numeric: true }))
  );
}
@Component({
  selector: 'app-data-grid',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="ref-grid-toolbar">
      <label class="ref-grid-search"
        ><app-icon name="search" /><input
          #search
          type="search"
          [attr.aria-label]="'Поиск: ' + caption()"
          placeholder="Поиск по таблице"
          [value]="query()"
          (input)="query.set(search.value); page.set(0)" /></label
      ><button class="text-button" (click)="download()">
        <app-icon name="download" />{{
          selected().size ? 'CSV · выбранные (' + selected().size + ')' : 'Скачать CSV'
        }}
      </button>
    </div>
    <div class="table-scroll" tabindex="0" role="region" [attr.aria-label]="caption()">
      <table>
        <caption class="sr-only">
          {{
            caption()
          }}
        </caption>
        <thead>
          <tr>
            <th scope="col">
              <input
                type="checkbox"
                aria-label="Выбрать все найденные строки"
                [checked]="allSelected()"
                [indeterminate]="someSelected()"
                (change)="toggleAll()"
              />
            </th>
            @for (column of table().columns; track column.key) {
              <th
                scope="col"
                [attr.aria-sort]="
                  sortKey() === column.key
                    ? direction() === 1
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                "
              >
                <button class="ref-grid-sort" (click)="sort(column.key)">
                  {{ column.label }}
                  @if (column.unit && !column.label.includes(column.unit)) {
                    , {{ column.unit }}
                  }
                  <app-icon name="sort" />
                </button>
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (item of visible(); track item.index) {
            <tr [class.forecast-row]="item.row['kind'] === 'forecast'">
              <td>
                <input
                  type="checkbox"
                  [attr.aria-label]="'Выбрать строку ' + (item.index + 1)"
                  [checked]="selected().has(item.index)"
                  (change)="toggle(item.index)"
                />
              </td>
              @for (column of table().columns; track column.key) {
                <td [class.numeric]="isNumber(item.row[column.key])">
                  @if (column.key === 'kind') {
                    <span
                      class="kind-chip"
                      [class.predicted]="item.row[column.key] === 'forecast'"
                      >{{ item.row[column.key] === 'forecast' ? 'прогноз' : 'наблюдение' }}</span
                    >
                  } @else {
                    {{ display(item.row[column.key]) }}
                  }
                </td>
              }
            </tr>
          } @empty {
            <tr>
              <td [attr.colspan]="table().columns.length + 1" class="empty-small">
                Ничего не найдено. Измените запрос.
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <div class="ref-grid-footer">
      <span
        >{{ filtered().length }} строк
        @if (selected().size) {
          · выбрано {{ selected().size }}
          <button class="text-button" (click)="selected.set(emptySelection)">Снять выбор</button>
        }</span
      ><button
        class="icon-button"
        aria-label="Предыдущая страница таблицы"
        [disabled]="page() === 0"
        (click)="page.set(page() - 1)"
      >
        <app-icon name="prev" /></button
      ><span>{{ page() + 1 }} / {{ pages() }}</span
      ><button
        class="icon-button"
        aria-label="Следующая страница таблицы"
        [disabled]="page() + 1 >= pages()"
        (click)="page.set(page() + 1)"
      >
        <app-icon name="next" />
      </button>
    </div>`,
})
export class DataGridComponent {
  readonly table = input.required<ForecastTable>();
  readonly caption = input('Данные прогноза');
  readonly filename = input('ionoscope.csv');
  readonly query = signal('');
  readonly sortKey = signal('');
  readonly direction = signal(1);
  readonly page = signal(0);
  readonly selected = signal<Set<number>>(new Set());
  readonly emptySelection = new Set<number>();
  readonly filtered = computed(() => {
    const query = this.query().trim().toLocaleLowerCase('ru');
    const values = this.table()
      .rows.map((row, index) => ({ row, index }))
      .filter(
        (item) =>
          !query ||
          Object.values(item.row).some((value) =>
            String(value ?? '')
              .toLocaleLowerCase('ru')
              .includes(query),
          ),
      );
    const key = this.sortKey();
    return key
      ? values.sort(
          (a, b) => compareCells(a.row[key], b.row[key], this.direction()) || a.index - b.index,
        )
      : values;
  });
  readonly pages = computed(() => Math.max(1, Math.ceil(this.filtered().length / 10)));
  readonly visible = computed(() => this.filtered().slice(this.page() * 10, this.page() * 10 + 10));
  readonly allSelected = computed(
    () =>
      this.filtered().length > 0 &&
      this.filtered().every((item) => this.selected().has(item.index)),
  );
  readonly someSelected = computed(
    () => !this.allSelected() && this.filtered().some((item) => this.selected().has(item.index)),
  );
  private readonly reset = effect(() => {
    this.table();
    this.selected.set(new Set());
    this.page.set(0);
  });
  sort(key: string): void {
    this.direction.set(this.sortKey() === key ? -this.direction() : 1);
    this.sortKey.set(key);
    this.page.set(0);
  }
  toggle(index: number): void {
    this.selected.update((value) => {
      const next = new Set(value);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }
  toggleAll(): void {
    const remove = this.allSelected();
    this.selected.update((value) => {
      const next = new Set(value);
      for (const item of this.filtered()) {
        if (remove) next.delete(item.index);
        else next.add(item.index);
      }
      return next;
    });
  }
  display(value: string | number | null | undefined): string {
    if (value == null) return '—';
    if (typeof value === 'number')
      return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 6 }).format(value);
    if (/^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)))
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      }).format(new Date(value));
    return value;
  }
  isNumber(value: unknown): boolean {
    return typeof value === 'number';
  }
  download(): void {
    const rows = this.selected().size
      ? this.table().rows.filter((_, index) => this.selected().has(index))
      : this.filtered().map((item) => item.row);
    downloadCsv({ ...this.table(), rows }, this.filename());
  }
}
