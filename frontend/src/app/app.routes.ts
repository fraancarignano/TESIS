import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./modules/login/components/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'clientes',
    loadComponent: () => import('./modules/clientes/components/clientes.component').then(m => m.ClientesComponent)
  }
];