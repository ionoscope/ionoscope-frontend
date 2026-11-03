import { ThemeToggleComponent } from '../../shared/ui/theme-toggle.component';
import { PreferencesDialogComponent } from '../../shared/ui/preferences-dialog.component';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Selection } from '../../core/api/api.models';
import { SelectionStore } from '../../state/selection.store';
import { ThemeStore } from '../../state/theme.store';
import { SelectionWizardComponent } from './selection-wizard.component';
import { IconComponent } from '../../shared/ui/icon.component';
import { environment } from '../../../environments/environment';
import { Dialog } from '@angular/cdk/dialog';
import { CatalogStore } from '../../state/catalog.store';
@Component({
  selector: 'app-onboarding',
  imports: [SelectionWizardComponent, IconComponent, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="onboarding" id="main-content">
    <header class="onboarding-header">
      <a class="brand" href="/" aria-label="IonoScope — главная"
        ><span class="brand-mark"><app-icon name="wave" /></span>IonoScope<span class="brand-tag"
          >ИОНОСФЕРА · ПРОГНОЗ</span
        ></a
      >
      <div class="onboarding-actions">
        <button class="text-button" (click)="openArchive()">
          <app-icon name="clock" />Архив прогнозов</button
        ><button class="icon-button" aria-label="Настройки оформления" (click)="settings()">
          <app-icon name="settings" /></button
        ><app-theme-toggle />
      </div>
    </header>
    <app-selection-wizard
      [initial]="selection.value()"
      [startStep]="selection.value() ? 1 : 0"
      (complete)="start($event)"
    />
    <footer class="onboarding-bottom">
      <span>Понимать выше. Действовать точнее.</span>
      @if (mock) {
        <span class="badge">Демонстрационные данные</span>
      }
      <span>01 / IonoScope</span>
    </footer>
  </main>`,
})
export class OnboardingComponent {
  readonly theme = inject(ThemeStore);
  readonly mock = environment.useMocks;
  readonly selection = inject(SelectionStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);
  private readonly catalog = inject(CatalogStore);
  settings(): void {
    this.dialog.open(PreferencesDialogComponent, {
      width: '620px',
      maxWidth: '94vw',
      maxHeight: '92dvh',
      ariaLabel: 'Настройки оформления и уведомлений',
    });
  }
  async openArchive(): Promise<void> {
    const { ArchiveDialogComponent } = await import('../chat/archive-dialog.component');
    const selection =
      this.selection.value() ??
      ({
        role: 'geodesist',
        stations: this.catalog
          .stations()
          .filter((station) => station.active)
          .slice(0, 1)
          .map((station) => station.code),
        parameter: 'foF2',
      } satisfies Selection);
    this.dialog.open(ArchiveDialogComponent, {
      data: selection,
      width: '1160px',
      maxWidth: '96vw',
      maxHeight: '94dvh',
      ariaLabel: 'Архив прогнозов',
      panelClass: 'archive-dialog-panel',
    });
  }
  start(selection: Selection): void {
    this.selection.save(selection);
    void this.router.navigateByUrl('/chat');
  }
}
