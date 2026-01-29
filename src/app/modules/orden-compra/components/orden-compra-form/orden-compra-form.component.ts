import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdenCompraService } from '../../services/orden-compra.service';
import { NuevaOrdenCompra, DetalleOrdenCompraDTO, Proveedor, Insumo } from '../../models/orden-compra.model';
import { AlertasService } from '../../../../../../No-Frontend/src/app/core/services/alertas';

@Component({
  selector: 'app-orden-compra-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orden-compra-form.component.html',
  styleUrls: ['./orden-compra-form.component.css']
})
export class OrdenCompraFormComponent implements OnInit {
  @Output() cerrar = new EventEmitter<void>();
  @Output() ordenCreada = new EventEmitter<void>();

  // Datos del formulario
  nroOrden = '';
  idProveedorSeleccionado?: number;
  fechaSolicitud = '';
  fechaEntregaEstimada = '';
  estado = 'Pendiente';

  // Listas
  proveedores: Proveedor[] = [];
  insumos: Insumo[] = [];
  insumosDisponibles: Insumo[] = [];

  // Detalle de la orden
  detalles: DetalleOrdenCompraDTO[] = [];

  // Agregar insumo
  insumoSeleccionado?: number;
  cantidadInsumo = 1;
  precioUnitarioInsumo = 0;

  cargando = false;

  constructor(
    private ordenCompraService: OrdenCompraService,
    private alertas: AlertasService
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
    this.cargarInsumos();
    this.fechaSolicitud = new Date().toISOString().split('T')[0];
  }

  cargarProveedores(): void {
    this.ordenCompraService.obtenerProveedores().subscribe({
      next: (data) => {
        this.proveedores = data;
      },
      error: (err) => {
        console.error('Error al cargar proveedores:', err);
        this.alertas.error('Error', 'No se pudieron cargar los proveedores');
      }
    });
  }

  cargarInsumos(): void {
    this.ordenCompraService.obtenerInsumos().subscribe({
      next: (data) => {
        this.insumos = data;
        this.actualizarInsumosDisponibles();
      },
      error: (err) => {
        console.error('Error al cargar insumos:', err);
        this.alertas.error('Error', 'No se pudieron cargar los insumos');
      }
    });
  }

  onProveedorChange(): void {
    this.actualizarInsumosDisponibles();
  }

  actualizarInsumosDisponibles(): void {
    if (!this.idProveedorSeleccionado) {
      this.insumosDisponibles = this.insumos;
    } else {
      // Filtrar insumos por proveedor
      this.insumosDisponibles = this.insumos.filter(
        i => i.idProveedor === this.idProveedorSeleccionado
      );
    }
  }

  agregarInsumo(): void {
    if (!this.insumoSeleccionado || this.cantidadInsumo <= 0 || this.precioUnitarioInsumo <= 0) {
      this.alertas.error('Datos incompletos', 'Complete todos los campos del insumo');
      return;
    }

    // Verificar si ya existe
    const existe = this.detalles.find(d => d.idInsumo === this.insumoSeleccionado);
    if (existe) {
      this.alertas.error('Insumo duplicado', 'Este insumo ya fue agregado');
      return;
    }

    const subtotal = this.cantidadInsumo * this.precioUnitarioInsumo;

    this.detalles.push({
      idInsumo: this.insumoSeleccionado,
      cantidad: this.cantidadInsumo,
      precioUnitario: this.precioUnitarioInsumo,
      subtotal: subtotal
    });

    // Resetear campos
    this.insumoSeleccionado = undefined;
    this.cantidadInsumo = 1;
    this.precioUnitarioInsumo = 0;
  }

  eliminarInsumo(idInsumo: number): void {
    this.detalles = this.detalles.filter(d => d.idInsumo !== idInsumo);
  }

  get totalOrden(): number {
    return this.detalles.reduce((sum, d) => sum + d.subtotal, 0);
  }

  obtenerNombreInsumo(idInsumo: number): string {
    const insumo = this.insumos.find(i => i.idInsumo === idInsumo);
    return insumo ? insumo.nombreInsumo : 'Desconocido';
  }

  async guardarOrden(): Promise<void> {
    if (!this.nroOrden || !this.idProveedorSeleccionado || !this.fechaSolicitud) {
      this.alertas.error('Datos incompletos', 'Complete todos los campos obligatorios');
      return;
    }

    if (this.detalles.length === 0) {
      this.alertas.error('Sin insumos', 'Debe agregar al menos un insumo');
      return;
    }

    const nuevaOrden: NuevaOrdenCompra = {
      nroOrden: this.nroOrden,
      idProveedor: this.idProveedorSeleccionado,
      fechaSolicitud: this.fechaSolicitud,
      fechaEntregaEstimada: this.fechaEntregaEstimada || undefined,
      estado: this.estado,
      totalOrden: this.totalOrden,
      detalles: this.detalles
    };

    this.cargando = true;

    this.ordenCompraService.crearOrden(nuevaOrden).subscribe({
      next: () => {
        this.cargando = false;
        this.alertas.success('Orden creada', 'La orden de compra se creó correctamente');
        this.ordenCreada.emit();
        this.cerrarFormulario();
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al crear orden:', err);
        this.alertas.error('Error', 'No se pudo crear la orden de compra');
      }
    });
  }

  cerrarFormulario(): void {
    this.cerrar.emit();
  }
}