import { Routes } from '@angular/router';
import { InventarioComponent } from '../inventario/inventario.component';
import ReporteInventarioCriticoComponent from './Inventario/reporte-inventario-critico.component';

export const clientesRoutes: Routes = [
  {
    path: '',
    component: ReporteInventarioCriticoComponent
  }
];