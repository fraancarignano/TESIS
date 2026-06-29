import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProyectosService } from '../../../proyectos/services/proyecto.service';
import { ProyectosServiceNuevo } from '../../../proyectos/services/proyectos-nuevo.service';
import { OrdenCompraService } from '../../../orden-compra/services/orden-compra.service';
import { NotificacionesService } from '../../../../core/services/notificaciones.service';
import { Proyecto, filtrarProyectosParaAsignacion } from '../../../proyectos/models/proyecto.model';


interface MaterialRow {
  idMaterialCalculado: number;
  idInsumo: number;
  idTipoInsumo: number;
  nombreInsumo: string;
  tipoInsumo: string;
  /** Color registrado en Gestión de insumos — fuente única de verdad. Nunca derivado ni transformado. */
  colorInsumo: string;
  /** Color solicitado en la prenda del proyecto. Puede ser vacío si no fue especificado. */
  colorSolicitado: string;
  cantidadNecesaria: number;
  unidadMedida: string;
  stockDisponible: number;
  tieneStockSuficiente: boolean;
  cantidadAAsignar: number;
  precioUnitario?: number;
  esMaterialExtra: boolean;
  idProyectoPrenda?: number;
  nombrePrenda?: string;
  seleccionado: boolean;
}

interface ItemOC {
  idMaterialCalculado?: number;
  idInsumo: number;
  nombreInsumo: string;
  colorSolicitado: string;
  cantidad: number;
  precioUnitario: number;
  nuevoIdTipoInsumo?: number;
  nuevoUnidadMedida?: string;
  esMaterialExtra?: boolean;
  idProyectoPrenda?: number;
  nombrePrenda?: string;
}

@Component({
  selector: 'app-proyecto-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proyecto-transfer.component.html',
  styleUrls: ['./proyecto-transfer.component.css']
})
export class ProyectoTransferComponent implements OnInit {

  proyectos: Proyecto[] = [];
  proveedores: any[] = [];

  idProyectoSeleccionado: number | null = null;
  idSolicitudOrigen: number | null = null;
  proyectoActual: Proyecto | null = null;
  busquedaProyecto = '';
  proyectosFiltrados: Proyecto[] = [];
  mostrarResultadosProyecto = false;

  materiales: MaterialRow[] = [];

  cargando = false;
  cargandoMateriales = false;
  mensaje = '';
  mensajeTipo: 'ok' | 'error' | '' = '';
  materialesListos = false;
  iniciandoProyecto = false;

  // Panel OC
  mostrarPanelOC = false;
  itemsOC: ItemOC[] = [];
  idProveedorOC: number | null = null;
  fechaEntregaOC = '';
  generandoOC = false;

  constructor(
    private proyectosService: ProyectosService,
    private proyectosServiceNuevo: ProyectosServiceNuevo,
    private ordenCompraService: OrdenCompraService,
    private notificacionesService: NotificacionesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatosBase();
    this.route.queryParams.subscribe(params => {
      if (params['proyecto']) this.idProyectoSeleccionado = Number(params['proyecto']);
      if (params['solicitud']) this.idSolicitudOrigen = Number(params['solicitud']);
    });
  }

  cargarDatosBase(): void {
    this.cargando = true;
    forkJoin({
      proyectos: this.proyectosService.obtenerProyectos(),
      proveedores: this.ordenCompraService.obtenerProveedores()
    }).subscribe({
      next: ({ proyectos, proveedores }) => {
        this.proyectos = filtrarProyectosParaAsignacion(proyectos as any[]);
        this.proveedores = proveedores;
        this.cargando = false;
        this.sincronizarProyectoDesdeQuery();
      },
      error: () => { this.mostrarMensaje('Error al cargar datos', 'error'); this.cargando = false; }
    });
  }

  onProyectoChange(): void {
    if (!this.idProyectoSeleccionado) { this.materiales = []; this.proyectoActual = null; return; }
    this.proyectoActual = this.proyectos.find(p => p.idProyecto === Number(this.idProyectoSeleccionado)) || null;
    this.cargarMateriales();
  }

