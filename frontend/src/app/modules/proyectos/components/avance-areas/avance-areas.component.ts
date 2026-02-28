import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertasService } from '../../../../core/services/alertas';
import { PermissionService } from '../../../../core/services/permission.service';
import {
  CompletarAreaRequestDTO,
  ProyectoAvanceArea
} from '../../models/proyecto.model';
import { ProyectosService } from '../../services/proyecto.service';

@Component({
  selector: 'app-avance-areas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './avance-areas.component.html',
  styleUrls: ['./avance-areas.component.css']
})
export class AvanceAreasComponent implements OnChanges {
  @Input() idProyecto?: number;

  loading = false;
  error = '';
  areas: ProyectoAvanceArea[] = [];
  areaSeleccionada?: ProyectoAvanceArea;
  observaciones = '';
  guardando = false;

  constructor(
    private proyectosService: ProyectosService,
    private permissionService: PermissionService,
    private alertas: AlertasService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idProyecto'] && this.idProyecto) {
      this.cargarAvance();
    }
  }

  cargarAvance(): void {
    if (!this.idProyecto) return;
    this.loading = true;
    this.error = '';

    this.proyectosService.obtenerAvanceAreas(this.idProyecto).subscribe({
      next: (areas) => {
        this.areas = areas;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.message || 'No se pudo cargar el avance por áreas';
      }
    });
  }

  puedeCompletar(area: ProyectoAvanceArea): boolean {
    if (!this.permissionService.esOperario()) return false;
    if (area.estado === 'Completado') return false;

    const areasAsignadas = this.permissionService.obtenerAreasAsignadas().map((a) => a.toLowerCase());
    const areaNombre = (area.area || '').toLowerCase();
    return areasAsignadas.some((a) => areaNombre.includes(a) || a.includes(areaNombre));
  }

  seleccionar(area: ProyectoAvanceArea): void {
    this.areaSeleccionada = area;
    this.observaciones = '';
  }

  completarSeleccionada(): void {
    if (!this.idProyecto || !this.areaSeleccionada) return;
    if (!this.puedeCompletar(this.areaSeleccionada)) return;

    const payload: CompletarAreaRequestDTO = {
      observaciones: this.observaciones?.trim() || undefined
    };

    this.guardando = true;
    this.proyectosService.completarArea(this.idProyecto, this.areaSeleccionada.area, payload).subscribe({
      next: () => {
        this.guardando = false;
        this.areaSeleccionada = undefined;
        this.observaciones = '';
        this.alertas.success('Área completada', 'Se registró correctamente el avance');
        this.cargarAvance();
      },
      error: (err) => {
        this.guardando = false;
        this.alertas.error('Error', err?.message || 'No se pudo completar el área');
      }
    });
  }

  estadoClass(area: ProyectoAvanceArea): string {
    if (area.estado === 'Completado') return 'estado-completado';
    if (area.estado === 'EnProceso') return 'estado-enproceso';
    return 'estado-pendiente';
  }
}

export default AvanceAreasComponent;
