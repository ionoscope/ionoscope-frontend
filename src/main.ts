import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import ru from '@angular/common/locales/ru';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';
import { mockApiInterceptor } from './app/mocks/mock-api.interceptor';
registerLocaleData(ru);
void bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([errorInterceptor, mockApiInterceptor])),
    { provide: LOCALE_ID, useValue: 'ru' },
  ],
}).catch((error: unknown) => console.error('Не удалось запустить IonoScope', error));
