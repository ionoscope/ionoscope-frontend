import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { ActionMenuComponent, MenuAction } from '../../shared/ui/action-menu.component';
import { RenameDialogComponent } from '../../shared/ui/rename-dialog.component';
import { NotificationStore } from '../../state/notification.store';
import { HistoryEntry } from '../../state/history.store';
import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { HistoryStore } from '../../state/history.store';
import { IconComponent } from '../../shared/ui/icon.component';
@Component({
  selector: 'app-sidebar',
  imports: [IconComponent, ActionMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="sidebar-top">
      <a class="brand" href="/chat">IonoScope</a
      ><button class="icon-button" aria-label="Свернуть панель" (click)="closePanel.emit()">
        <app-icon name="sidebar" />
      </button>
    </div>
    <button class="new-request" (click)="newRequest()"><app-icon name="plus" />Новый запрос</button>
    <button class="archive-nav" (click)="archiveRequested.emit()">
      <app-icon name="clock" />Архив прогнозов
    </button>
    <div class="sidebar-history-heading">
      <span>История запросов</span><span class="sidebar-count">{{ history.entries().length }}</span>
    </div>
    <nav class="history-list" aria-label="История запросов">
      @for (group of groups(); track group.label) {
        @if (group.entries.length) {
          <h2>{{ group.label }}</h2>
          @for (entry of group.entries; track entry.id) {
            <app-action-menu
              [items]="actions"
              [context]="true"
              [showTrigger]="false"
              (selected)="action($event, entry)"
              ><div class="history-item" [class.active]="history.activeId() === entry.id">
                <button class="history-open" (click)="open(entry.id)">
                  <span
                    ><strong>{{
                      entry.title ||
                        entry.selection.parameter + ' · ' + entry.selection.stations.join(', ')
                    }}</strong
                    ><small>{{ localDate(entry.createdAt) }}</small></span
                  ></button
                ><app-action-menu
                  [items]="actions"
                  [label]="'Действия: ' + (entry.title || entry.selection.stations.join(', '))"
                  (selected)="action($event, entry)"
                /></div
            ></app-action-menu>
          }
        }
      }
      @if (!history.entries().length) {
        <div class="history-empty">
          <app-icon name="wave" />
          <p>Ваша история<br />начинается здесь</p>
          <span>Запросы сохраняются<br />в этом браузере.</span>
        </div>
      }
    </nav>
    <div class="sidebar-bottom">
      <button
        class="text-button"
        [disabled]="!history.entries().length"
        (click)="clearRequested.emit()"
      >
        <app-icon name="trash" />Очистить историю
      </button>
      <button class="text-button" (click)="settingsRequested.emit()">
        <app-icon name="settings" />Настройки
      </button>
    </div>`,
})
export class SidebarComponent {
  private readonly dialog = inject(Dialog);
  private readonly notifications = inject(NotificationStore);
  readonly actions: MenuAction[] = [
    { id: 'rename', label: 'Переименовать', icon: 'edit' },
    { id: 'copy', label: 'Копировать', icon: 'copy' },
    { id: 'delete', label: 'Удалить', icon: 'trash', danger: true },
  ];
  async action(action: string, entry: HistoryEntry): Promise<void> {
    if (action === 'rename') {
      const ref = this.dialog.open<string>(RenameDialogComponent, {
        data:
          entry.title || entry.selection.parameter + ' · ' + entry.selection.stations.join(', '),
        width: '420px',
        maxWidth: '92vw',
        ariaLabel: 'Переименовать запрос',
      });
      const title = await firstValueFrom(ref.closed);
      if (title) this.history.rename(entry.id, title);
    } else if (action === 'delete') {
      const index = this.history.entries().findIndex((value) => value.id === entry.id);
      this.history.remove(entry.id);
      this.notifications.toast('Запрос удалён', () => this.history.restore(entry, index));
    } else if (action === 'copy') {
      try {
        await navigator.clipboard.writeText(JSON.stringify(entry, null, 2));
        this.notifications.toast('Запрос скопирован');
      } catch {
        this.notifications.toast('Не удалось скопировать запрос', undefined, 'error');
      }
    }
  }
  readonly history = inject(HistoryStore);
  readonly closePanel = output<void>();
  readonly navigated = output<void>();
  readonly clearRequested = output<void>();
  readonly archiveRequested = output<void>();
  readonly settingsRequested = output<void>();
  readonly groups = computed(() => {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    const yesterday = new Date(midnight);
    yesterday.setDate(yesterday.getDate() - 1);
    return [
      {
        label: 'Сегодня',
        entries: this.history.entries().filter((e) => Date.parse(e.createdAt) >= +midnight),
      },
      {
        label: 'Вчера',
        entries: this.history
          .entries()
          .filter(
            (e) => Date.parse(e.createdAt) >= +yesterday && Date.parse(e.createdAt) < +midnight,
          ),
      },
      {
        label: 'Ранее',
        entries: this.history.entries().filter((e) => Date.parse(e.createdAt) < +yesterday),
      },
    ];
  });
  localDate(value: string): string {
    return new Date(value).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  newRequest(): void {
    this.history.newRequest();
    this.navigated.emit();
  }
  open(id: string): void {
    this.history.open(id);
    this.navigated.emit();
  }
}
