import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeStore } from '../../state/theme.store';
import { IconComponent } from './icon.component';
@Component({
  selector: 'app-theme-toggle',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button
    class="ref-theme-switch"
    role="switch"
    [attr.aria-checked]="theme.theme() === 'dark'"
    [attr.aria-label]="theme.theme() === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'"
    (click)="theme.toggle()"
  >
    <span class="ref-switch-thumb"
      ><app-icon [name]="theme.theme() === 'dark' ? 'moon' : 'sun'"
    /></span>
  </button>`,
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeStore);
}
