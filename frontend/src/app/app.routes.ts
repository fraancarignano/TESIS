import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
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
    path: 'sin-acceso',
    loadComponent: () => import('./core/components/sin-acceso/sin-acceso.component')
  },
  {
    path: '',
    component: PrivateLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'clientes',
        canActivate: [permissionGuard],
        data: { permission: { modulo: 'Clientes', accion: 'Ver' } },
        loadComponent: () => import('./modules/clientes/components/clientes.component').then(m => m.ClientesComponent)
      },
      {
        path: 'proyectos',
        canActivate: [permissionGuard],
        data: { permission: { modulo: 'Proyectos', accion: 'Ver' } },
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
        canActivate: [permissionGuard],
        data: { permission: { modulo: 'Inventario', accion: 'Ver' } },
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
        canActivate: [permissionGuard],
        data: { permission: { modulo: 'Ubicaciones', accion: 'Ver' } },
        loadComponent: () => import('./modules/ubicaciones/components/ubicaciones.component').then(m => m.UbicacionesComponent)
      },
      {
        path: 'reportes/inventario',
        canActivate: [permissionGuard],
        data: { permission: { modulo: 'Reportes', accion: 'Ver' } },
        loadComponent: () => import('./modules/reportes/Inventario/reporte-inventario-critico.component')
      },
      {
        path: 'reportes/proyectos',
        canActivate: [permissionGuard],
        data: { permission: { modulo: 'Reportes', accion: 'Ver' } },
        loadComponent: () => import('./modules/reportes/Proyectos/reporte-proyectos.component').then(m => m.ReporteProyectosComponent)
      },
      {
        path: 'reportes/calidad',
        canActivate: [permissionGuard],
        data: { permission: { modulo: 'Reportes', accion: 'Ver' } },
        loadComponent: () => import('./modules/reportes/Calidad/reporte-calidad.component')
      },
      {
        path: 'reportes/clientes',
        loadComponent: () => import('./modules/reportes/components/clientes-temporada/clientes-temporada.component')
      },
      {
        path: 'reportes/clientes-temporada',
        loadComponent: () => import('./modules/reportes/components/clientes-temporada/clientes-temporada.component')
      },
      {
        path: 'ordenes',
        canActivate: [permissionGuard],
        data: { permission: { modulo: 'OrdenesCompra', accion: 'Recepcionar' } },
        loadComponent: () => import('./modules/orden-compra/components/orden-compra.component').then(m => m.OrdenCompraComponent)
      },
      {
        path: 'notificaciones',
        canActivate: [permissionGuard],
        data: { permission: { modulo: 'Notificaciones', accion: 'Ver' } },
        loadComponent: () => import('./modules/notificaciones/components/notificaciones.component')
      },
      {
        path: 'usuarios',
        redirectTo: '/usuarios/internos',
        pathMatch: 'full'
      },
      {
        path: 'usuarios/internos',
        loadComponent: () => import('./modules/usuarios/components/usuarios-internos.component').then(m => m.UsuariosInternosComponent)
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
