import { Routes } from '@angular/router';
import { InventarioComponent } from '../inventario/components/inventario.component';
import ReporteInventarioCriticoComponent from './Inventario/reporte-inventario-critico.component';

export const clientesRoutes: Routes = [
  {
    path: '',
    component: ReporteInventarioCriticoComponent
  }
];