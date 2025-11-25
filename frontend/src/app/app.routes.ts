import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/clientes',
    pathMatch: 'full'
  },
  {
    path: 'clientes',
    loadComponent: () => import('./modules/clientes/components/clientes.component').then(m => m.ClientesComponent)
  }
];