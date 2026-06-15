import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdenCompraService } from '../../services/orden-compra.service';
import { NuevaOrdenCompra, DetalleOrdenCompraDTO, Proveedor, Insumo } from '../../models/orden-compra.model';
import { AlertasService } from '../../../../core/services/alertas';
import { InsumosService } from '../../../inventario/services/insumos.service';
import { TipoInsumo } from '../../../inventario/models/insumo.model';
import { ProyectosService } from '../../../proyectos/services/proyecto.service';

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

  idProveedorSeleccionado?: number;
  idProyectoSeleccionado?: number;
  descripcion = '';
  fechaSolicitud = '';
  fechaEntregaEstimada = '';

  proveedores: Proveedor[] = [];
  proyectos: { idProyecto: number; nombreProyecto: string; codigoProyecto: string }[] = [];
  insumos: Insumo[] = [];
  insumosDisponibles: Insumo[] = [];
  tiposInsumo: TipoInsumo[] = [];

  detalles: DetalleOrdenCompraDTO[] = [];

  // Modo agregar: 'existente' | 'nuevo'
  modoAgregar: 'existente' | 'nuevo' = 'existente';
  insumoSeleccionado?: number;
  insumoSeleccionadoObj?: Insumo;
  cantidadInsumo = 1;
  precioUnitarioInsumo = 0;

  // Buscador inteligente
  busquedaNombreInsumo = '';
  busquedaIdInsumo?: number;
  mostrarSugerencias = false;

  get insumosFiltradosBusqueda(): Insumo[] {
    const termNombre = this.busquedaNombreInsumo.trim().toLowerCase();
    const termId = this.busquedaIdInsumo;
    if (!termNombre && !termId) return [];
    return this.insumosDisponibles.filter(i => {
      if (termId) return i.idInsumo === termId;
      return i.nombreInsumo.toLowerCase().includes(termNombre) ||
             (i.color || '').toLowerCase().includes(termNombre);
    }).slice(0, 10);
  }

  onBusquedaNombreChange(): void {
    this.insumoSeleccionado = undefined;
    this.insumoSeleccionadoObj = undefined;
    this.mostrarSugerencias = true;
  }

  onBusquedaIdChange(): void {
    if (this.busquedaIdInsumo) {
      const found = this.insumosDisponibles.find(i => i.idInsumo === this.busquedaIdInsumo);
      if (found) { this.seleccionarInsumoDesdeSearch(found); return; }
    }
    this.insumoSeleccionado = undefined;
    this.insumoSeleccionadoObj = undefined;
  }

  seleccionarInsumoDesdeSearch(insumo: Insumo): void {
    this.insumoSeleccionado = insumo.idInsumo;
    this.insumoSeleccionadoObj = insumo;
    this.busquedaNombreInsumo = '';
    this.busquedaIdInsumo = undefined;
    this.mostrarSugerencias = false;
    if (insumo.precioUnitario) this.precioUnitarioInsumo = insumo.precioUnitario;
  }

  limpiarInsumoSeleccionado(): void {
    this.insumoSeleccionado = undefined;
    this.insumoSeleccionadoObj = undefined;
    this.busquedaNombreInsumo = '';
    this.busquedaIdInsumo = undefined;
    this.precioUnitarioInsumo = 0;
  }

  ocultarSugerenciasDelay(): void {
    setTimeout(() => { this.mostrarSugerencias = false; }, 200);
  }
  // Campos insumo nuevo
  nuevoNombre = '';
  nuevoIdTipo?: number;
  nuevoColor = '';
  nuevoUnidad = 'Kg';

  unidadesMedida = ['Kg', 'Metros', 'Unidades', 'Litros', 'Rollos'];
  cargando = false;

  constructor(
    private ordenCompraService: OrdenCompraService,
    private insumosService: InsumosService,
    private alertas: AlertasService,
    private proyectosService: ProyectosService
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
    this.cargarInsumos();
    this.cargarProyectos();
    this.fechaSolicitud = new Date().toISOString().split('T')[0];
  }

  cargarProyectos(): void {
    this.proyectosService.obtenerProyectos().subscribe({
      next: (data: any[]) => {
        this.proyectos = data
          .filter(p => p.estado !== 'Archivado' && p.estado !== 'Cancelado' && p.estado !== 'Finalizado')
          .map(p => ({ idProyecto: p.idProyecto, nombreProyecto: p.nombreProyecto, codigoProyecto: p.codigoProyecto || '' }));
      },
      error: () => {}
    });
  }

  cargarProveedores(): void {
    this.ordenCompraService.obtenerProveedores().subscribe({
      next: (data) => { this.proveedores = data; },
      error: () => this.alertas.error('Error', 'No se pudieron cargar los proveedores')
    });
  }

  cargarInsumos(): void {
    this.ordenCompraService.obtenerInsumos().subscribe({
      next: (data) => { this.insumos = data; this.insumosDisponibles = data; },
      error: () => this.alertas.error('Error', 'No se pudieron cargar los insumos')
    });
    this.insumosService.getTiposInsumo().subscribe({
      next: (data) => { this.tiposInsumo = data; }
    });
  }

  onInsumoChange(): void {
    if (!this.insumoSeleccionado) { this.precioUnitarioInsumo = 0; return; }
    const insumo = this.insumos.find(i => i.idInsumo === this.insumoSeleccionado);
    if (insumo?.precioUnitario) {
      this.precioUnitarioInsumo = insumo.precioUnitario;
    }
  }
  agregarInsumo(): void {
    if (this.cantidadInsumo <= 0 || this.precioUnitarioInsumo <= 0) {
      this.alertas.error('Datos incompletos', 'Cantidad y precio deben ser mayores a 0');
      return;
    }

    if (this.modoAgregar === 'existente') {
      if (!this.insumoSeleccionado) {
        this.alertas.error('Datos incompletos', 'Seleccioná un insumo');
        return;
      }      if (this.detalles.find(d => d.idInsumo === this.insumoSeleccionado)) {
        this.alertas.error('Duplicado', 'Este insumo ya fue agregado');
        return;
      }
      const subtotal = this.cantidadInsumo * this.precioUnitarioInsumo;
      this.detalles.push({
        idInsumo: this.insumoSeleccionado,
        cantidad: this.cantidadInsumo,
        precioUnitario: this.precioUnitarioInsumo,
        subtotal
      });
    } else {
      if (!this.nuevoNombre.trim()) {
        this.alertas.error('Datos incompletos', 'Ingresá el nombre del insumo');
        return;
      }
      if (!this.nuevoIdTipo) {
        this.alertas.error('Datos incompletos', 'Seleccioná el tipo de insumo');
        return;
      }
      const colorNorm = this.nuevoColor.trim().toUpperCase() || undefined;
      const subtotal = this.cantidadInsumo * this.precioUnitarioInsumo;
      this.detalles.push({
        idInsumo: 0,
        cantidad: this.cantidadInsumo,
        precioUnitario: this.precioUnitarioInsumo,
        subtotal,
        nuevoNombreInsumo: this.nuevoNombre.trim(),
        nuevoIdTipoInsumo: this.nuevoIdTipo,
        nuevoColor: colorNorm,
        nuevoUnidadMedida: this.nuevoUnidad
      });
    }

    // Reset campos
    this.insumoSeleccionado = undefined;
    this.insumoSeleccionadoObj = undefined;
    this.busquedaNombreInsumo = '';
    this.busquedaIdInsumo = undefined;
    this.cantidadInsumo = 1;
    this.precioUnitarioInsumo = 0;
    this.nuevoNombre = '';
    this.nuevoColor = '';
    this.nuevoIdTipo = undefined;
  }

  eliminarInsumo(index: number): void {
    this.detalles.splice(index, 1);
  }

  get totalOrden(): number {
    return this.detalles.reduce((sum, d) => sum + d.subtotal, 0);
  }

  obtenerNombreDetalle(d: DetalleOrdenCompraDTO): string {
    if (d.idInsumo === 0) {
      const color = d.nuevoColor ? ` — ${d.nuevoColor}` : '';
      return `${d.nuevoNombreInsumo}${color} (NUEVO)`;
    }
    const insumo = this.insumos.find(i => i.idInsumo === d.idInsumo);
    if (!insumo) return 'Desconocido';
    return insumo.color ? `${insumo.nombreInsumo} — ${insumo.color}` : insumo.nombreInsumo;
  }

  async guardarOrden(): Promise<void> {
    if (!this.idProveedorSeleccionado || !this.fechaSolicitud) {
      this.alertas.error('Datos incompletos', 'Complete todos los campos obligatorios');
      return;
    }
    if (this.detalles.length === 0) {
      this.alertas.error('Sin insumos', 'Debe agregar al menos un insumo');
      return;
    }

    const nuevaOrden: NuevaOrdenCompra = {
      idProveedor: this.idProveedorSeleccionado,
      idProyecto: this.idProyectoSeleccionado || undefined,
      descripcion: this.descripcion || undefined,
      fechaSolicitud: this.fechaSolicitud,
      fechaEntregaEstimada: this.fechaEntregaEstimada || undefined,
      totalOrden: this.totalOrden,
      detalles: this.detalles
    };

    this.cargando = true;
    this.ordenCompraService.crearOrden(nuevaOrden).subscribe({
      next: () => {
        this.cargando = false;
        this.alertas.success('Pedido creado', 'La nota de pedido se creó correctamente');
        this.ordenCreada.emit();
        this.cerrarFormulario();
      },
      error: (err) => {
        this.cargando = false;
        const msg = err.error?.message || err.error?.error || 'Error desconocido';
        this.alertas.error('Error', `No se pudo crear el pedido: ${msg}`);
      }
    });
  }

  cerrarFormulario(): void {
    this.cerrar.emit();
  }
}
