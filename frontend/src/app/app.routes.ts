import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { PrivateLayoutComponent } from './layouts/private-layout/private-layout.component';

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
    path: '',
    component: PrivateLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'clientes',
        loadComponent: () => import('./modules/clientes/components/clientes.component').then(m => m.ClientesComponent)
      },
      {
        path: 'proyectos',
        loadComponent: () => import('./modules/proyectos/components/proyectos.component').then(m => m.ProyectosComponent)
      },
      {
        path: 'proyectos/crear',
        loadComponent: () => import('./modules/proyectos/components/nuevo-proyecto-modal/proyecto-form.component').then(m => m.ProyectoFormNuevoComponent)
      },
      {
        path: 'proyectos/lista',
        loadComponent: () => import('./modules/proyectos/components/proyecto-lista/proyecto-list.component').then(m => m.ProyectoListComponent)
      },
      {
        path: 'inventario',
        loadComponent: () => import('./modules/inventario/components/inventario.component').then(m => m.InventarioComponent)
      },
      {
        path: 'inventario/transferir',
        loadComponent: () => import('./modules/inventario/components/ubicacion-transfer/ubicacion-transfer.component').then(m => m.UbicacionTransferComponent)
      },
      {
        path: 'inventario/movimientos',
        loadComponent: () => import('./modules/movimientos/components/movimientos.component').then(m => m.MovimientosComponent)
      },
      {
        path: 'inventario/catalogo',
        loadComponent: () => import('./modules/inventario/components/insumo-catalog/insumo-catalog.component').then(m => m.InsumoCatalogComponent)
      },
      {
        path: 'ubicaciones',
        loadComponent: () => import('./modules/ubicaciones/components/ubicaciones.component').then(m => m.UbicacionesComponent)
      },
      {
        path: 'reportes/inventario',
        loadComponent: () => import('./modules/reportes/Inventario/reporte-inventario-critico.component')
      },
      {
        path: 'reportes/proyectos',
        loadComponent: () => import('./modules/reportes/Proyectos/reporte-proyectos.component').then(m => m.ReporteProyectosComponent)
      },
      {
        path: 'ordenes',
        loadComponent: () => import('./modules/orden-compra/components/orden-compra.component').then(m => m.OrdenCompraComponent)
      },
      {
        path: 'usuarios',
        redirectTo: '/usuarios/proveedores',
        pathMatch: 'full'
      },
      {
        path: 'usuarios/proveedores',
        loadComponent: () => import('./modules/proveedores/components/proveedores.component').then(m => m.ProveedoresComponent)
      },
      {
        path: 'usuarios/talleres',
        loadComponent: () => import('./modules/talleres/components/talleres.component').then(m => m.TalleresComponent)
      },
      {
        path: '**',
        redirectTo: '/proyectos'
      }
    ]
  }
];
