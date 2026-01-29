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
    path: 'proyectos/crear',
    loadComponent: () => import('./modules/proyectos/components/nuevo-proyecto-modal/proyecto-form.component').then(m => m.ProyectoFormComponent),
    canActivate: [authGuard] 
  },
  {
  path: 'inventario',
  loadComponent: () => import('./modules/inventario/components/inventario.component').then(m => m.InventarioComponent),
  canActivate: [authGuard]
  },
  {
  path: 'reportes/inventario',
  loadComponent: () => import('./modules/reportes/Inventario/reporte-inventario-critico.component'),
  canActivate: [authGuard]
},
{
    path: 'ordenes',
    loadComponent: () => import('./modules/orden-compra/components/orden-compra.component').then(m => m.OrdenCompraComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/proyectos' 
  }

];