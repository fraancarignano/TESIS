import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
//import { noAuthGuard } from './core/guards/no-auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login', // ✅ Redirigir a clientes por defecto
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./modules/login/components/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'clientes',
    loadComponent: () => import('./modules/clientes/components/clientes.component').then(m => m.ClientesComponent),
    canActivate: [authGuard] // ✅ Protege la ruta
  },
  {
    path: 'proyectos',
    loadComponent: () => import('./modules/proyectos/components/proyectos.component').then(m => m.ProyectosComponent),
    canActivate: [authGuard] // ✅ Protege la ruta
  },
  {
    path: '**',
    redirectTo: '/clientes' // ✅ Rutas no encontradas van a clientes (el guard redirigirá al login si no está autenticado)
  }
];