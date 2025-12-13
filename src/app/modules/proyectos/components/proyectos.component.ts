// src/app/proyectos/proyectos.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Proyecto, EstadoProyecto, generarCodigoProyecto } from '../models/proyecto.model';

@Component({
  selector: 'app-proyectos',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './proyectos.component.html',
  styleUrls: ['./proyectos.component.css']
})
export class ProyectosComponent {
  
  // Búsqueda
  terminoBusqueda: string = '';
  
  // Estados para las columnas Kanban
  proyectosPendientes: Proyecto[] = [];
  proyectosEnProceso: Proyecto[] = [];
  proyectosFinalizados: Proyecto[] = [];
  proyectosArchivados: Proyecto[] = [];
  
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
    
    const sumaScrap = todosProyectos.reduce((sum, p) => sum + p.scrapPorcentaje, 0);
    return Math.round((sumaScrap / todosProyectos.length) * 10) / 10;
  }
  
  // Modal
  mostrarModalNuevoProyecto: boolean = false;
  proyectoSeleccionado: Proyecto | null = null;
  mostrarModalDetalle: boolean = false;
  
  constructor() {
    this.cargarDatosHardcoded();
  }
  
  // Cargar datos de ejemplo (hardcoded)
  cargarDatosHardcoded(): void {
    const ahora = new Date();

        // Proyecto pendiente 
            this.proyectosPendientes = [
        {
            id: '4',
            codigo: 'P-2025-004',
            clienteId: 'c4',
            clienteNombre: 'Fashion Store',
            tipoPrenda: 'Remeras Puma',
            cantidadTotal: 800,
            cantidadProducida: 0,
            materiales: [
            { id: 'm4', nombre: 'Tela Jersey', cantidad: 400, unidad: 'metros', costoUnitario: 18 }
            ],
            costoMaterialEstimado: 14400,
            fechaInicio: new Date(2025, 1, 1),
            fechaEstimadaFin: new Date(2025, 2, 30),
            estado: 'pendiente',
            avanceEtapas: {
            diseño: 0,
            corte: 0,
            confeccion: 0,
            calidad: 0
            },
            scrapGenerado: 0,
            scrapPorcentaje: 0,
            observaciones: [],
            fechaCreacion: new Date(2025, 0, 20),
            fechaUltimaModificacion: ahora,
            usuarioCreador: 'admin'
        }
        ];
    
    // Proyecto en proceso
    this.proyectosEnProceso = [
      {
        id: '1',
        codigo: 'P-2025-001',
        clienteId: 'c1',
        clienteNombre: 'Deportes Max',
        tipoPrenda: 'Camisetas Nike Dri-FIT',
        cantidadTotal: 1000,
        cantidadProducida: 850,
        materiales: [
          { id: 'm1', nombre: 'Tela Poliéster', cantidad: 500, unidad: 'metros', costoUnitario: 15 }
        ],
        costoMaterialEstimado: 15500,
        fechaInicio: new Date(2025, 0, 15),
        fechaEstimadaFin: new Date(2025, 2, 15),
        estado: 'en-proceso',
        avanceEtapas: {
          diseño: 100,
          corte: 100,
          confeccion: 85,
          calidad: 60
        },
        scrapGenerado: 102,
        scrapPorcentaje: 8.0,
        observaciones: [],
        fechaCreacion: new Date(2025, 0, 10),
        fechaUltimaModificacion: ahora,
        usuarioCreador: 'admin'
      }
    ];
    
    // Proyecto archivado
    this.proyectosArchivados = [
      {
        id: '2',
        codigo: 'P-2025-002',
        clienteId: 'c2',
        clienteNombre: 'Athletic Pro',
        tipoPrenda: 'Pantalones Adidas',
        cantidadTotal: 500,
        cantidadProducida: 420,
        materiales: [
          { id: 'm2', nombre: 'Tela Algodón', cantidad: 300, unidad: 'metros', costoUnitario: 12 }
        ],
        costoMaterialEstimado: 12500,
        fechaInicio: new Date(2024, 11, 1),
        fechaEstimadaFin: new Date(2025, 1, 1),
        estado: 'archivado',
        avanceEtapas: {
          diseño: 100,
          corte: 100,
          confeccion: 100,
          calidad: 100
        },
        scrapGenerado: 94,
        scrapPorcentaje: 18.8,
        observaciones: [],
        fechaCreacion: new Date(2024, 10, 25),
        fechaUltimaModificacion: new Date(2024, 11, 30),
        usuarioCreador: 'admin'
      }
    ];
    
    // Proyecto finalizado
    this.proyectosFinalizados = [
      {
        id: '3',
        codigo: 'P-2025-003',
        clienteId: 'c3',
        clienteNombre: 'Sport Zone',
        tipoPrenda: 'Camperas Umbro',
        cantidadTotal: 300,
        cantidadProducida: 300,
        materiales: [
          { id: 'm3', nombre: 'Tela Impermeable', cantidad: 200, unidad: 'metros', costoUnitario: 25 }
        ],
        costoMaterialEstimado: 9000,
        fechaInicio: new Date(2025, 0, 5),
        fechaEstimadaFin: new Date(2025, 1, 20),
        fechaFinReal: new Date(2025, 1, 18),
        estado: 'finalizado',
        avanceEtapas: {
          diseño: 100,
          corte: 100,
          confeccion: 100,
          calidad: 100
        },
        scrapGenerado: 12,
        scrapPorcentaje: 4.0,
        observaciones: [],
        fechaCreacion: new Date(2025, 0, 1),
        fechaUltimaModificacion: new Date(2025, 1, 18),
        usuarioCreador: 'admin'
      }
    ];
  }
  
  // Drag & Drop
  drop(event: CdkDragDrop<Proyecto[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      // Actualizar el estado del proyecto según la columna destino
      const proyecto = event.container.data[event.currentIndex];
      proyecto.estado = this.obtenerEstadoPorContainer(event.container.id);
    }
  }
  
  obtenerEstadoPorContainer(containerId: string): EstadoProyecto {
    switch(containerId) {
      case 'pendientes': return 'pendiente';
      case 'en-proceso': return 'en-proceso';
      case 'finalizados': return 'finalizado';
      case 'archivados': return 'archivado';
      default: return 'pendiente';
    }
  }
  
  // Acciones
  abrirModalNuevoProyecto(): void {
    this.mostrarModalNuevoProyecto = true;
  }
  
  cerrarModalNuevoProyecto(): void {
    this.mostrarModalNuevoProyecto = false;
  }
  
  verDetalleProyecto(proyecto: Proyecto): void {
    this.proyectoSeleccionado = proyecto;
    this.mostrarModalDetalle = true;
  }
  
  cerrarModalDetalle(): void {
    this.mostrarModalDetalle = false;
    this.proyectoSeleccionado = null;
  }
  
  // Búsqueda (por ahora básica)
  get proyectosFiltrados() {
    // Esto lo implementamos después si querés
    return {
      pendientes: this.proyectosPendientes,
      enProceso: this.proyectosEnProceso,
      finalizados: this.proyectosFinalizados,
      archivados: this.proyectosArchivados
    };
  }
  
  exportarProyectos(): void {
    console.log('Exportar proyectos...');
    // Implementar después
  }
  
  // Helper para obtener clase de badge scrap
  getScrapClass(porcentaje: number): string {
    if (porcentaje >= 10) return 'scrap-alto';
    if (porcentaje >= 5) return 'scrap-medio';
    return 'scrap-bajo';
  }
}