import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { OrdenCompraService } from '../../../orden-compra/services/orden-compra.service';
import { UbicacionesService, Ubicacion, ScrapProyectoInsumo } from '../../../ubicaciones/services/ubicaciones.service';
import { ProyectosService } from '../../../proyectos/services/proyecto.service';
import { ProyectosServiceNuevo } from '../../../proyectos/services/proyectos-nuevo.service';
import { NotificacionesService } from '../../../../core/services/notificaciones.service';
import { InsumosService } from '../../services/insumos.service';
import { OrdenCompra } from '../../../orden-compra/models/orden-compra.model';
import { Proyecto, filtrarProyectosParaAsignacion } from '../../../proyectos/models/proyecto.model';
import { Insumo } from '../../models/insumo.model';
import { AlertasService } from '../../../../core/services/alertas';

function normalizarColor(c?: string | null): string {
  if (!c) return '';
  return c.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

interface MaterialRow {
  idMaterialCalculado: number;
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

type InsumoOCTransfer = Insumo & {
  seleccionado: boolean;
  cantidadPedida: number;
  cantidadAIngresar: number;
  estadoRecepcion?: string;
};

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

  // ── FILTRADO DE UBICACIONES ────────────────────────────────────

  get ubicacionesDestinoDisponibles(): Ubicacion[] {
    // Destino de pedido → solo tipo Rack (código RCK), excluyendo Despacho, Scrap y cualquier otro tipo.
    // Dentro de Rack: solo estado Activa. Ocupado, BloqIN y cualquier otro estado se excluyen.
    return this.ubicaciones.filter(u =>
      u.tipo === 'Rack' &&
      u.estadoUbicacion === 'Activa'
    );
  }

  get ubicacionesOrigenDisponibles(): Ubicacion[] {
    // Para origen: NO mostrar BloqOUT ni Ocupadas
    return this.ubicaciones.filter(u => u.estadoUbicacion !== 'BloqOUT' && u.estadoUbicacion !== 'Ocupado');
  }

  // ── TAB 1: OC → Ubicación ─────────────────────────────────────
  idOrdenOC: number | null = null;
  idUbicacionDestinoOC: number | null = null;
  insumosOC: InsumoOCTransfer[] = [];
  todosSeleccionadosOC = false;

  // ── TAB 2: Ubicación → Ubicación ─────────────────────────────
  idUbicacionOrigen: number | null = null;
  idUbicacionDestino: number | null = null;
  insumosUB: (Insumo & { seleccionado: boolean })[] = [];
  todosSeleccionadosUB = false;
  modoEntreUbicaciones: 'ubicacion' | 'proyecto-scrap' | 'scrap-proyecto' = 'ubicacion';
  idProyectoScrapSeleccionado: number | null = null;
  proyectoScrapActual: Proyecto | null = null;
  busquedaProyectoScrap = '';
  proyectosScrapFiltrados: Proyecto[] = [];
  mostrarResultadosProyectoScrap = false;
  insumosScrap: ScrapProyectoInsumo[] = [];
  cargandoInsumosScrap = false;
  motivosScrap = ['Rotura', 'Desperfecto de Origen', 'Mal estado'];

  // ── TAB 3: Asignar a Proyecto (lógica completa de proyecto-transfer) ──
  idProyectoSeleccionado: number | null = null;
  idSolicitudOrigen: number | null = null;
  proyectoActual: Proyecto | null = null;
  busquedaProyecto = '';
  proyectosFiltrados: Proyecto[] = [];
  mostrarResultadosProyecto = false;
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
      if (params['tab'] === 'asignar-proyecto') {
        this.tabActiva = 'asignar-proyecto';
      }
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
        this.proyectos = filtrarProyectosParaAsignacion(proyectos as any[]);
        this.proveedores = proveedores;
        this.cargando = false;
        this.sincronizarProyectoDesdeQuery();
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
        stockActual: Number(d.cantidadRecibida ?? 0),
        cantidadPedida: Number(d.cantidad ?? 0),
        cantidadAIngresar: Number(d.cantidadRecibida ?? 0),
        estadoRecepcion: d.estadoRecepcion,
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

  async confirmarTransferenciaOC(): Promise<void> {
    const ids = this.insumosOC.filter(i => i.seleccionado).map(i => i.idInsumo!);
    if (!ids.length) { this.alertas.error('Sin selección', 'Seleccioná al menos un insumo.'); return; }
    if (!this.idUbicacionDestinoOC) { this.alertas.error('Sin destino', 'Seleccioná una ubicación de destino.'); return; }

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const ubicacionDestino = this.ubicaciones.find(u => u.idUbicacion === this.idUbicacionDestinoOC);
    
    this.cargando = true;
    this.ubicacionesService.transferirDesdeOrden({
      idOrdenCompra: this.idOrdenOC,
      idsInsumos: ids,
      idUbicacionDestino: this.idUbicacionDestinoOC,
      idUsuario: usuario.idUsuario || null
    }).subscribe({
      next: async () => {
        this.cargando = false;

        // POPUP SUGERENCIA OCUPADO
        const confirmarOcupado = await this.alertas.confirmar(
          '¿Marcar como Ocupada?',
          `Los insumos fueron ingresados a [${ubicacionDestino?.codigo}]. \n\n¿Desea cambiar el estado de esta ubicación a "Ocupado" para evitar nuevos ingresos?`,
          'Sí, marcar'
        );
        if (confirmarOcupado) {
          this.ubicacionesService.cambiarEstadoUbicacion(this.idUbicacionDestinoOC!, 'Ocupado').subscribe();
        }

        this.alertas.success('Ingreso realizado', 'Los insumos ingresaron al stock general.');
        this.idOrdenOC = null;
        this.idUbicacionDestinoOC = null;
        this.insumosOC = [];
        this.cargarDatos();
      },
      error: (err) => { 
        this.alertas.error('Error', err.error?.message || 'No se pudo realizar el ingreso.'); 
        this.cargando = false; 
      }
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

  setModoEntreUbicaciones(modo: 'ubicacion' | 'proyecto-scrap' | 'scrap-proyecto'): void {
    this.modoEntreUbicaciones = modo;
    if (modo !== 'ubicacion') {
      this.idUbicacionOrigen = null;
      this.idUbicacionDestino = null;
      this.insumosUB = [];
    }
    this.limpiarProyectoScrap();
  }

  async confirmarTransferenciaUB(): Promise<void> {
    const ids = this.insumosUB.filter(i => i.seleccionado).map(i => i.idInsumo!);
    if (!ids.length) { this.alertas.error('Sin selección', 'Seleccioná al menos un insumo.'); return; }
    if (!this.idUbicacionDestino) { this.alertas.error('Sin destino', 'Seleccioná una ubicación de destino.'); return; }
    if (this.idUbicacionOrigen === this.idUbicacionDestino) { this.alertas.error('Error', 'Origen y destino no pueden ser iguales.'); return; }

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const ubicacionDestino = this.ubicaciones.find(u => u.idUbicacion === this.idUbicacionDestino);

    this.cargando = true;
    this.ubicacionesService.transferirDesdeOrden({
      idUbicacionOrigen: this.idUbicacionOrigen,
      idsInsumos: ids,
      idUbicacionDestino: this.idUbicacionDestino,
      idUsuario: usuario.idUsuario || null
    }).subscribe({
      next: async () => {
        this.cargando = false;

        // POPUP SUGERENCIA OCUPADO
        const confirmarOcupado = await this.alertas.confirmar(
          '¿Marcar como Ocupada?',
          `Transferencia completada a [${ubicacionDestino?.codigo}]. \n\n¿Desea marcar la ubicación destino como "Ocupada"?`,
          'Sí, marcar'
        );
        if (confirmarOcupado) {
          this.ubicacionesService.cambiarEstadoUbicacion(this.idUbicacionDestino!, 'Ocupado').subscribe();
        }

        this.alertas.success('Transferencia realizada', 'Los insumos fueron movidos correctamente.');
        this.idUbicacionOrigen = null;
        this.idUbicacionDestino = null;
        this.insumosUB = [];
        this.cargarDatos();
      },
      error: (err) => { 
        this.alertas.error('Error', err.error?.message || 'No se pudo realizar la transferencia.'); 
        this.cargando = false; 
      }
    });
  }


  // ── TAB 3: Asignar a Proyecto (copia exacta de proyecto-transfer) ──

  onBusquedaProyectoScrapChange(): void {
    if (this.idProyectoScrapSeleccionado) {
      const label = this.obtenerLabelProyecto(this.proyectoScrapActual);
      if (this.busquedaProyectoScrap !== label) {
        this.idProyectoScrapSeleccionado = null;
        this.proyectoScrapActual = null;
        this.insumosScrap = [];
      }
    }

    const term = this.busquedaProyectoScrap.trim().toLowerCase();
    if (!term) {
      this.proyectosScrapFiltrados = [];
      this.mostrarResultadosProyectoScrap = false;
      return;
    }

    this.proyectosScrapFiltrados = this.proyectos.filter(p =>
      p.nombreProyecto?.toLowerCase().includes(term) ||
      p.codigoProyecto?.toLowerCase().includes(term) ||
      p.clienteNombre?.toLowerCase().includes(term) ||
      p.estado?.toLowerCase().includes(term) ||
      p.idProyecto?.toString().includes(term)
    );
    this.mostrarResultadosProyectoScrap = this.proyectosScrapFiltrados.length > 0;
  }

  seleccionarProyectoScrap(p: Proyecto): void {
    this.idProyectoScrapSeleccionado = p.idProyecto ?? null;
    this.proyectoScrapActual = p;
    this.busquedaProyectoScrap = this.obtenerLabelProyecto(p);
    this.mostrarResultadosProyectoScrap = false;
    this.proyectosScrapFiltrados = [];
    this.cargarInsumosScrap();
  }

  limpiarProyectoScrap(): void {
    this.idProyectoScrapSeleccionado = null;
    this.proyectoScrapActual = null;
    this.busquedaProyectoScrap = '';
    this.proyectosScrapFiltrados = [];
    this.mostrarResultadosProyectoScrap = false;
    this.insumosScrap = [];
  }

  cargarInsumosScrap(): void {
    if (!this.idProyectoScrapSeleccionado) { this.insumosScrap = []; return; }

    this.cargandoInsumosScrap = true;
    const request$ = this.modoEntreUbicaciones === 'scrap-proyecto'
      ? this.ubicacionesService.getScrapsProyectoParaTransferencia(this.idProyectoScrapSeleccionado)
      : this.ubicacionesService.getInsumosProyectoParaScrap(this.idProyectoScrapSeleccionado);

    request$.subscribe({
      next: (items) => {
        this.insumosScrap = (items || []).map(i => ({
          ...i,
          cantidadTransferir: 0,
          motivo: this.modoEntreUbicaciones === 'scrap-proyecto' ? 'Reingreso desde scrap' : ''
        }));
        this.cargandoInsumosScrap = false;
      },
      error: () => {
        this.alertas.error('Error', 'No se pudieron cargar los insumos del proyecto.');
        this.cargandoInsumosScrap = false;
      }
    });
  }

  onCantidadScrapChange(item: ScrapProyectoInsumo): void {
    item.cantidadTransferir = Number(item.cantidadTransferir || 0);
    if (item.cantidadTransferir < 0) item.cantidadTransferir = 0;
    if (item.cantidadTransferir > item.cantidadAsignada) {
      item.cantidadTransferir = item.cantidadAsignada;
    }
  }

  confirmarTransferenciaScrap(): void {
    if (!this.idProyectoScrapSeleccionado) {
      this.alertas.error('Sin proyecto', 'SeleccionÃ¡ un proyecto.');
      return;
    }

    const items = this.insumosScrap
      .filter(i => Number(i.cantidadTransferir || 0) > 0)
      .map(i => ({
        idInsumo: i.idInsumo,
        cantidad: Number(i.cantidadTransferir),
        motivo: i.motivo
      }));

    if (!items.length) {
      this.alertas.error('Sin cantidades', 'IngresÃ¡ al menos una cantidad mayor a cero.');
      return;
    }

    if (this.modoEntreUbicaciones === 'proyecto-scrap' && items.some(i => !i.motivo)) {
      this.alertas.error('Motivo obligatorio', 'SeleccionÃ¡ un motivo para cada insumo a transferir.');
      return;
    }

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const dto = {
      idProyecto: this.idProyectoScrapSeleccionado,
      idUsuario: usuario.idUsuario || null,
      items
    };

    this.cargando = true;
    const request$ = this.modoEntreUbicaciones === 'scrap-proyecto'
      ? this.ubicacionesService.transferirScrapAProyecto(dto)
      : this.ubicacionesService.transferirProyectoAScrap(dto);

    request$.subscribe({
      next: () => {
        const titulo = this.modoEntreUbicaciones === 'scrap-proyecto'
          ? 'Scrap devuelto'
          : 'Transferencia a scrap';
        const detalle = this.modoEntreUbicaciones === 'scrap-proyecto'
          ? 'Los insumos fueron reingresados al proyecto.'
          : 'Los insumos fueron registrados en la ubicaciÃ³n de scrap.';
        this.alertas.success(titulo, detalle);
        this.cargando = false;
        this.cargarInsumosScrap();
      },
      error: (err) => {
        this.alertas.error('Error', err?.error?.message || err?.message || 'No se pudo completar la transferencia.');
        this.cargando = false;
      }
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
          const stock = Number(m.stockActual ?? 0);
          const tieneStock = stock >= necesario;
          const esExtra = m.tipoCalculo === 'Extra';
          return {
            idMaterialCalculado: Number(m.idMaterialCalculado ?? 0),
            idInsumo: m.idInsumo,
            idTipoInsumo: m.idTipoInsumo ?? 0,
            nombreInsumo: m.nombreInsumo,
            tipoInsumo: m.tipoInsumo || '',
            colorSolicitado: normalizarColor(m.colorSolicitado),
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
        this.mostrarMensaje(err?.error?.message || err?.error?.detalle || 'Error al asignar materiales', 'error');
        this.cargando = false;
      }
    });
  }

  abrirPanelOC(): void {
    const materialesParaPedido = [
      ...this.sinStock,
      ...this.materialesExtra
    ];

    if (!materialesParaPedido.length) { this.mostrarMensaje('No hay materiales para pedir', 'error'); return; }
    this.itemsOC = materialesParaPedido.map(m => {
      const cantidadInicial = m.esMaterialExtra ? 0 : Math.max(0.01, m.cantidadNecesaria - m.stockDisponible);
      return {
        idMaterialCalculado: m.idMaterialCalculado,
        idInsumo: m.idInsumo || 0,
        nombreInsumo: m.nombreInsumo,
        colorSolicitado: m.colorSolicitado || '',
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

    const coloresDetalle = this.itemsOC.filter(i => i.colorSolicitado).map(i => `${i.nombreInsumo} ${i.colorSolicitado}`).join(', ');
    const dto = {
      idProveedor: this.idProveedorOC,
      idProyecto: this.idProyectoSeleccionado,
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
        nuevoUnidadMedida: i.idInsumo === 0 ? (i.nuevoUnidadMedida || 'Kg') : undefined,
        idProyecto: i.esMaterialExtra ? this.idProyectoSeleccionado : undefined,
        idProyectoPrenda: i.esMaterialExtra ? i.idProyectoPrenda : undefined,
        esMaterialExtra: i.esMaterialExtra || false
      }))
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
