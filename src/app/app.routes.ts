import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/user-dashboard/user-dashboard.component').then(
        (m) => m.UserDashboardComponent
      ),
  },
];
