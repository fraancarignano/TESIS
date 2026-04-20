import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProyectosService } from '../../../proyectos/services/proyecto.service';
import { ProyectosServiceNuevo } from '../../../proyectos/services/proyectos-nuevo.service';
import { OrdenCompraService } from '../../../orden-compra/services/orden-compra.service';
import { NotificacionesService } from '../../../../core/services/notificaciones.service';
import { Proyecto } from '../../../proyectos/models/proyecto.model';

function normalizarColor(c?: string | null): string {
  if (!c) return '';
  return c.trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
        this.proyectos = (proyectos as any[]).filter((p: any) =>
          p.estado !== 'Archivado' && p.estado !== 'Cancelado' && p.estado !== 'Finalizado'
        );
        this.proveedores = proveedores;
        this.cargando = false;
        if (this.idProyectoSeleccionado) this.onProyectoChange();
      },
      error: () => { this.mostrarMensaje('Error al cargar datos', 'error'); this.cargando = false; }
    });
  }

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
          // Stock real: solo cuenta si el color del insumo coincide exactamente
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

  // ── GETTERS ───────────────────────────────────────────────────

  get conStock(): MaterialRow[] { return this.materiales.filter(m => m.tieneStockSuficiente); }
  get sinStock(): MaterialRow[] { return this.materiales.filter(m => !m.tieneStockSuficiente); }
  get todosListos(): boolean { return this.materiales.length > 0 && this.materialesListos && this.proyectoActual?.estado === 'Pendiente'; }
  get totalOC(): number { return this.itemsOC.reduce((a, i) => a + i.cantidad * i.precioUnitario, 0); }

  // ── ASIGNAR AL PROYECTO ───────────────────────────────────────

  asignarAlProyecto(): void {
    const aAsignar = this.conStock.filter(m => m.cantidadAAsignar > 0);
    if (!aAsignar.length) { this.mostrarMensaje('No hay materiales seleccionados para asignar', 'error'); return; }

    this.cargando = true;
    this.proyectosServiceNuevo.asignarMaterialesAlProyecto(
      Number(this.idProyectoSeleccionado),
      aAsignar.map(m => ({ idInsumo: m.idInsumo, cantidad: m.cantidadAAsignar }))
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
    if (!this.sinStock.length) { this.mostrarMensaje('No hay materiales faltantes', 'error'); return; }
    this.itemsOC = this.sinStock.map(m => ({
      // Telas con color → insumo nuevo (idInsumo=0) para garantizar el color correcto
      // Avíos/hilos sin color → usar el insumo existente del tipo
      idInsumo: m.colorSolicitado ? 0 : m.idInsumo,
      nombreInsumo: m.tipoInsumo || m.nombreInsumo,
      colorSolicitado: m.colorSolicitado || '',
      cantidad: Math.max(0.01, m.cantidadNecesaria - m.stockDisponible),
      precioUnitario: 0,
      nuevoIdTipoInsumo: m.colorSolicitado ? (m.idTipoInsumo || undefined) : undefined,
      nuevoUnidadMedida: m.unidadMedida
    }));
    this.idProveedorOC = null;
    this.fechaEntregaOC = '';
    this.mostrarPanelOC = true;
  }

  cerrarPanelOC(): void { this.mostrarPanelOC = false; }

  generarOrdenCompra(): void {
    if (!this.idProveedorOC) { this.mostrarMensaje('Seleccioná un proveedor', 'error'); return; }
    if (this.itemsOC.some(i => i.precioUnitario <= 0)) { this.mostrarMensaje('Completá el precio unitario', 'error'); return; }

    const coloresDetalle = this.itemsOC
      .filter(i => i.colorSolicitado)
      .map(i => `${i.nombreInsumo} ${i.colorSolicitado}`)
      .join(', ');

    const dto = {
      idProveedor: this.idProveedorOC,
      descripcion: `Proyecto: ${this.proyectoActual?.nombreProyecto || ''}` +
        (coloresDetalle ? ` | ${coloresDetalle}` : ''),
      fechaSolicitud: new Date().toISOString().split('T')[0],
      fechaEntregaEstimada: this.fechaEntregaOC || null,
      totalOrden: this.totalOC,
      detalles: this.itemsOC.map(i => ({
        idInsumo: i.idInsumo,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
        subtotal: i.cantidad * i.precioUnitario,
        // Si es insumo nuevo (idInsumo === 0), pasar los campos de creación
        nuevoNombreInsumo: i.idInsumo === 0 ? i.nombreInsumo : undefined,
        nuevoIdTipoInsumo: i.idInsumo === 0 ? i.nuevoIdTipoInsumo : undefined,
        nuevoColor: i.idInsumo === 0 ? (i.colorSolicitado || undefined) : undefined,
        nuevoUnidadMedida: i.idInsumo === 0 ? (i.nuevoUnidadMedida || 'Kg') : undefined
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
