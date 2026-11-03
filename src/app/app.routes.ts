import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { SelectionStore } from './state/selection.store';
const selected: CanActivateFn = () =>
  inject(SelectionStore).value() !== null || inject(Router).createUrlTree(['/welcome']);
const unselected: CanActivateFn = (route) =>
  route.queryParamMap.get('edit') === 'true' ||
  inject(SelectionStore).value() === null ||
  inject(Router).createUrlTree(['/chat']);
export const routes: Routes = [
  {
    path: 'welcome',
    canActivate: [unselected],
    loadComponent: () =>
      import('./features/onboarding/onboarding.component').then((m) => m.OnboardingComponent),
  },
  {
    path: 'chat',
    canActivate: [selected],
    loadComponent: () => import('./features/chat/chat.component').then((m) => m.ChatComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'chat' },
  {
    path: '**',
    loadComponent: () =>
      import('./features/chat/not-found.component').then((m) => m.NotFoundComponent),
  },
];
