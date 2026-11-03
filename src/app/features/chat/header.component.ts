import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Selection } from '../../core/api/api.models';
import { roleLabel } from '../../core/config/roles';
import { environment } from '../../../environments/environment';
import { ThemeToggleComponent } from '../../shared/ui/theme-toggle.component';
import { NotificationCenterComponent } from '../../shared/ui/notification-center.component';
import { IconComponent } from '../../shared/ui/icon.component';
@Component({
  selector: 'app-chat-header',
  imports: [IconComponent, ThemeToggleComponent, NotificationCenterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<header class="chat-header">
    <div class="header-main-row">
      <button
        class="icon-button header-sidebar-toggle"
        [attr.aria-label]="sidebarOpen() ? 'Свернуть боковую панель' : 'Показать боковую панель'"
        [attr.aria-expanded]="sidebarOpen()"
        (click)="toggleSidebar.emit()"
      >
        <app-icon name="sidebar" />
      </button>
      <h1 class="header-title">Прогноз ионосферы</h1>
      @if (mock) {
        <span
          class="header-demo"
          title="Текущие прогнозы используют смоделированные данные. Архив содержит реальные расчёты."
          >Демо</span
        >
      }
      <div class="header-tools">
        <app-notification-center (settings)="settings.emit()" /><button
          class="icon-button"
          aria-label="Настройки оформления"
          (click)="settings.emit()"
        >
          <app-icon name="settings" /></button
        ><app-theme-toggle />
      </div>
    </div>
    <nav class="selection-chips" aria-label="Параметры прогноза">
      <button
        class="selection-chip role-chip"
        (click)="edit.emit(0)"
        [title]="roleLabel(selection().role)"
      >
        <span class="chip-label">Роль</span><strong>{{ roleLabel(selection().role) }}</strong
        ><app-icon name="chevron" />
      </button>
      <button
        class="selection-chip"
        (click)="edit.emit(1)"
        [title]="selection().stations.join(', ')"
      >
        <span class="chip-label">Станции</span><strong>{{ selection().stations.join(', ') }}</strong
        ><app-icon name="chevron" />
      </button>
      <button class="selection-chip" (click)="edit.emit(2)">
        <span class="chip-label">Параметр</span><strong>{{ selection().parameter }}</strong
        ><app-icon name="chevron" />
      </button>
    </nav>
  </header>`,
})
export class HeaderComponent {
  readonly selection = input.required<Selection>();
  readonly toggleSidebar = output<void>();
  readonly edit = output<number>();
  readonly settings = output<void>();
  readonly sidebarOpen = input(false);
  readonly mock = environment.useMocks;
  readonly roleLabel = roleLabel;
}
