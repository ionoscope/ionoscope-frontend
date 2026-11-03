import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Selection } from '../../core/api/api.models';
import { SelectionWizardComponent } from '../onboarding/selection-wizard.component';
import { IconComponent } from '../../shared/ui/icon.component';
@Component({
  selector: 'app-selection-dialog',
  imports: [SelectionWizardComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="selection-dialog">
    <div class="dialog-heading">
      <h2>
        {{
          data.singleField
            ? ['Изменить роль', 'Изменить станции', 'Изменить параметр'][data.step]
            : 'Настройки прогноза'
        }}
      </h2>
      <button class="icon-button" aria-label="Закрыть настройки" (click)="ref.close()">
        <app-icon name="close" />
      </button>
    </div>
    <app-selection-wizard
      [initial]="data.selection"
      [startStep]="data.step"
      [editing]="true"
      [singleField]="data.singleField"
      (complete)="ref.close($event)"
      (cancelled)="ref.close()"
    />
  </section>`,
})
export class SelectionDialogComponent {
  readonly data = inject<{ selection: Selection; step: number; singleField: boolean }>(DIALOG_DATA);
  readonly ref = inject<DialogRef<Selection>>(DialogRef);
}
