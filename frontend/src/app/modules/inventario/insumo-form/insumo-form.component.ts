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

  // Datos para el ingreso de stock
  idSeleccionado: number | null = null;
  insumoSeleccionado: Insumo | null = null;
  cantidad = 0;
  idUbicacion: number | undefined;

  // Catálogo para búsqueda
  insumosCatalogo: Insumo[] = [];
  insumosFiltrados: Insumo[] = [];
  ubicaciones: Ubicacion[] = [];

  // Búsqueda
  busquedaNombre = '';
  busquedaId: string = '';
  mostrarResultados = false;

  guardando = false;

  constructor(
    private insumosService: InsumosService,
    private ubicacionesService: UbicacionesService,
    private alertas: AlertasService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Cargar ubicaciones
    this.ubicacionesService.getUbicaciones().subscribe({
      next: (ubicaciones) => this.ubicaciones = ubicaciones,
      error: (error: any) => console.error('Error al cargar ubicaciones:', error)
    });

    // Cargar catálogo completo para búsqueda inteligente
    this.cargarCatalogo();

    if (this.insumo) {
      this.seleccionarInsumo(this.insumo);
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
    if (!this.busquedaNombre.trim()) {
      this.insumosFiltrados = [];
      this.mostrarResultados = false;
      return;
    }

    const term = this.busquedaNombre.toLowerCase();
    this.insumosFiltrados = this.insumosCatalogo.filter(i =>
      i.nombreInsumo.toLowerCase().includes(term) ||
      i.idInsumo?.toString().includes(term)
    );
    this.mostrarResultados = this.insumosFiltrados.length > 0;
  }

  onIdChange(): void {
    if (!this.busquedaId.trim()) {
      this.limpiarSeleccion();
      return;
    }

    const id = parseInt(this.busquedaId);
    const encontrado = this.insumosCatalogo.find(i => i.idInsumo === id);
    if (encontrado) {
      this.seleccionarInsumo(encontrado);
    } else {
      this.insumoSeleccionado = null;
      this.idSeleccionado = null;
    }
  }

  seleccionarInsumo(insumo: Insumo): void {
    this.insumoSeleccionado = insumo;
    this.idSeleccionado = insumo.idInsumo || null;
    this.busquedaNombre = insumo.nombreInsumo;
    this.busquedaId = insumo.idInsumo?.toString() || '';
    this.mostrarResultados = false;
    this.idUbicacion = insumo.idUbicacion;
  }

  limpiarSeleccion(): void {
    this.insumoSeleccionado = null;
    this.idSeleccionado = null;
    this.busquedaNombre = '';
    this.busquedaId = '';
  }

  irAGestionDeInsumos(): void {
    this.cerrar.emit();
    this.router.navigate(['/inventario/catalogo']);
  }

  guardar(): void {
    if (!this.idSeleccionado) {
      this.alertas.warning('Insumo requerido', 'Debe seleccionar un insumo válido del catálogo');
      return;
    }
    if (this.cantidad <= 0) {
      this.alertas.warning('Cantidad inválida', 'Debe ingresar una cantidad mayor a 0');
      return;
    }

    this.guardando = true;

    this.insumosService.agregarStock(this.idSeleccionado, this.cantidad, this.idUbicacion).subscribe({
      next: (res) => {
        this.alertas.success('Exito', res.message || 'Stock agregado correctamente');
        this.cerrar.emit();
      },
      error: (error: any) => {
        console.error('Error al guardar:', error);
        this.alertas.error('Error', error?.error?.message || 'Error al guardar el stock');
        this.guardando = false;
      }
    });
  }
}