import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { OrdenCompraService } from '../../../orden-compra/services/orden-compra.service';
import { UbicacionesService, Ubicacion } from '../../../ubicaciones/services/ubicaciones.service';
import { ProyectosService } from '../../../proyectos/services/proyecto.service';
import { ProyectosServiceNuevo } from '../../../proyectos/services/proyectos-nuevo.service';
import { NotificacionesService } from '../../../../core/services/notificaciones.service';
import { InsumosService } from '../../services/insumos.service';
import { OrdenCompra } from '../../../orden-compra/models/orden-compra.model';
import { Proyecto } from '../../../proyectos/models/proyecto.model';
import { Insumo } from '../../models/insumo.model';
import { AlertasService } from '../../../../core/services/alertas';

function normalizarColor(c?: string | null): string {
  if (!c) return '';
  return c.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

interface MaterialRow {
  idInsumo: number;
  idTipoInsumo: number;
  nombreInsumo: string;
  tipoInsumo: string;
  colorSolicitado: string;
  cantidadNecesaria: number;
  unidadMedida: string;
  stockDisponible: number;
  tieneStockSuficiente: boolean;
  cantidadAAsignar: number;
}

interface ItemOC {
  idInsumo: number;
  nombreInsumo: string;
  colorSolicitado: string;
  cantidad: number;
  precioUnitario: number;
  nuevoIdTipoInsumo?: number;
  nuevoUnidadMedida?: string;
}

@Component({
  selector: 'app-ubicacion-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ubicacion-transfer.component.html',
  styleUrls: ['./ubicacion-transfer.component.css']
})
export class UbicacionTransferComponent implements OnInit {

  tabActiva: 'oc-ubicacion' | 'ub-ub' | 'asignar-proyecto' = 'oc-ubicacion';

  // Datos comunes
  ordenesVerificadas: OrdenCompra[] = [];
  ubicaciones: Ubicacion[] = [];
  proyectos: Proyecto[] = [];
  proveedores: any[] = [];
  cargando = false;

  // ── TAB 1: OC → Ubicación ─────────────────────────────────────
  idOrdenOC: number | null = null;
  idUbicacionDestinoOC: number | null = null;
  insumosOC: (Insumo & { seleccionado: boolean })[] = [];
  todosSeleccionadosOC = false;

  // ── TAB 2: Ubicación → Ubicación ─────────────────────────────
  idUbicacionOrigen: number | null = null;
  idUbicacionDestino: number | null = null;
  insumosUB: (Insumo & { seleccionado: boolean })[] = [];
  todosSeleccionadosUB = false;

  // ── TAB 3: Asignar a Proyecto (lógica completa de proyecto-transfer) ──
  idProyectoSeleccionado: number | null = null;
  idSolicitudOrigen: number | null = null;
  proyectoActual: Proyecto | null = null;
  materiales: MaterialRow[] = [];
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

  // Mapa de precios por idInsumo (cargado del catálogo)
  private preciosInsumo: Map<number, number> = new Map();
  // Mapa de precios por tipo+color para insumos nuevos
  private preciosPorTipoColor: Map<string, number> = new Map();

  constructor(
    private ordenCompraService: OrdenCompraService,
    private ubicacionesService: UbicacionesService,
    private proyectosService: ProyectosService,
    private proyectosServiceNuevo: ProyectosServiceNuevo,
    private notificacionesService: NotificacionesService,
    private insumosService: InsumosService,
    private alertas: AlertasService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
    this.route.queryParams.subscribe(params => {
      if (params['proyecto']) {
        this.idProyectoSeleccionado = Number(params['proyecto']);
        this.tabActiva = 'asignar-proyecto';
        this.onProyectoChange();
      }
      if (params['solicitud']) this.idSolicitudOrigen = Number(params['solicitud']);
    });
  }

  cargarDatos(): void {
    this.cargando = true;
    // Cargar precios del catálogo
    this.insumosService.getInsumos().subscribe({
      next: (insumos) => {
        this.preciosInsumo.clear();
        this.preciosPorTipoColor.clear();
        insumos.forEach(i => {
          if (i.idInsumo && i.precioUnitario) {
            this.preciosInsumo.set(i.idInsumo, i.precioUnitario);
            // Indexar también por tipo+color para insumos nuevos
            const key = `${i.idTipoInsumo}_${(i.color || '').toUpperCase()}`;
            if (!this.preciosPorTipoColor.has(key)) this.preciosPorTipoColor.set(key, i.precioUnitario);
          }
        });
      }
    });
    forkJoin({
      ordenes: this.ordenCompraService.obtenerOrdenes(),
      ubicaciones: this.ubicacionesService.getUbicaciones(),
      proyectos: this.proyectosService.obtenerProyectos(),
      proveedores: this.ordenCompraService.obtenerProveedores()
    }).subscribe({
      next: ({ ordenes, ubicaciones, proyectos, proveedores }) => {
        this.ordenesVerificadas = (ordenes as OrdenCompra[]).filter(o => o.estado === 'Verificada');
        this.ubicaciones = ubicaciones;
        this.proyectos = (proyectos as any[]).filter(p =>
          p.estado !== 'Archivado' && p.estado !== 'Cancelado' && p.estado !== 'Finalizado'
        );
        this.proveedores = proveedores;
        this.cargando = false;
        if (this.idProyectoSeleccionado) this.onProyectoChange();
      },
      error: () => { this.cargando = false; }
    });
  }

  // ── TAB 1 ─────────────────────────────────────────────────────

  onOrdenOCChange(): void {
    if (!this.idOrdenOC) { this.insumosOC = []; return; }
    const orden = this.ordenesVerificadas.find(o => o.idOrdenCompra === this.idOrdenOC);
    if (orden?.detalles) {
      this.insumosOC = orden.detalles.map(d => ({
        idInsumo: d.idInsumo,
        nombreInsumo: d.nombreInsumo || '',
        stockActual: d.cantidad,
        seleccionado: true,
        nombreTipoInsumo: '',
        unidadMedida: '',
        idTipoInsumo: 0,
        fechaActualizacion: ''
      } as any));
      this.todosSeleccionadosOC = true;
    }
  }

  toggleTodosOC(): void {
    this.todosSeleccionadosOC = !this.todosSeleccionadosOC;
    this.insumosOC.forEach(i => i.seleccionado = this.todosSeleccionadosOC);
  }

  confirmarTransferenciaOC(): void {
    const ids = this.insumosOC.filter(i => i.seleccionado).map(i => i.idInsumo!);
    if (!ids.length) { this.alertas.error('Sin selección', 'Seleccioná al menos un insumo.'); return; }
    if (!this.idUbicacionDestinoOC) { this.alertas.error('Sin destino', 'Seleccioná una ubicación de destino.'); return; }

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    this.cargando = true;
    // Sin IdProyecto — esto es solo asignación de ubicación (stock general)
    this.ubicacionesService.transferirDesdeOrden({
      idOrdenCompra: this.idOrdenOC,
      idsInsumos: ids,
      idUbicacionDestino: this.idUbicacionDestinoOC,
      idUsuario: usuario.idUsuario || null
    }).subscribe({
      next: () => {
        this.alertas.success('Ingreso realizado', 'Los insumos ingresaron al stock general en la ubicación seleccionada.');
        this.idOrdenOC = null;
        this.idUbicacionDestinoOC = null;
        this.insumosOC = [];
        this.cargando = false;
        this.cargarDatos();
      },
      error: () => { this.alertas.error('Error', 'No se pudo realizar el ingreso.'); this.cargando = false; }
    });
  }

  // ── TAB 2 ─────────────────────────────────────────────────────

  onUbicacionOrigenChange(): void {
    if (!this.idUbicacionOrigen) { this.insumosUB = []; return; }
    this.cargando = true;
    this.ubicacionesService.getInsumosPorUbicacion(this.idUbicacionOrigen).subscribe({
      next: (insumos: Insumo[]) => {
        this.insumosUB = insumos.map(i => ({ ...i, seleccionado: true }));
        this.todosSeleccionadosUB = true;
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  toggleTodosUB(): void {
    this.todosSeleccionadosUB = !this.todosSeleccionadosUB;
    this.insumosUB.forEach(i => i.seleccionado = this.todosSeleccionadosUB);
  }

  confirmarTransferenciaUB(): void {
    const ids = this.insumosUB.filter(i => i.seleccionado).map(i => i.idInsumo!);
    if (!ids.length) { this.alertas.error('Sin selección', 'Seleccioná al menos un insumo.'); return; }
    if (!this.idUbicacionDestino) { this.alertas.error('Sin destino', 'Seleccioná una ubicación de destino.'); return; }
    if (this.idUbicacionOrigen === this.idUbicacionDestino) { this.alertas.error('Error', 'Origen y destino no pueden ser iguales.'); return; }

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    this.cargando = true;
    this.ubicacionesService.transferirDesdeOrden({
      idUbicacionOrigen: this.idUbicacionOrigen,
      idsInsumos: ids,
      idUbicacionDestino: this.idUbicacionDestino,
      idUsuario: usuario.idUsuario || null
    }).subscribe({
      next: () => {
        this.alertas.success('Transferencia realizada', 'Los insumos fueron movidos correctamente.');
        this.idUbicacionOrigen = null;
        this.idUbicacionDestino = null;
        this.insumosUB = [];
        this.cargando = false;
        this.cargarDatos();
      },
      error: () => { this.alertas.error('Error', 'No se pudo realizar la transferencia.'); this.cargando = false; }
    });
  }

  // ── TAB 3: Asignar a Proyecto (copia exacta de proyecto-transfer) ──

  onProyectoChange(): void {
    if (!this.idProyectoSeleccionado) { this.materiales = []; this.proyectoActual = null; return; }
    this.proyectoActual = this.proyectos.find(p => p.idProyecto === Number(this.idProyectoSeleccionado)) || null;
    this.cargarMateriales();
  }

  cargarMateriales(): void {
    if (!this.idProyectoSeleccionado) return;
    this.cargandoMateriales = true;
    this.materiales = [];
    this.proyectosService.obtenerProyectoPorId(Number(this.idProyectoSeleccionado)).subscribe({
      next: (proyecto: any) => {
        this.materiales = (proyecto.materiales || []).map((m: any): MaterialRow => {
          const necesario = Number(m.cantidadFinal ?? m.cantidadNecesaria ?? 0);
          const colorNorm = normalizarColor(m.colorSolicitado);
          const colorInsumoNorm = normalizarColor(m.colorInsumo);
          const colorCoincide = !colorNorm || colorInsumoNorm === colorNorm;
          const stock = colorCoincide ? Number(m.stockActual ?? 0) : 0;
          const tieneStock = stock >= necesario;
          return {
            idInsumo: m.idInsumo,
            idTipoInsumo: m.idTipoInsumo ?? 0,
            nombreInsumo: m.nombreInsumo,
            tipoInsumo: m.tipoInsumo || '',
            colorSolicitado: colorNorm,
            cantidadNecesaria: necesario,
            unidadMedida: m.unidadMedida || '',
            stockDisponible: stock,
            tieneStockSuficiente: tieneStock,
            cantidadAAsignar: tieneStock ? necesario : 0
          };
        });
        this.cargandoMateriales = false;
        this.verificarListos();
      },
      error: () => { this.mostrarMensaje('Error al cargar materiales', 'error'); this.cargandoMateriales = false; }
    });
  }

  get conStock(): MaterialRow[] { return this.materiales.filter(m => m.tieneStockSuficiente); }
  get sinStock(): MaterialRow[] { return this.materiales.filter(m => !m.tieneStockSuficiente); }
  get todosListos(): boolean { return this.materiales.length > 0 && this.materialesListos && this.proyectoActual?.estado === 'Pendiente'; }
  get totalOC(): number { return this.itemsOC.reduce((a, i) => a + i.cantidad * i.precioUnitario, 0); }

  asignarAlProyecto(): void {
    const aAsignar = this.conStock.filter(m => m.cantidadAAsignar > 0);
    if (!aAsignar.length) { this.mostrarMensaje('No hay materiales seleccionados para asignar', 'error'); return; }
    this.cargando = true;
    this.proyectosServiceNuevo.asignarMaterialesAlProyecto(
      Number(this.idProyectoSeleccionado),
      aAsignar.map(m => ({ idInsumo: m.idInsumo, cantidad: m.cantidadAAsignar }))
    ).subscribe({
      next: (res: any) => {
        this.mostrarMensaje('Materiales asignados correctamente.', 'ok');
        this.cargando = false;
        if (this.idSolicitudOrigen) {
          this.notificacionesService.atenderSolicitud(this.idSolicitudOrigen).subscribe();
        }
        this.cargarMateriales();
      },
      error: (err: any) => {
        this.mostrarMensaje(err?.error?.message || err?.error?.detalle || 'Error al asignar materiales', 'error');
        this.cargando = false;
      }
    });
  }

  abrirPanelOC(): void {
    if (!this.sinStock.length) { this.mostrarMensaje('No hay materiales faltantes', 'error'); return; }
    this.itemsOC = this.sinStock.map(m => {
      let precio = 0;
      if (!m.colorSolicitado && m.idInsumo > 0) {
        // Insumo existente sin color → buscar por ID
        precio = this.preciosInsumo.get(m.idInsumo) ?? 0;
      } else if (m.colorSolicitado && m.idTipoInsumo > 0) {
        // Insumo con color → buscar por tipo+color
        const key = `${m.idTipoInsumo}_${m.colorSolicitado.toUpperCase()}`;
        precio = this.preciosPorTipoColor.get(key) ?? 0;
      }
      return {
        idInsumo: m.colorSolicitado ? 0 : m.idInsumo,
        nombreInsumo: m.tipoInsumo || m.nombreInsumo,
        colorSolicitado: m.colorSolicitado || '',
        cantidad: Math.max(0.01, m.cantidadNecesaria - m.stockDisponible),
        precioUnitario: precio,
        nuevoIdTipoInsumo: m.colorSolicitado ? (m.idTipoInsumo || undefined) : undefined,
        nuevoUnidadMedida: m.unidadMedida
      };
    });
    this.idProveedorOC = null;
    this.fechaEntregaOC = '';
    this.mostrarPanelOC = true;
  }

  cerrarPanelOC(): void { this.mostrarPanelOC = false; }

  generarOrdenCompra(): void {
    if (!this.idProveedorOC) { this.mostrarMensaje('Seleccioná un proveedor', 'error'); return; }
    if (this.itemsOC.some(i => i.precioUnitario <= 0)) { this.mostrarMensaje('Completá el precio unitario', 'error'); return; }

    const coloresDetalle = this.itemsOC.filter(i => i.colorSolicitado).map(i => `${i.nombreInsumo} ${i.colorSolicitado}`).join(', ');
    const dto = {
      idProveedor: this.idProveedorOC,
      idProyecto: this.idProyectoSeleccionado || undefined,
      descripcion: `Proyecto: ${this.proyectoActual?.nombreProyecto || ''}` + (coloresDetalle ? ` | ${coloresDetalle}` : ''),
      fechaSolicitud: new Date().toISOString().split('T')[0],
      fechaEntregaEstimada: this.fechaEntregaOC || null,
      totalOrden: this.totalOC,
      detalles: this.itemsOC.map(i => ({
        idInsumo: i.idInsumo,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
        subtotal: i.cantidad * i.precioUnitario,
        nuevoNombreInsumo: i.idInsumo === 0 ? i.nombreInsumo : undefined,
        nuevoIdTipoInsumo: i.idInsumo === 0 ? i.nuevoIdTipoInsumo : undefined,
        nuevoColor: i.idInsumo === 0 ? (i.colorSolicitado || undefined) : undefined,
        nuevoUnidadMedida: i.idInsumo === 0 ? (i.nuevoUnidadMedida || 'Kg') : undefined
      }))
    };

    this.generandoOC = true;
    this.ordenCompraService.crearOrden(dto as any).subscribe({
      next: (oc: any) => {
        this.mostrarMensaje(`OC ${oc.nroOrden} creada. Una vez recibida y verificada podrás ingresar los materiales.`, 'ok');
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

  verificarListos(): void {
    if (!this.idProyectoSeleccionado) return;
    this.proyectosServiceNuevo.verificarMaterialesListos(Number(this.idProyectoSeleccionado)).subscribe({
      next: (res) => { this.materialesListos = res.listos; },
      error: () => { this.materialesListos = false; }
    });
  }

  iniciarProyecto(): void {
    if (!this.todosListos) return;
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
