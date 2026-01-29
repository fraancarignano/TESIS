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
    path: 'proyectos',
    loadComponent: () => import('./modules/proyectos/components/proyectos.component').then(m => m.ProyectosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'inventario',
    loadComponent: () => import('./modules/inventario/components/inventario.component').then(m => m.InventarioComponent),
    canActivate: [authGuard]
  },
  {
    path: 'ordenes',
    loadComponent: () => import('./modules/orden-compra/components/orden-compra.component').then(m => m.OrdenCompraComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/clientes'
  }
];