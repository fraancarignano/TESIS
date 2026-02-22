import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Insumo, TipoInsumo, Proveedor } from '../models/insumo.model';
import { InsumosService } from '../services/insumos.service';
import { AlertasService } from '../../../core/services/alertas';
import { UbicacionesService, Ubicacion } from '../../ubicaciones/services/ubicaciones.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-insumo-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './insumo-form.component.html',
  styleUrls: ['./insumo-form.component.css']
})
export class InsumoFormComponent implements OnInit {
  @Input() insumo: Insumo | null = null;
  @Output() cerrar = new EventEmitter<void>();

  formulario: Insumo = {
    nombreInsumo: '',
    idTipoInsumo: 0,
    unidadMedida: '',
    stockActual: 0,
    stockMinimo: 0,
    fechaActualizacion: new Date().toISOString().split('T')[0],
    estado: 'Disponible'
  };

  tiposInsumo: TipoInsumo[] = [];
  proveedores: Proveedor[] = [];
  ubicaciones: Ubicacion[] = [];

  // Autocomplete
  insumosCatalogo: Insumo[] = [];
  insumosFiltrados: Insumo[] = [];
  mostrarResultados = false;
  busquedaInsumo = '';

  esEdicion = false;
  guardando = false;
  esInsumoDeCatalogo = false;

  constructor(
    private insumosService: InsumosService,
    private ubicacionesService: UbicacionesService,
    private alertas: AlertasService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Cargar tipos de insumo y proveedores
    this.insumosService.getTiposInsumo().subscribe({
      next: (tipos) => this.tiposInsumo = tipos,
      error: (error: any) => console.error('Error al cargar tipos:', error)
    });

    this.insumosService.getProveedores().subscribe({
      next: (proveedores) => this.proveedores = proveedores,
      error: (error: any) => console.error('Error al cargar proveedores:', error)
    });

    this.ubicacionesService.getUbicaciones().subscribe({
      next: (ubicaciones) => this.ubicaciones = ubicaciones,
      error: (error: any) => console.error('Error al cargar ubicaciones:', error)
    });

    this.cargarCatalogo();

    if (this.insumo) {
      this.esEdicion = true;
      this.formulario = { ...this.insumo };
      this.busquedaInsumo = this.formulario.nombreInsumo;
      // Si el insumo ya tiene ID, lo tratamos como algo que viene de una definición existente
      this.esInsumoDeCatalogo = true;
    }
  }

  cargarCatalogo(): void {
    this.insumosService.getInsumos().subscribe({
      next: (insumos) => {
        this.insumosCatalogo = insumos;
      },
      error: (error: any) => console.error('Error al cargar catálogo:', error)
    });
  }

  onSearchChange(): void {
    if (!this.busquedaInsumo.trim()) {
      this.insumosFiltrados = [];
      this.mostrarResultados = false;
      return;
    }

    const term = this.busquedaInsumo.toLowerCase();
    this.insumosFiltrados = this.insumosCatalogo.filter(i =>
      i.nombreInsumo.toLowerCase().includes(term)
    );
    this.mostrarResultados = this.insumosFiltrados.length > 0;

    // Al escribir, actualizamos el nombre en el formulario
    this.formulario.nombreInsumo = this.busquedaInsumo;
  }

  seleccionarInsumo(insumo: Insumo): void {
    this.formulario = {
      ...this.formulario,
      idInsumo: insumo.idInsumo,
      nombreInsumo: insumo.nombreInsumo,
      idTipoInsumo: insumo.idTipoInsumo,
      unidadMedida: insumo.unidadMedida,
      stockMinimo: insumo.stockMinimo || 0,
      idProveedor: insumo.idProveedor,
      estado: insumo.estado || 'Disponible'
    };

    // Si seleccionamos uno existente, se convierte en una edición técnica para el backend
    this.esEdicion = true;
    this.esInsumoDeCatalogo = true;
    this.busquedaInsumo = insumo.nombreInsumo;
    this.mostrarResultados = false;
  }

  irAGestionDeInsumos(): void {
    this.cerrar.emit();
    this.router.navigate(['/inventario/catalogo']);
  }

  stockBajo(): boolean {
    if (!this.formulario.stockMinimo) return false;
    return this.formulario.stockActual < this.formulario.stockMinimo;
  }

  guardar(): void {
    // Validaciones
    if (!this.formulario.nombreInsumo.trim()) {
      this.alertas.warning('Nombre requerido', 'El nombre del insumo es requerido');
      return;
    }

    if (this.formulario.idTipoInsumo === 0) {
      this.alertas.warning('Tipo requerido', 'Debe seleccionar un tipo de insumo');
      return;
    }

    if (!this.formulario.unidadMedida) {
      this.alertas.warning('Unidad requerida', 'Debe seleccionar una unidad de medida');
      return;
    }

    if (this.formulario.stockActual < 0) {
      this.alertas.warning('Stock inválido', 'El stock actual no puede ser negativo');
      return;
    }

    this.guardando = true;

    const operacion = this.esEdicion
      ? this.insumosService.actualizarInsumo(this.formulario)
      : this.insumosService.agregarInsumo(this.formulario);

    operacion.subscribe({
      next: () => {
        const mensaje = this.esEdicion ? 'Insumo actualizado correctamente' : 'Insumo creado correctamente';
        this.alertas.success('Exito', mensaje);
        this.cerrar.emit();
      },
      error: (error: any) => {
        console.error('Error al guardar:', error);
        this.alertas.error('Error', 'Error al guardar el insumo. Verifique los datos.');
        this.guardando = false;
      }
    });
  }
}