  onBusquedaProyectoChange(): void {
    if (this.idProyectoSeleccionado) {
      const label = this.obtenerLabelProyecto(this.proyectoActual);
      if (this.busquedaProyecto !== label) {
        this.idProyectoSeleccionado = null;
        this.proyectoActual = null;
        this.materiales = [];
      }
    }

    const term = this.busquedaProyecto.trim().toLowerCase();
    if (!term) {
      this.proyectosFiltrados = [];
      this.mostrarResultadosProyecto = false;
      return;
    }

    this.proyectosFiltrados = this.proyectos.filter(p =>
      p.nombreProyecto?.toLowerCase().includes(term) ||
      p.codigoProyecto?.toLowerCase().includes(term) ||
      p.clienteNombre?.toLowerCase().includes(term) ||
      p.estado?.toLowerCase().includes(term) ||
      p.idProyecto?.toString().includes(term)
    );
    this.mostrarResultadosProyecto = this.proyectosFiltrados.length > 0;
  }

  seleccionarProyecto(p: Proyecto): void {
    this.idProyectoSeleccionado = p.idProyecto ?? null;
    this.busquedaProyecto = this.obtenerLabelProyecto(p);
    this.mostrarResultadosProyecto = false;
    this.proyectosFiltrados = [];
    this.onProyectoChange();
  }

  limpiarProyecto(): void {
    this.idProyectoSeleccionado = null;
    this.proyectoActual = null;
    this.busquedaProyecto = '';
    this.materiales = [];
    this.mostrarResultadosProyecto = false;
    this.proyectosFiltrados = [];
  }

  private obtenerLabelProyecto(p: Proyecto | null): string {
    if (!p) return '';
    return `${p.nombreProyecto} (${p.codigoProyecto || '—'}) — ${p.estado}`;
  }

  private sincronizarProyectoDesdeQuery(): void {
    if (!this.idProyectoSeleccionado || !this.proyectos.length) return;
    const p = this.proyectos.find(x => x.idProyecto === Number(this.idProyectoSeleccionado));
    if (p) {
      this.busquedaProyecto = this.obtenerLabelProyecto(p);
      this.onProyectoChange();
    }
  }

  cargarMateriales(): void {
    if (!this.idProyectoSeleccionado) return;
    this.cargandoMateriales = true;
    this.materiales = [];

    this.proyectosService.obtenerProyectoPorId(Number(this.idProyectoSeleccionado)).subscribe({
      next: (proyecto: any) => {
        this.materiales = (proyecto.materiales || []).map((m: any): MaterialRow => {
          const necesario = Number(m.cantidadFinal ?? m.cantidadNecesaria ?? 0);
          // Si hay un idInsumo explícito, usar su stock directamente.
          const stock = Number(m.stockActual ?? 0);
          const tieneStock = stock >= necesario;
          const esExtra = m.tipoCalculo === 'Extra';
          return {
            idMaterialCalculado: Number(m.idMaterialCalculado ?? 0),
            idInsumo: m.idInsumo,
            idTipoInsumo: m.idTipoInsumo ?? 0,
            nombreInsumo: m.nombreInsumo,
            tipoInsumo: m.tipoInsumo || '',
            // Fuente única de verdad: colorInsumo viene directamente de Gestión de insumos,
            // sin transformaciones ni derivaciones en el frontend.
            colorInsumo: m.colorInsumo ?? '',
            colorSolicitado: m.colorSolicitado ?? '',
            cantidadNecesaria: necesario,
            unidadMedida: m.unidadMedida || '',
            stockDisponible: stock,
            tieneStockSuficiente: tieneStock,
            cantidadAAsignar: tieneStock ? necesario : 0,
            precioUnitario: m.precioUnitario,
            esMaterialExtra: esExtra,
            idProyectoPrenda: m.idProyectoPrenda,
            nombrePrenda: m.nombrePrenda,
            seleccionado: !esExtra && tieneStock
          };
        });
        this.cargandoMateriales = false;
        this.verificarListos();
      },
      error: () => { this.mostrarMensaje('Error al cargar materiales', 'error'); this.cargandoMateriales = false; }
    });
  }

  // ── GETTERS ───────────────────────────────────────────────────

  get conStock(): MaterialRow[] {
    return this.materiales.filter(m => !m.esMaterialExtra && m.tieneStockSuficiente);
  }
  get sinStock(): MaterialRow[] {
    return this.materiales.filter(m => !m.esMaterialExtra && !m.tieneStockSuficiente);
  }
  get materialesExtra(): MaterialRow[] {
    return this.materiales.filter(m => m.esMaterialExtra);
  }
  get todosListos(): boolean { return this.materiales.length > 0 && this.materialesListos && this.proyectoActual?.estado === 'Pendiente'; }
  get totalOC(): number { return this.itemsOC.reduce((a, i) => a + i.cantidad * i.precioUnitario, 0); }

  materialExcedeStock(material: MaterialRow): boolean {
    return material.cantidadAAsignar > material.stockDisponible;
  }

