import { Routes } from '@angular/router';
import ReporteInventarioCriticoComponent from './Inventario/reporte-inventario-critico.component';
import { ReporteProveedoresComponent } from './components/proveedores/reporte-proveedores.component';

export const clientesRoutes: Routes = [
  {
    path: '',
    component: ReporteInventarioCriticoComponent
  },
  {
    path: 'proveedores',
    component: ReporteProveedoresComponent
  }
];