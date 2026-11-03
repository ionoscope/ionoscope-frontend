import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon.component';
@Component({
  selector: 'app-not-found',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main id="main-content" class="ref-404">
    <section class="ref-404-card">
      <strong>404</strong>
      <h1>Такой страницы нет</h1>
      <p>Возможно, в адресе опечатка<br />или страница была удалена.</p>
      <label class="ref-grid-search"
        ><app-icon name="search" /><input
          #field
          type="search"
          placeholder="Найти раздел"
          aria-label="Найти раздел"
          (input)="query.set(field.value)"
      /></label>
      <div class="ref-404-actions">
        @if (matches('главная прогноз чат')) {
          <a routerLink="/chat" class="primary-button">На главную</a>
        }
        @if (matches('настройка станции выбор параметры')) {
          <a routerLink="/welcome" [queryParams]="{ edit: 'true' }" class="secondary-button"
            >К выбору станций</a
          >
        }
      </div>
      @if (!matches('главная прогноз чат настройка станции выбор параметры')) {
        <p>Такого раздела нет. <a routerLink="/chat">Вернуться на главную</a></p>
      }
    </section>
  </main>`,
})
export class NotFoundComponent {
  readonly query = signal('');
  matches(value: string): boolean {
    return value.includes(this.query().trim().toLocaleLowerCase('ru'));
  }
}
