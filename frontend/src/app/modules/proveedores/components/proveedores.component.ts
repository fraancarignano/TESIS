import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProveedoresService } from '../services/proveedores.service';
import { Proveedor } from '../models/proveedor.model';
import { ProveedorFormComponent } from './proveedor-form/proveedor-form.component';
import { ProveedorDetalleModalComponent } from '../proveedor-detalle-modal.component';
import { AlertasService } from '../../../core/services/alertas';
import { ExportService } from '../../../core/services/export.service';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProveedorFormComponent,
    ProveedorDetalleModalComponent
  ],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
})
export class ProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];
  mostrarFormulario = false;
  mostrarDetalle = false;
  proveedorSeleccionado: Proveedor | null = null;
  proveedorDetalle: Proveedor | null = null;
  terminoBusqueda = '';
  loading = false;
  error = false;
  mostrarMenuExportar = false;

  constructor(
    private alertas: AlertasService,
    private proveedoresService: ProveedoresService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
  }

  cargarProveedores(): void {
    this.loading = true;
    this.error = false;

    this.proveedoresService.obtenerProveedores().subscribe({
      next: (data) => {
        this.proveedores = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar proveedores:', err);
        this.error = true;
        this.loading = false;
        this.alertas.error('Error', 'No se pudieron cargar los proveedores');
      }
    });
  }

  get proveedoresFiltrados(): Proveedor[] {
    if (!this.terminoBusqueda.trim()) {
      return this.proveedores;
    }

    const termino = this.terminoBusqueda.toLowerCase();

    return this.proveedores.filter((p) =>
      p.nombreProveedor?.toLowerCase().includes(termino) ||
      p.cuit?.toLowerCase().includes(termino) ||
      p.email?.toLowerCase().includes(termino) ||
      p.telefono?.toLowerCase().includes(termino) ||
      p.nombreProvincia?.toLowerCase().includes(termino) ||
      p.nombreCiudad?.toLowerCase().includes(termino)
    );
  }

  abrirFormularioNuevo(): void {
    this.proveedorSeleccionado = null;
    this.mostrarFormulario = true;
  }

  toggleMenuExportar(): void {
    this.mostrarMenuExportar = !this.mostrarMenuExportar;
  }

  exportarPDF(): void {
    const proveedoresParaExportar = this.proveedoresFiltrados;

    if (proveedoresParaExportar.length === 0) {
      this.alertas.warning('Sin datos', 'No hay proveedores para exportar');
      return;
    }

    try {
      this.exportService.exportarProveedoresPDF(proveedoresParaExportar);
      this.alertas.success(
        'Exportacion exitosa',
        `Se exportaron ${proveedoresParaExportar.length} proveedores a PDF`
      );
      this.mostrarMenuExportar = false;
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      this.alertas.error('Error', 'No se pudo generar el PDF');
    }
  }

  exportarExcel(): void {
    const proveedoresParaExportar = this.proveedoresFiltrados;

    if (proveedoresParaExportar.length === 0) {
      this.alertas.warning('Sin datos', 'No hay proveedores para exportar');
      return;
    }

    try {
      this.exportService.exportarProveedoresExcel(proveedoresParaExportar);
      this.alertas.success(
        'Exportacion exitosa',
        `Se exportaron ${proveedoresParaExportar.length} proveedores a Excel`
      );
      this.mostrarMenuExportar = false;
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      this.alertas.error('Error', 'No se pudo generar el archivo Excel');
    }
  }

  exportarCSV(): void {
    const proveedoresParaExportar = this.proveedoresFiltrados;

    if (proveedoresParaExportar.length === 0) {
      this.alertas.warning('Sin datos', 'No hay proveedores para exportar');
      return;
    }

    try {
      this.exportService.exportarProveedoresCSV(proveedoresParaExportar);
      this.alertas.success(
        'Exportacion exitosa',
        `Se exportaron ${proveedoresParaExportar.length} proveedores a CSV`
      );
      this.mostrarMenuExportar = false;
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      this.alertas.error('Error', 'No se pudo generar el archivo CSV');
    }
  }

  abrirFormularioEditar(proveedor: Proveedor, event: Event): void {
    event.stopPropagation();
    this.proveedorSeleccionado = { ...proveedor };
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.proveedorSeleccionado = null;
    this.cargarProveedores();
  }

  abrirDetalle(proveedor: Proveedor): void {
    this.proveedorDetalle = proveedor;
    this.mostrarDetalle = true;
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.proveedorDetalle = null;
  }

  async eliminarProveedor(proveedor: Proveedor, event: Event): Promise<void> {
    event.stopPropagation();

    if (!proveedor.idProveedor) {
      this.alertas.error('Error', 'Proveedor sin ID valido');
      return;
    }

    const confirmado = await this.alertas.confirmar(
      'Eliminar proveedor?',
      `Se eliminara a ${proveedor.nombreProveedor}. Esta accion no se puede deshacer.`,
      'Si, eliminar'
    );

    if (!confirmado) {
      return;
    }

    this.proveedoresService.eliminarProveedor(proveedor.idProveedor).subscribe({
      next: () => {
        this.alertas.success('Proveedor eliminado', 'El proveedor se elimino correctamente');
        this.cargarProveedores();
      },
      error: (err) => {
        console.error('Error al eliminar proveedor:', err);
        this.alertas.error('Error', 'No se pudo eliminar el proveedor');
      }
    });
  }

  formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