  onCantidadAsignarChange(material: MaterialRow): void {
    material.cantidadAAsignar = Number(material.cantidadAAsignar || 0);
    if (material.cantidadAAsignar < 0) {
      material.cantidadAAsignar = 0;
    }
  }

  // ── ASIGNAR AL PROYECTO ───────────────────────────────────────

  asignarAlProyecto(): void {
    const aAsignar = [
      ...this.conStock.filter(m => m.seleccionado && m.cantidadAAsignar > 0),
      ...this.materialesExtra.filter(m =>
        m.seleccionado &&
        m.cantidadAAsignar > 0 &&
        m.stockDisponible >= m.cantidadAAsignar
      )
    ];
    const conError = [
      ...this.conStock.filter(m => m.seleccionado && this.materialExcedeStock(m)),
      ...this.materialesExtra.filter(m => m.seleccionado && this.materialExcedeStock(m))
    ];
    if (conError.length) {
      this.mostrarMensaje('La cantidad que tratás de ingresar es mayor al stock disponible.', 'error');
      return;
    }
    if (!aAsignar.length) { this.mostrarMensaje('No hay materiales seleccionados para asignar', 'error'); return; }

    this.cargando = true;
    this.proyectosServiceNuevo.asignarMaterialesAlProyecto(
      Number(this.idProyectoSeleccionado),
      aAsignar.map(m => ({
        idInsumo: m.idInsumo,
        cantidad: m.cantidadAAsignar,
        idMaterialCalculado: m.idMaterialCalculado,
        idProyectoPrenda: m.idProyectoPrenda,
        esMaterialExtra: m.esMaterialExtra
      }))
    ).subscribe({
      next: (res: any) => {
        const detalle = Array.isArray(res?.detalle) ? res.detalle : [];
        const errores = detalle.filter((d: any) => !!d?.error);
        const omitidos = detalle.filter((d: any) => typeof d?.info === 'string' && d.info.toLowerCase().includes('omit'));

        if (errores.length > 0) {
          this.mostrarMensaje(errores[0]?.error || 'No se pudieron asignar algunos materiales', 'error');
        } else if (detalle.length > 0 && omitidos.length === detalle.length) {
          this.mostrarMensaje('Materiales ya estaban asignados.', 'ok');
        } else {
          this.mostrarMensaje('Materiales asignados correctamente.', 'ok');
        }
        this.cargando = false;
        const solicitudId = this.idSolicitudOrigen;
        if (solicitudId) {
          this.notificacionesService.atenderSolicitud(solicitudId).subscribe({
            next: () => { this.idSolicitudOrigen = null; },
            error: () => {}
          });
        }
        this.cargarMateriales();
      },
      error: (err: any) => {
        const msg = err?.error?.message || err?.error?.detalle || 'Error al asignar materiales';
        this.mostrarMensaje(msg, 'error');
        this.cargando = false;
      }
    });
  }

  // ── GENERAR OC ────────────────────────────────────────────────

  abrirPanelOC(): void {
    const materialesParaPedido = [
      ...this.sinStock,
      ...this.materialesExtra
    ];

    if (!materialesParaPedido.length) { this.mostrarMensaje('No hay materiales para pedir', 'error'); return; }
    this.itemsOC = materialesParaPedido.map(m => {
      // Para materiales extra, la cantidad inicial es 0 (el usuario debe ingresarla manualmente)
      // Para materiales principales, calculamos el faltante
      const cantidadInicial = m.esMaterialExtra ? 0 : Math.max(0.01, m.cantidadNecesaria - m.stockDisponible);
      return {
        idMaterialCalculado: m.idMaterialCalculado,
        idInsumo: m.idInsumo || 0,
        nombreInsumo: m.nombreInsumo,
        // El color en la OC parte del color registrado en Gestión de insumos (fuente de verdad).
        // Si la prenda tiene un color solicitado distinto, se muestra ese; de lo contrario el del insumo.
        colorSolicitado: m.colorSolicitado || m.colorInsumo || '',
        cantidad: cantidadInicial,
        precioUnitario: m.precioUnitario || 0,
        nuevoIdTipoInsumo: m.idInsumo === 0 ? (m.idTipoInsumo || undefined) : undefined,
        nuevoUnidadMedida: m.unidadMedida,
        esMaterialExtra: m.esMaterialExtra,
        idProyectoPrenda: m.idProyectoPrenda,
        nombrePrenda: m.nombrePrenda
      };
    });
    this.idProveedorOC = null;
    this.fechaEntregaOC = '';
    this.mostrarPanelOC = true;
  }

