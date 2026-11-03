import { A11yModule } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { IconComponent } from './icon.component';
import { monthGrid, shiftDay } from './calendar';
let nextCalendar = 0;
@Component({
  selector: 'app-date-picker',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, A11yModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button
      #trigger
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      type="button"
      class="ref-date-field"
      aria-haspopup="dialog"
      [attr.aria-expanded]="open()"
      [attr.aria-label]="label() + ': ' + display()"
      (click)="toggle()"
    >
      <app-icon name="calendar" /><span [class.muted]="!value()">{{ display() }}</span></button
    ><ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      (backdropClick)="close()"
      (overlayKeydown)="$event.key === 'Escape' && close()"
      ><section
        class="ref-calendar"
        role="dialog"
        [attr.aria-label]="label()"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
      >
        <div class="calendar-heading">
          <button
            type="button"
            class="icon-button"
            aria-label="Предыдущий месяц"
            (click)="moveMonth(-1)"
          >
            <app-icon name="prev" /></button
          ><strong aria-live="polite">{{ monthLabel() }}</strong
          ><button
            type="button"
            class="icon-button"
            aria-label="Следующий месяц"
            (click)="moveMonth(1)"
          >
            <app-icon name="next" />
          </button>
        </div>
        <div class="calendar-week">
          @for (day of weekdays; track day) {
            <span>{{ day }}</span>
          }
        </div>
        <div class="calendar-grid">
          @for (day of days(); track day.iso) {
            <button
              type="button"
              [id]="id + day.iso"
              [disabled]="disabled(day.iso)"
              [class.outside]="!day.current"
              [class.today]="day.iso === today"
              [class.selected]="day.iso === value()"
              [attr.aria-label]="day.iso"
              [attr.aria-pressed]="day.iso === value()"
              (click)="choose(day.iso)"
              (keydown)="key($event, day.iso)"
            >
              {{ day.day }}
            </button>
          }
        </div>
        <div class="calendar-footer">
          <button
            type="button"
            class="text-button"
            [disabled]="disabled(today)"
            (click)="choose(today)"
          >
            Сегодня</button
          ><button type="button" class="text-button" (click)="close()">Закрыть</button>
        </div>
      </section></ng-template
    >`,
})
export class DatePickerComponent {
  readonly value = input('');
  readonly label = input('Выберите дату');
  readonly min = input('');
  readonly max = input('');
  readonly valueChange = output<string>();
  readonly id = `calendar-${nextCalendar++}-`;
  readonly today = new Date().toISOString().slice(0, 10);
  readonly open = signal(false);
  readonly month = signal(new Date().getUTCMonth());
  readonly year = signal(new Date().getUTCFullYear());
  readonly weekdays = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  readonly days = computed(() => monthGrid(this.year(), this.month()));
  readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(Date.UTC(this.year(), this.month(), 1)))
      .replace(' г.', ''),
  );
  readonly display = computed(() =>
    this.value()
      ? new Intl.DateTimeFormat('ru-RU', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(new Date(this.value() + 'T00:00:00Z'))
      : 'Выберите дату',
  );
  disabled(iso: string): boolean {
    return (!!this.min() && iso < this.min()) || (!!this.max() && iso > this.max());
  }
  toggle(): void {
    if (this.open()) this.close();
    else {
      const date = new Date((this.value() || this.today) + 'T00:00:00Z');
      this.year.set(date.getUTCFullYear());
      this.month.set(date.getUTCMonth());
      this.open.set(true);
    }
  }
  close(): void {
    this.open.set(false);
    this.trigger()?.nativeElement.focus();
  }
  choose(iso: string): void {
    if (this.disabled(iso)) return;
    this.valueChange.emit(iso);
    this.close();
  }
  moveMonth(delta: number): void {
    const date = new Date(Date.UTC(this.year(), this.month() + delta, 1));
    this.year.set(date.getUTCFullYear());
    this.month.set(date.getUTCMonth());
  }
  key(event: KeyboardEvent, iso: string): void {
    const shift: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const days = shift[event.key];
    if (days === undefined) return;
    event.preventDefault();
    const next = shiftDay(iso, days);
    if (this.disabled(next)) return;
    const date = new Date(next + 'T00:00:00Z');
    this.year.set(date.getUTCFullYear());
    this.month.set(date.getUTCMonth());
    setTimeout(() => document.getElementById(this.id + next)?.focus(), 0);
  }
}
