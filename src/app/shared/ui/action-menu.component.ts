import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger, CdkContextMenuTrigger } from '@angular/cdk/menu';
import { IconComponent } from './icon.component';
export interface MenuAction {
  id: string;
  label: string;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
}
@Component({
  selector: 'app-action-menu',
  imports: [CdkMenu, CdkMenuItem, CdkMenuTrigger, CdkContextMenuTrigger, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="ref-menu-anchor" [cdkContextMenuTriggerFor]="context() ? menu : null">
      <ng-content />
      @if (showTrigger()) {
        <button
          class="icon-button"
          [attr.aria-label]="label()"
          [cdkMenuTriggerFor]="menu"
          (click)="$event.stopPropagation()"
        >
          <app-icon [name]="vertical() ? 'dots-vertical' : 'dots'" />
        </button>
      }
    </div>
    <ng-template #menu
      ><div cdkMenu class="ref-menu">
        @for (item of items(); track item.id) {
          <button
            cdkMenuItem
            [cdkMenuItemDisabled]="!!item.disabled"
            [class.danger]="item.danger"
            (cdkMenuItemTriggered)="selected.emit(item.id)"
          >
            @if (item.icon) {
              <app-icon [name]="item.icon || ''" />
            }
            <span>{{ item.label }}</span>
          </button>
        }
      </div></ng-template
    >`,
})
export class ActionMenuComponent {
  readonly items = input.required<MenuAction[]>();
  readonly label = input('Действия');
  readonly vertical = input(false);
  readonly context = input(false);
  readonly showTrigger = input(true);
  readonly selected = output<string>();
}
