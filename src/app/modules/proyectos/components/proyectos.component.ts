import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ProyectosService } from '../services/proyectos.service';
import { ProyectoFormComponent } from './nuevo-proyecto-modal/proyecto-form.component'
import { ProyectoCardComponent } from './proyecto-card/proyecto-card.component';
import { ProyectoDetalleModalComponent } from './proyecto-detalle-modal/proyecto-detalle-modal.component';


import { 
  Proyecto, 
  ProyectoVista, 
  EstadoProyecto,
  proyectoToVista,
  calcularProgresoGeneral 
} from '../models/proyecto.model';

@Component({
  selector: 'app-proyectos',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, ProyectoFormComponent, ProyectoCardComponent, ProyectoDetalleModalComponent ],
  templateUrl: './proyectos.component.html',
  styleUrls: ['./proyectos.component.css']
})
export class ProyectosComponent implements OnInit {
  
  // Estados de carga
  loading = false;
  error = false;
  
  // Búsqueda
  terminoBusqueda: string = '';
  
  // Estados para las columnas Kanban
  proyectosPendientes: ProyectoVista[] = [];
  proyectosEnProceso: ProyectoVista[] = [];
  proyectosFinalizados: ProyectoVista[] = [];
  proyectosArchivados: ProyectoVista[] = [];
  
  // Todos los proyectos (para filtrado)
  todosLosProyectos: Proyecto[] = [];
  
  // Estadísticas
  get totalProyectosActivos(): number {
    return this.proyectosPendientes.length + this.proyectosEnProceso.length;
  }
  
  get totalProyectosArchivados(): number {
    return this.proyectosArchivados.length;
  }
  
  get promedioScrap(): number {
    const todosProyectos = [
      ...this.proyectosPendientes,
      ...this.proyectosEnProceso,
      ...this.proyectosFinalizados,
      ...this.proyectosArchivados
    ];
    
    if (todosProyectos.length === 0) return 0;
    
    const proyectosConScrap = todosProyectos.filter(p => p.scrapPorcentaje);
    if (proyectosConScrap.length === 0) return 0;
    
    const sumaScrap = proyectosConScrap.reduce((sum, p) => sum + (p.scrapPorcentaje || 0), 0);
    return Math.round((sumaScrap / proyectosConScrap.length) * 10) / 10;
  }
  
  // Modal
  mostrarModalNuevoProyecto: boolean = false;
  proyectoSeleccionado: ProyectoVista | null = null;
  mostrarModalDetalle: boolean = false;
  
  constructor(private proyectosService: ProyectosService) {}
  
  ngOnInit(): void {
    this.cargarProyectos();
  }
  
