import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProyectosService } from '../../services/proyecto.service';
import { Proyecto, EstadoProyecto, PrioridadProyecto, ProyectoVista, proyectoToVista } from '../../models/proyecto.model';
import { AlertasService } from '../../../../core/services/alertas';
import { ExportService } from '../../../../core/services/export.service';
import { ProyectoFiltrosComponent } from '../proyecto-filtros/proyecto-filtros.component';
import { ProyectoDetalleModalComponent } from '../proyecto-detalle-modal/proyecto-detalle-modal.component';

// Interfaz solo aquí
export interface FiltrosProyecto {
  estados: EstadoProyecto[];
  prioridades: PrioridadProyecto[];
  tiposPrenda: string[];
  fechaDesde?: string;
  fechaHasta?: string;
}

@Component({
  selector: 'app-proyecto-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ProyectoFiltrosComponent, ProyectoDetalleModalComponent],
  templateUrl: './proyecto-list.component.html',
  styleUrls: ['./proyecto-list.component.css']
})
export class ProyectoListComponent implements OnInit {
  proyectos: Proyecto[] = [];
  terminoBusqueda = '';
  loading = false;
  error = false;

  // Filtros aplicados
  filtrosActuales: FiltrosProyecto | null = null;
  mostrarMenuExportar = false;

  // Modal de detalles
  mostrarModalDetalle = false;
  proyectoSeleccionado: ProyectoVista | null = null;

  constructor(
    private alertas: AlertasService,
    private proyectosService: ProyectosService,
    private exportService: ExportService
  ) { }

  ngOnInit(): void {
    this.cargarProyectos();
  }

  cargarProyectos(): void {
    this.loading = true;
    this.error = false;

    this.proyectosService.obtenerProyectos().subscribe({
      next: (data) => {
        this.proyectos = data;
        this.loading = false;
        console.log('Proyectos cargados:', this.proyectos);
      },
      error: (err) => {
        console.error('Error al cargar proyectos:', err);
        this.error = true;
        this.loading = false;
        this.alertas.error('Error', 'No se pudieron cargar los proyectos');
      }
    });
  }

  get proyectosFiltrados(): Proyecto[] {
    let resultado = [...this.proyectos];

    if (this.terminoBusqueda) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(p =>
        (p.nombreProyecto?.toLowerCase().includes(termino)) ||
        (p.codigoProyecto?.toLowerCase().includes(termino)) ||
        (p.tipoPrenda?.toLowerCase().includes(termino)) ||
        (p.estado?.toLowerCase().includes(termino)) ||
        (p.clienteNombre?.toLowerCase().includes(termino))
      );
    }

    if (this.filtrosActuales) {
      if (this.filtrosActuales.estados && this.filtrosActuales.estados.length > 0) {
        resultado = resultado.filter(p =>
          this.filtrosActuales!.estados.includes(p.estado)
        );
      }

      if (this.filtrosActuales.prioridades && this.filtrosActuales.prioridades.length > 0) {
        resultado = resultado.filter(p =>
          p.prioridad && this.filtrosActuales!.prioridades.includes(p.prioridad)
        );
      }

      if (this.filtrosActuales.tiposPrenda && this.filtrosActuales.tiposPrenda.length > 0) {
        resultado = resultado.filter(p =>
          p.tipoPrenda && this.filtrosActuales!.tiposPrenda.includes(p.tipoPrenda)
        );
      }

      if (this.filtrosActuales.fechaDesde) {
        const fechaDesde = new Date(this.filtrosActuales.fechaDesde);
        fechaDesde.setHours(0, 0, 0, 0);
        resultado = resultado.filter(p => {
          const fechaInicio = new Date(p.fechaInicio);
          return fechaInicio >= fechaDesde;
        });
      }

      if (this.filtrosActuales.fechaHasta) {
        const fechaHasta = new Date(this.filtrosActuales.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999);
        resultado = resultado.filter(p => {
          const fechaInicio = new Date(p.fechaInicio);
          return fechaInicio <= fechaHasta;
        });
      }
    }

    return resultado;
  }

  // El método recibe 'any' y lo convierte internamente
  onFiltrosChange(filtros: any): void {
    this.filtrosActuales = filtros;
  }

  limpiarFiltros(): void {
    this.filtrosActuales = null;
    this.terminoBusqueda = '';
  }

  toggleMenuExportar(): void {
    this.mostrarMenuExportar = !this.mostrarMenuExportar;
  }

  exportarExcel(): void {
    const proyectosParaExportar = this.proyectosFiltrados;

    if (proyectosParaExportar.length === 0) {
      this.alertas.warning('Sin datos', 'No hay proyectos para exportar');
      return;
    }

    try {
      this.exportService.exportarProyectosExcel(proyectosParaExportar);
      this.alertas.success(
        'Exportación exitosa',
        `Se exportaron ${proyectosParaExportar.length} proyectos a Excel`
      );
      this.mostrarMenuExportar = false;
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      this.alertas.error('Error', 'No se pudo generar el archivo Excel');
    }
  }

  exportarCSV(): void {
    const proyectosParaExportar = this.proyectosFiltrados;

    if (proyectosParaExportar.length === 0) {
      this.alertas.warning('Sin datos', 'No hay proyectos para exportar');
      return;
    }

    try {
      this.exportService.exportarProyectosCSV(proyectosParaExportar);
      this.alertas.success(
        'Exportación exitosa',
        `Se exportaron ${proyectosParaExportar.length} proyectos a CSV`
      );
      this.mostrarMenuExportar = false;
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      this.alertas.error('Error', 'No se pudo generar el archivo CSV');
    }
  }

  abrirDetalle(proyecto: Proyecto): void {
    console.log('📋 Abriendo detalle del proyecto:', proyecto);
    this.proyectoSeleccionado = proyectoToVista(proyecto);
    this.mostrarModalDetalle = true;
  }

  cerrarModalDetalle(): void {
    this.mostrarModalDetalle = false;
    this.proyectoSeleccionado = null;
  }

  onProyectoActualizado(): void {
    console.log('🔄 Proyecto actualizado, recargando lista...');
    this.cargarProyectos();
  }

  editarProyecto(proyecto: Proyecto): void {
    console.log('Editar proyecto:', proyecto);
  }

  async eliminarProyecto(proyecto: Proyecto): Promise<void> {
    if (!proyecto.idProyecto) {
      this.alertas.error('Error', 'Proyecto sin ID válido');
      return;
    }

    const confirmado = await this.alertas.confirmar(
      '¿Eliminar proyecto?',
      `Se eliminará el proyecto "${proyecto.nombreProyecto}". Esta acción no se puede deshacer.`,
      'Sí, eliminar'
    );

    if (confirmado) {
      this.proyectosService.eliminarProyecto(proyecto.idProyecto).subscribe({
        next: () => {
          this.alertas.success('Proyecto eliminado', 'El proyecto se eliminó correctamente');
          this.cargarProyectos();
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          this.alertas.error('Error', 'No se pudo eliminar el proyecto');
        }
      });
    }
  }

  getEstadoClass(estado: string): string {
    const estados: { [key: string]: string } = {
      'Pendiente': 'badge-pendiente',
      'En Proceso': 'badge-en-curso',
      'Finalizado': 'badge-finalizado',
      'Cancelado': 'badge-cancelado',
      'Pausado': 'badge-pausado',
      'Archivado': 'badge-inactivo'
    };
    return estados[estado] || 'badge-default';
  }

  formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}