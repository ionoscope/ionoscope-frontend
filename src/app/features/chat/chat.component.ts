import { NotificationStore } from '../../state/notification.store';
import { PreferencesDialogComponent } from '../../shared/ui/preferences-dialog.component';
import { ScrollToolsComponent } from '../../shared/ui/scroll-tools.component';
import { ArchiveDialogComponent } from './archive-dialog.component';
import { A11yModule } from '@angular/cdk/a11y';
import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Selection } from '../../core/api/api.models';
import { environment } from '../../../environments/environment';
import { ChatStore } from '../../state/chat.store';
import { SelectionStore } from '../../state/selection.store';
import { HeaderComponent } from './header.component';
import { SidebarComponent } from './sidebar.component';
import { ComposerPanelComponent } from './composer-panel.component';
import { FeedComponent } from './feed.component';
import { SelectionDialogComponent } from './selection-dialog.component';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog.component';
import { IconComponent } from '../../shared/ui/icon.component';

@Component({
  selector: 'app-chat',
  imports: [
    A11yModule,
    ScrollToolsComponent,
    HeaderComponent,
    SidebarComponent,
    ComposerPanelComponent,
    FeedComponent,
    IconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat.component.html',
  host: { '(document:keydown.escape)': 'closeMobile()' },
})
export class ChatComponent {
  private readonly notifications = inject(NotificationStore);
  readonly selection = inject(SelectionStore);
  readonly chat = inject(ChatStore);
  readonly history = this.chat.history;
  readonly mock = environment.useMocks;
  private readonly dialog = inject(Dialog);
  private readonly destroy = inject(DestroyRef);
  private readonly media = matchMedia('(max-width: 900px)');
  readonly mobile = signal(this.media.matches);
  readonly sidebarOpen = signal(!this.media.matches);
  private readonly listener = (event: MediaQueryListEvent) => {
    this.mobile.set(event.matches);
    this.sidebarOpen.set(!event.matches);
  };
  private readonly initialize = (() => {
    this.media.addEventListener('change', this.listener);
    this.destroy.onDestroy(() => this.media.removeEventListener('change', this.listener));
  })();
  toggleSidebar(): void {
    this.sidebarOpen.update((value) => !value);
  }
  closeMobile(): void {
    if (this.mobile()) this.sidebarOpen.set(false);
  }
  async edit(step?: number): Promise<void> {
    const selection = this.selection.value();
    if (!selection) return;
    const ref = this.dialog.open<Selection>(SelectionDialogComponent, {
      data: { selection, step: step ?? 0, singleField: step !== undefined },
      maxWidth: '850px',
      width: '95vw',
      maxHeight: '94dvh',
      ariaLabel:
        step === undefined
          ? 'Настройки прогноза'
          : ['Изменить роль', 'Изменить станции', 'Изменить параметр'][step],
      panelClass: 'selection-dialog-panel',
    });
    const result = await firstValueFrom(ref.closed);
    if (result) this.selection.save(result);
  }
  settings(): void {
    this.dialog.open(PreferencesDialogComponent, {
      width: '620px',
      maxWidth: '94vw',
      maxHeight: '92dvh',
      ariaLabel: 'Настройки оформления и уведомлений',
    });
  }
  openArchive(): void {
    const selection = this.selection.value();
    if (!selection) return;
    this.dialog.open(ArchiveDialogComponent, {
      data: selection,
      width: '1160px',
      maxWidth: '96vw',
      maxHeight: '94dvh',
      ariaLabel: 'Архив прогнозов',
      panelClass: 'archive-dialog-panel',
    });
    this.closeMobile();
  }
  async clear(): Promise<void> {
    const ref = this.dialog.open<boolean>(ConfirmDialogComponent, {
      width: '420px',
      maxWidth: '92vw',
      ariaLabel: 'Подтверждение очистки истории',
    });
    if (await firstValueFrom(ref.closed)) this.history.clear();
  }
  async request(): Promise<void> {
    const selection = this.selection.value();
    if (selection && !this.chat.busy()) {
      await this.chat.request(selection);
      const entry = this.history.active();
      if (entry) {
        const failed = entry.cards.filter((card) => card.status === 'error').length;
        this.notifications.push(
          failed ? 'error' : 'forecast',
          failed ? 'Часть прогнозов недоступна' : 'Прогноз готов',
          `${entry.cards.length - failed} из ${entry.cards.length} станций`,
        );
      }
    }
  }
  refresh(station: string): void {
    const entry = this.history.active();
    if (entry) void this.chat.refresh(entry, station);
  }
  saveExplanation(value: { station: string; text: string }): void {
    const entry = this.history.active();
    if (entry && entry.cards.find((c) => c.station === value.station)?.explanation !== value.text)
      this.history.update(entry.id, value.station, { explanation: value.text });
  }
}
