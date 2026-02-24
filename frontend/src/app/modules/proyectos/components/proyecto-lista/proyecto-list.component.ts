import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProyectosService } from '../../services/proyecto.service';
import { Proyecto, EstadoProyecto, PrioridadProyecto, proyectoToVista } from '../../models/proyecto.model';
import { AlertasService } from '../../../../core/services/alertas';
import { ExportService } from '../../../../core/services/export.service';
import { ProyectoFiltrosComponent } from '../proyecto-filtros/proyecto-filtros.component';
import { ProyectoDetalleModalComponent } from '../proyecto-detalle-modal/proyecto-detalle-modal.component';
import { ProyectoFormNuevoComponent } from '../nuevo-proyecto-modal/proyecto-form.component';
import { TalleresService } from '../../../talleres/services/talleres.service';
import { Taller } from '../../../talleres/models/taller.model';

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
  imports: [CommonModule, FormsModule, ProyectoFiltrosComponent, ProyectoDetalleModalComponent, ProyectoFormNuevoComponent],
  templateUrl: './proyecto-list.component.html',
  styleUrls: ['./proyecto-list.component.css']
})
export class ProyectoListComponent implements OnInit {
  proyectos: Proyecto[] = [];
  terminoBusqueda = '';
  loading = false;
  error = false;
  filtrosActuales: FiltrosProyecto | null = null;
  mostrarMenuExportar = false;

  mostrarModalDetalle = false;
  proyectoSeleccionado: any = null;
  mostrarModalEdicion = false;

  filtroTallerId: number | null = null;
  filtroTallerNombre = '';

  talleres: Taller[] = [];
  mostrarModalAsignarTaller = false;
  proyectoAAsignarTaller: Proyecto | null = null;
  idTallerSeleccionado: number | null = null;

  constructor(
    private alertas: AlertasService,
    private proyectosService: ProyectosService,
    private exportService: ExportService,
    private route: ActivatedRoute,
    private router: Router,
    private talleresService: TalleresService
  ) { }

  ngOnInit(): void {
    this.cargarTalleres();
    this.route.queryParamMap.subscribe(params => {
      const idTallerParam = params.get('taller');
      const nombreTallerParam = params.get('nombreTaller');

      this.filtroTallerId = idTallerParam ? Number(idTallerParam) : null;
      this.filtroTallerNombre = nombreTallerParam || '';
      this.cargarProyectos();
    });
  }

