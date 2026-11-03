import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { IconComponent } from './icon.component';
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
let nextSelect = 0;
@Component({
  selector: 'app-combobox',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="ref-combobox" cdkOverlayOrigin #origin="cdkOverlayOrigin">
      <input
        #field
        role="combobox"
        [attr.aria-label]="label()"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="id"
        aria-autocomplete="list"
        [attr.aria-activedescendant]="open() && filtered()[active()] ? id + '-' + active() : null"
        [value]="value()"
        (focus)="open.set(true)"
        (input)="change(field.value)"
        (keydown)="key($event)"
        [placeholder]="placeholder()"
      /><button
        type="button"
        class="icon-button"
        [attr.aria-label]="'Открыть список: ' + label()"
        (click)="open.set(!open()); field.focus()"
      >
        <app-icon name="chevron" />
      </button>
    </div>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayWidth]="origin.elementRef.nativeElement.offsetWidth"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      (backdropClick)="open.set(false)"
      (overlayKeydown)="$event.key === 'Escape' && open.set(false)"
      ><div class="ref-select-popup" role="listbox" [id]="id" [attr.aria-label]="label()">
        @for (option of filtered(); track option.value) {
          <button
            type="button"
            role="option"
            [id]="id + '-' + $index"
            [attr.aria-selected]="option.value === value()"
            [disabled]="option.disabled"
            [class.focused]="$index === active()"
            (click)="choose(option)"
          >
            <span>{{ option.label }}</span>
            @if (option.value === value()) {
              <app-icon name="check" />
            }
          </button>
        } @empty {
          <p class="muted small">Можно ввести код станции вручную.</p>
        }
      </div></ng-template
    >`,
})
export class ComboboxComponent {
  readonly value = input('');
  readonly options = input<SelectOption[]>([]);
  readonly label = input('Выберите значение');
  readonly placeholder = input('Поиск или код');
  readonly valueChange = output<string>();
  readonly open = signal(false);
  readonly active = signal(0);
  readonly id = `select-${nextSelect++}`;
  readonly filtered = computed(() => {
    const query = this.value().toLocaleLowerCase('ru');
    const exact = this.options().some((option) => option.value === this.value());
    return this.options().filter(
      (option) =>
        exact || `${option.label} ${option.value}`.toLocaleLowerCase('ru').includes(query),
    );
  });
  change(value: string): void {
    this.valueChange.emit(value);
    this.active.set(0);
    this.open.set(true);
  }
  choose(option: SelectOption): void {
    if (option.disabled) return;
    this.valueChange.emit(option.value);
    this.open.set(false);
  }
  key(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.open.set(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.open.set(true);
      const length = this.filtered().length;
      this.active.set(
        length ? (this.active() + (event.key === 'ArrowDown' ? 1 : -1) + length) % length : 0,
      );
    }
    if (event.key === 'Enter' && this.open()) {
      const option = this.filtered()[this.active()];
      if (option) {
        event.preventDefault();
        this.choose(option);
      }
    }
  }
}