  /**
   * Cargar proyectos desde el backend
   */
  cargarProyectos(): void {
    this.loading = true;
    this.error = false;
    
    this.proyectosService.obtenerProyectos().subscribe({
      next: (proyectos) => {
        this.todosLosProyectos = proyectos;
        this.organizarProyectosPorEstado(proyectos);
        this.loading = false;
        console.log('Proyectos cargados:', proyectos);
      },
      error: (err) => {
        console.error('Error al cargar proyectos:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }
  
  /**
   * Organizar proyectos en columnas Kanban según su estado
   */
  organizarProyectosPorEstado(proyectos: Proyecto[]): void {
    // Limpiar columnas
    this.proyectosPendientes = [];
    this.proyectosEnProceso = [];
    this.proyectosFinalizados = [];
    this.proyectosArchivados = [];
    
    // Convertir a ProyectoVista y distribuir
    proyectos.forEach(proyecto => {
      const proyectoVista = proyectoToVista(proyecto);
      
      switch (proyecto.estado) {
        case 'Pendiente':
          this.proyectosPendientes.push(proyectoVista);
          break;
        case 'En Proceso':
          this.proyectosEnProceso.push(proyectoVista);
          break;
        case 'Finalizado':
          this.proyectosFinalizados.push(proyectoVista);
          break;
        case 'Archivado':
        case 'Cancelado':
        case 'Pausado':
          this.proyectosArchivados.push(proyectoVista);
          break;
      }
    });
  }
  
  /**
   * Drag & Drop entre columnas
   */
  drop(event: CdkDragDrop<ProyectoVista[]>): void {
    if (event.previousContainer === event.container) {
      // Movimiento dentro de la misma columna
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Movimiento entre columnas diferentes
      const proyecto = event.previousContainer.data[event.previousIndex];
      
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      // Obtener el nuevo estado según la columna destino
      const nuevoEstado = this.obtenerEstadoPorContainer(event.container.id);
      
      // Actualizar en el backend
      if (proyecto.idProyecto) {
        this.actualizarEstadoProyecto(proyecto.idProyecto, nuevoEstado);
      }
    }
  }
  
  /**
   * Obtener estado según el ID del contenedor
   */
  obtenerEstadoPorContainer(containerId: string): string {
    const mapeo: Record<string, string> = {
      'pendientes': 'Pendiente',
      'en-proceso': 'En Proceso',
      'finalizados': 'Finalizado',
      'archivados': 'Archivado'
    };
    return mapeo[containerId] || 'Pendiente';
  }
  
  /**
   * Actualizar estado del proyecto en el backend
   */
  actualizarEstadoProyecto(id: number, estado: string): void {
    this.proyectosService.cambiarEstado(id, estado).subscribe({
      next: () => {
        console.log(`Proyecto ${id} actualizado a estado: ${estado}`);
        // Opcionalmente mostrar notificación de éxito
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
        // Recargar proyectos para restaurar el estado anterior
        this.cargarProyectos();
        // Opcionalmente mostrar notificación de error
      }
    });
  }
  
  /**
   * Abrir modal para nuevo proyecto
   */
  abrirModalNuevoProyecto(): void {
    this.mostrarModalNuevoProyecto = true;
  }
  
  /**
   * Cerrar modal de nuevo proyecto
   */
  cerrarModalNuevoProyecto(): void {
    this.mostrarModalNuevoProyecto = false;
    this.cargarProyectos(); // Recargar lista
  }
  
  /**
   * Ver detalle de un proyecto
   */
  verDetalleProyecto(proyecto: ProyectoVista): void {
    this.proyectoSeleccionado = proyecto;
    this.mostrarModalDetalle = true;
  }
  
  /**
   * Cerrar modal de detalle
   */
  cerrarModalDetalle(): void {
    this.mostrarModalDetalle = false;
    this.proyectoSeleccionado = null;
  }
  
  /**
   * Filtrar proyectos por búsqueda
   */
  filtrarProyectos(proyectos: ProyectoVista[]): ProyectoVista[] {
    if (!this.terminoBusqueda) {
      return proyectos;
    }
    
    const termino = this.terminoBusqueda.toLowerCase();
    return proyectos.filter(p => 
      p.nombreProyecto?.toLowerCase().includes(termino) ||
      p.clienteNombre?.toLowerCase().includes(termino) ||
      p.codigoProyecto?.toLowerCase().includes(termino) ||
      p.tipoPrenda?.toLowerCase().includes(termino)
    );
  }
  
  /**
   * Obtener proyectos filtrados para cada columna
   */
  get proyectosFiltrados() {
    return {
      pendientes: this.filtrarProyectos(this.proyectosPendientes),
      enProceso: this.filtrarProyectos(this.proyectosEnProceso),
      finalizados: this.filtrarProyectos(this.proyectosFinalizados),
      archivados: this.filtrarProyectos(this.proyectosArchivados)
    };
  }
  
  /**
   * Exportar proyectos
   */
  exportarProyectos(): void {
    console.log('Exportar proyectos...');
    // TODO: Implementar exportación (PDF/Excel)
  }
  
  /**
   * Eliminar (archivar) proyecto
   */
  eliminarProyecto(proyecto: ProyectoVista, event: Event): void {
    event.stopPropagation();
    
    if (!proyecto.idProyecto) return;
    
    if (confirm(`¿Está seguro de archivar el proyecto "${proyecto.nombreProyecto}"?`)) {
      this.proyectosService.eliminarProyecto(proyecto.idProyecto).subscribe({
        next: () => {
          console.log('Proyecto archivado exitosamente');
          this.cargarProyectos();
          // Opcionalmente mostrar notificación de éxito
        },
        error: (err) => {
          console.error('Error al archivar proyecto:', err);
          // Opcionalmente mostrar notificación de error
        }
      });
    }
  }
  
  /**
   * Helper para obtener clase de badge scrap
   */
  getScrapClass(porcentaje?: number | null): string {
    if (!porcentaje) return 'scrap-bajo';
    if (porcentaje >= 10) return 'scrap-alto';
    if (porcentaje >= 5) return 'scrap-medio';
    return 'scrap-bajo';
  }
  
  /**
   * Formatear fecha para mostrar
   */
  formatearFecha(fecha?: string | null): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  /**
   * Obtener progreso general del proyecto
   */
  obtenerProgresoGeneral(proyecto: ProyectoVista): number {
    return proyecto.progresoGeneral;
  }
}