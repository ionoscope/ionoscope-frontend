import { DatePipe } from '@angular/common';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { NotificationStore } from '../../state/notification.store';
import { IconComponent } from './icon.component';
@Component({
  selector: 'app-notification-center',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, DatePipe, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      class="icon-button notification-trigger"
      [attr.aria-label]="'Уведомления, непрочитанных: ' + store.unread()"
      aria-haspopup="dialog"
      [attr.aria-expanded]="open()"
      (click)="open() ? close() : open.set(true)"
    >
      <app-icon name="bell" />
      @if (store.unread()) {
        <span>{{ store.unread() }}</span>
      }</button
    ><ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      (backdropClick)="close()"
      (overlayKeydown)="$event.key === 'Escape' && close()"
      ><section class="ref-notifications" role="dialog" aria-label="Центр уведомлений">
        <div class="section-heading">
          <h3>Уведомления</h3>
          <button class="text-button" (click)="settings.emit(); close()">Настроить</button>
        </div>
        <div class="notification-items">
          @for (notice of store.items(); track notice.id) {
            <article [class.unread]="!notice.read">
              <span class="notification-dot" [class.error]="notice.kind === 'error'"></span>
              <div>
                <strong>{{ notice.title }}</strong>
                <p>{{ notice.message }}</p>
                <time>{{ notice.time | date: 'HH:mm' }}</time>
              </div>
            </article>
          } @empty {
            <p class="empty-small">
              Пока нет уведомлений.<br />Здесь появятся результаты запросов и сообщения системы.
            </p>
          }
        </div>
        <div class="notification-footer">
          <button class="text-button" (click)="store.markRead()">Прочитать все</button
          ><button class="text-button" (click)="store.clear()">Очистить</button>
        </div>
      </section></ng-template
    >`,
})
export class NotificationCenterComponent {
  readonly store = inject(NotificationStore);
  readonly open = signal(false);
  readonly settings = output<void>();
  close(): void {
    this.open.set(false);
    this.store.markRead();
  }
}
