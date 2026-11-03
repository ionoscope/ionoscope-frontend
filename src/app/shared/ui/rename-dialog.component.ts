import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
@Component({
  selector: 'app-rename-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="confirm-dialog">
    <h2>Переименовать запрос</h2>
    <form (submit)="$event.preventDefault(); save()">
      <label class="ref-field-label"
        >Название<input
          #field
          [value]="name()"
          maxlength="100"
          (input)="name.set(field.value)"
          required
      /></label>
      <div class="dialog-buttons">
        <button type="button" class="secondary-button" (click)="ref.close()">Отмена</button
        ><button class="primary-button" [disabled]="!name().trim()" type="submit">Сохранить</button>
      </div>
    </form>
  </section>`,
})
export class RenameDialogComponent {
  readonly ref = inject<DialogRef<string>>(DialogRef);
  readonly name = signal(inject<string>(DIALOG_DATA));
  save(): void {
    if (this.name().trim()) this.ref.close(this.name().trim());
  }
}
