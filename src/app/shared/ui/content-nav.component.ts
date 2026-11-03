import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
export interface ContentSection {
  id: string;
  label: string;
}
@Component({
  selector: 'app-content-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<details class="ref-content-nav" open>
    <summary>Содержание</summary>
    <nav aria-label="Содержание прогноза">
      @for (section of sections(); track section.id) {
        <button
          [class.active]="active() === section.id"
          [attr.aria-current]="active() === section.id ? 'location' : null"
          (click)="go(section)"
        >
          {{ section.label }}
        </button>
      }
    </nav>
  </details>`,
})
export class ContentNavComponent {
  readonly sections = input<ContentSection[]>([]);
  readonly active = signal('');
  private readonly destroy = inject(DestroyRef);
  private root: HTMLElement | null = null;
  private readonly changes = effect(() => {
    this.sections();
    queueMicrotask(() => this.update());
  });
  private readonly initialization = afterNextRender(() => {
    this.root = document.querySelector<HTMLElement>('.chat-body');
    const update = () => this.update();
    this.root?.addEventListener('scroll', update, { passive: true });
    this.destroy.onDestroy(() => this.root?.removeEventListener('scroll', update));
    this.update();
  });
  private update(): void {
    const top = (this.root?.getBoundingClientRect().top ?? 0) + 100;
    let current = this.sections()[0]?.id ?? '';
    for (const section of this.sections()) {
      const element = document.getElementById(section.id);
      if (element && element.getBoundingClientRect().top <= top) current = section.id;
    }
    this.active.set(current);
  }
  go(section: ContentSection): void {
    const target = document.getElementById(section.id);
    const root = this.root;
    if (target && root)
      root.scrollTo({
        top:
          root.scrollTop +
          target.getBoundingClientRect().top -
          root.getBoundingClientRect().top -
          20,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    this.active.set(section.id);
  }
}
