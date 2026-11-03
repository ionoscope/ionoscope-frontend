import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { IconComponent } from './icon.component';
@Component({
  selector: 'app-scroll-tools',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (visible()) {
    <button
      class="ref-back-top"
      [attr.aria-label]="'Наверх. Просмотрено ' + progress() + '%'"
      (click)="top()"
    >
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r="20" class="progress-track" />
        <circle
          cx="22"
          cy="22"
          r="20"
          [attr.stroke-dasharray]="126"
          [attr.stroke-dashoffset]="126 * (1 - progress() / 100)"
        /></svg
      ><app-icon name="arrow" />
    </button>
  }`,
})
export class ScrollToolsComponent {
  readonly progress = signal(0);
  readonly visible = signal(false);
  private root: HTMLElement | null = null;
  private readonly destroy = inject(DestroyRef);
  private readonly initialization = afterNextRender(() => {
    this.root = document.querySelector<HTMLElement>('.chat-body');
    const listener = () => this.update();
    this.root?.addEventListener('scroll', listener, { passive: true });
    this.destroy.onDestroy(() => this.root?.removeEventListener('scroll', listener));
  });
  private update(): void {
    const root = this.root;
    if (!root) return;
    const total = root.scrollHeight - root.clientHeight;
    this.visible.set(root.scrollTop > 180);
    this.progress.set(total > 0 ? Math.round((root.scrollTop / total) * 100) : 0);
  }
  top(): void {
    this.root?.scrollTo({
      top: 0,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }
}