  cerrarPanelOC(): void { this.mostrarPanelOC = false; }

  quitarItemOC(index: number): void {
    this.itemsOC.splice(index, 1);
  }

  generarOrdenCompra(): void {
    if (!this.idProveedorOC) { this.mostrarMensaje('Seleccioná un proveedor', 'error'); return; }
    if (!this.itemsOC.length) { this.mostrarMensaje('Agregá al menos un material al pedido', 'error'); return; }
    if (this.itemsOC.some(i => i.cantidad <= 0)) {
      this.mostrarMensaje('Completá la cantidad de los materiales extra o quitálos del pedido', 'error');
      return;
    }
    if (this.itemsOC.some(i => i.precioUnitario <= 0)) { this.mostrarMensaje('Completá el precio unitario', 'error'); return; }

    const coloresDetalle = this.itemsOC
      .filter(i => i.colorSolicitado)
      .map(i => `${i.nombreInsumo} ${i.colorSolicitado}`)
      .join(', ');

    const dto = {
      idProveedor: this.idProveedorOC,
      idProyecto: this.idProyectoSeleccionado,
      descripcion: `Proyecto: ${this.proyectoActual?.nombreProyecto || ''}` +
        (coloresDetalle ? ` | ${coloresDetalle}` : ''),
      fechaSolicitud: new Date().toISOString().split('T')[0],
      fechaEntregaEstimada: this.fechaEntregaOC || null,
      totalOrden: this.totalOC,
      detalles: this.itemsOC.map(i => {
        return {
          idInsumo: i.idInsumo,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          subtotal: i.cantidad * i.precioUnitario,
          // Si es insumo nuevo (idInsumo === 0), pasar los campos de creación
          nuevoNombreInsumo: i.idInsumo === 0 ? i.nombreInsumo : undefined,
          nuevoIdTipoInsumo: i.idInsumo === 0 ? i.nuevoIdTipoInsumo : undefined,
          nuevoColor: i.idInsumo === 0 ? (i.colorSolicitado || undefined) : undefined,
          nuevoUnidadMedida: i.idInsumo === 0 ? (i.nuevoUnidadMedida || 'Kg') : undefined,
          // Campos para materiales extra
          idProyecto: i.esMaterialExtra ? this.idProyectoSeleccionado : undefined,
          idProyectoPrenda: i.esMaterialExtra ? i.idProyectoPrenda : undefined,
          esMaterialExtra: i.esMaterialExtra || false
        };
      })
    };

    this.generandoOC = true;
    this.ordenCompraService.crearOrden(dto as any).subscribe({
      next: (oc: any) => {
        this.mostrarMensaje(`OC ${oc.nroOrden} creada. Una vez recibida podrás asignar los materiales.`, 'ok');
        this.generandoOC = false;
        this.mostrarPanelOC = false;
        this.cargarMateriales();
      },
      error: (err: any) => {
        this.mostrarMensaje(err?.error?.message || 'Error al crear la OC', 'error');
        this.generandoOC = false;
      }
    });
  }

  // ── INICIAR PROYECTO ──────────────────────────────────────────

  verificarListos(): void {
    if (!this.idProyectoSeleccionado) return;
    this.proyectosServiceNuevo.verificarMaterialesListos(Number(this.idProyectoSeleccionado)).subscribe({
      next: (res) => { this.materialesListos = res.listos; },
      error: () => { this.materialesListos = false; }
    });
  }

  iniciarProyecto(): void {
    if (!this.todosListos) {
      this.mostrarMensaje('Imposible iniciar proyecto, falta de materiales', 'error');
      return;
    }
    this.iniciandoProyecto = true;
    this.proyectosServiceNuevo.cambiarEstado(Number(this.idProyectoSeleccionado), 'En Proceso').subscribe({
      next: () => {
        this.mostrarMensaje('¡Proyecto iniciado! Estado: En Proceso.', 'ok');
        this.iniciandoProyecto = false;
        if (this.proyectoActual) (this.proyectoActual as any).estado = 'En Proceso';
        this.materialesListos = false;
      },
      error: (err: any) => {
        this.mostrarMensaje(err?.error?.message || 'Error al iniciar', 'error');
        this.iniciandoProyecto = false;
      }
    });
  }

  private mostrarMensaje(texto: string, tipo: 'ok' | 'error'): void {
    this.mensaje = texto;
    this.mensajeTipo = tipo;
    setTimeout(() => { this.mensaje = ''; this.mensajeTipo = ''; }, 6000);
  }
}
