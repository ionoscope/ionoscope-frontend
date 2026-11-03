import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppearanceStore } from './state/appearance.store';
import { AppFeedbackComponent } from './shared/ui/app-feedback.component';
import { ThemeStore } from './state/theme.store';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppFeedbackComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template:
    '<a class="skip-link" href="#main-content">Перейти к содержимому</a><router-outlet/><app-feedback/>',
})
export class AppComponent {
  private readonly appearance = inject(AppearanceStore);
  private readonly theme = inject(ThemeStore);
}
