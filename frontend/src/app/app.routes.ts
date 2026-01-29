import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./modules/login/components/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'clientes',
    loadComponent: () => import('./modules/clientes/components/clientes.component').then(m => m.ClientesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'ordenes', // ✅ ANTES del **
    loadComponent: () => import('./modules/orden-compra/components/orden-compra.component').then(m => m.OrdenCompraComponent),
    canActivate: [authGuard] // ✅ Con guard
  },
  {
    path: '**', // ✅ SIEMPRE AL FINAL
    redirectTo: '/clientes'
  }
];