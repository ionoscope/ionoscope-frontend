import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ICONS, IconGeometry } from './icon-registry';
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    @for (path of geometry().paths; track $index) {
      <path [attr.d]="path" />
    }
    @for (circle of geometry().circles; track $index) {
      <circle [attr.cx]="circle['cx']" [attr.cy]="circle['cy']" [attr.r]="circle['r']" />
    }
    @for (rect of geometry().rects; track $index) {
      <rect
        [attr.x]="rect['x']"
        [attr.y]="rect['y']"
        [attr.width]="rect['width']"
        [attr.height]="rect['height']"
        [attr.rx]="rect['rx']"
      />
    }
    @for (line of geometry().lines; track $index) {
      <line
        [attr.x1]="line['x1']"
        [attr.y1]="line['y1']"
        [attr.x2]="line['x2']"
        [attr.y2]="line['y2']"
      />
    }
    @for (line of geometry().polylines; track $index) {
      <polyline [attr.points]="line['points']" />
    }
  </svg>`,
  styles:
    ':host{display:inline-flex;width:1.2em;height:1.2em;flex-shrink:0}svg{width:100%;height:100%}',
})
export class IconComponent {
  readonly name = input('wave');
  readonly geometry = computed<IconGeometry>(
    () => ICONS[this.name()] ?? { paths: [], circles: [], rects: [], lines: [], polylines: [] },
  );
}