  cargarProyectos(): void {
    this.loading = true;
    this.error = false;

    const request = this.filtroTallerId
      ? this.proyectosService.obtenerProyectosPorTaller(this.filtroTallerId)
      : this.proyectosService.obtenerProyectos();

    request.subscribe({
      next: (data) => {
        this.proyectos = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar proyectos:', err);
        this.error = true;
        this.loading = false;
        const mensaje = this.filtroTallerId
          ? 'No se pudieron cargar los proyectos del taller seleccionado'
          : 'No se pudieron cargar los proyectos';
        this.alertas.error('Error', mensaje);
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
      if (this.filtrosActuales.estados?.length) {
        resultado = resultado.filter(p => this.filtrosActuales!.estados.includes(p.estado));
      }
      if (this.filtrosActuales.prioridades?.length) {
        resultado = resultado.filter(p => !!p.prioridad && this.filtrosActuales!.prioridades.includes(p.prioridad));
      }
      if (this.filtrosActuales.tiposPrenda?.length) {
        resultado = resultado.filter(p => !!p.tipoPrenda && this.filtrosActuales!.tiposPrenda.includes(p.tipoPrenda));
      }
      if (this.filtrosActuales.fechaDesde) {
        const fechaDesde = new Date(this.filtrosActuales.fechaDesde);
        fechaDesde.setHours(0, 0, 0, 0);
        resultado = resultado.filter(p => new Date(p.fechaInicio) >= fechaDesde);
      }
      if (this.filtrosActuales.fechaHasta) {
        const fechaHasta = new Date(this.filtrosActuales.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999);
        resultado = resultado.filter(p => new Date(p.fechaInicio) <= fechaHasta);
      }
    }

    return resultado;
  }

  onFiltrosChange(filtros: any): void {
    this.filtrosActuales = filtros;
  }

  limpiarFiltros(): void {
    this.filtrosActuales = null;
    this.terminoBusqueda = '';
  }

  limpiarFiltroTaller(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { taller: null, nombreTaller: null },
      queryParamsHandling: 'merge'
    });
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
      this.alertas.success('Exportacion exitosa', `Se exportaron ${proyectosParaExportar.length} proyectos a Excel`);
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
      this.alertas.success('Exportacion exitosa', `Se exportaron ${proyectosParaExportar.length} proyectos a CSV`);
      this.mostrarMenuExportar = false;
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      this.alertas.error('Error', 'No se pudo generar el archivo CSV');
    }
  }

  abrirDetalle(proyecto: Proyecto): void {
    this.proyectoSeleccionado = proyectoToVista(proyecto);
    this.mostrarModalDetalle = true;
  }

  cerrarModalDetalle(): void {
    this.mostrarModalDetalle = false;
    this.proyectoSeleccionado = null;
  }

  onProyectoActualizado(): void {
    this.cargarProyectos();
  }

  editarProyecto(proyecto: Proyecto): void {
    const estadosNoEditables = ['Finalizado', 'Archivado', 'Cancelado'];
    if (estadosNoEditables.includes(proyecto.estado)) {
      this.alertas.warning('No se puede editar', `El proyecto esta en estado ${proyecto.estado} y no puede ser editado`);
      return;
    }

    this.proyectoSeleccionado = proyecto;
    this.mostrarModalEdicion = true;
  }

  cerrarModalEdicion(): void {
    this.mostrarModalEdicion = false;
    this.proyectoSeleccionado = null;
    this.cargarProyectos();
  }

  abrirModalAsignarTaller(proyecto: Proyecto, event: Event): void {
    event.stopPropagation();
    this.proyectoAAsignarTaller = proyecto;
    this.idTallerSeleccionado = null;
    this.mostrarModalAsignarTaller = true;
  }

  cerrarModalAsignarTaller(): void {
    this.mostrarModalAsignarTaller = false;
    this.proyectoAAsignarTaller = null;
    this.idTallerSeleccionado = null;
  }

  confirmarAsignacionTaller(): void {
    if (!this.proyectoAAsignarTaller?.idProyecto) {
      this.alertas.error('Error', 'Proyecto sin ID valido');
      return;
    }

    if (!this.idTallerSeleccionado) {
      this.alertas.warning('Taller requerido', 'Selecciona un taller para asignar');
      return;
    }

    this.talleresService.asignarProyectoATaller(this.idTallerSeleccionado, this.proyectoAAsignarTaller.idProyecto).subscribe({
      next: () => {
        this.alertas.success('Asignacion exitosa', 'El proyecto se asigno al taller correctamente');
        this.cerrarModalAsignarTaller();
      },
      error: (err) => {
        console.error('Error al asignar taller:', err);
        this.alertas.error('Error', 'No se pudo asignar el taller al proyecto');
      }
    });
  }

  private cargarTalleres(): void {
    this.talleresService.obtenerTalleres().subscribe({
      next: (data) => this.talleres = data,
      error: (err) => console.error('Error al cargar talleres para asignacion:', err)
    });
  }

  async eliminarProyecto(proyecto: Proyecto): Promise<void> {
    if (!proyecto.idProyecto) {
      this.alertas.error('Error', 'Proyecto sin ID valido');
      return;
    }

    const confirmado = await this.alertas.confirmar(
      'Eliminar proyecto?',
      `Se eliminara el proyecto "${proyecto.nombreProyecto}". Esta accion no se puede deshacer.`,
      'Si, eliminar'
    );

    if (!confirmado) return;

    this.proyectosService.eliminarProyecto(proyecto.idProyecto).subscribe({
      next: () => {
        this.alertas.success('Proyecto eliminado', 'El proyecto se elimino correctamente');
        this.cargarProyectos();
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        this.alertas.error('Error', 'No se pudo eliminar el proyecto');
      }
    });
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
