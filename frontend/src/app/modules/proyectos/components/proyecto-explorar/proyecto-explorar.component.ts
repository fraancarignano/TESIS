import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProyectosService } from '../../services/proyecto.service';
import { Proyecto, ProyectoVista, proyectoToVista } from '../../models/proyecto.model';
import { getAreaActual } from '../../constants/areas.constants';
import { ProyectoCardComponent } from '../proyecto-card/proyecto-card.component';
import { AlertasService } from '../../../../core/services/alertas';
import { ProyectoFormNuevoComponent } from '../nuevo-proyecto-modal/proyecto-form.component';

type VistaModo = 'lista' | 'mosaico';
type OrdenDireccion = 'asc' | 'desc';
type OrdenCampo =
  | 'nombre'
  | 'cliente'
  | 'prenda'
  | 'estado'
  | 'fechaInicio'
  | 'fechaFin'
  | 'areaActual';
type AgrupacionKey =
  | 'ninguna'
  | 'cliente'
  | 'tipoProyecto'
  | 'tipoPrenda'
  | 'estado'
  | 'areaActual'
  | 'fechaInicio'
  | 'fechaFin';

interface AgrupacionOption {
  key: AgrupacionKey;
  label: string;
}

interface OrdenOption {
  key: OrdenCampo;
  label: string;
}

interface GrupoLista {
  key: string;
  label: string;
  orden: string | number;
  proyectos: Proyecto[];
}

interface GrupoMosaico {
  key: string;
  label: string;
  orden: string | number;
  proyectos: ProyectoVista[];
}

@Component({
  selector: 'app-proyecto-explorar',
  standalone: true,
  imports: [CommonModule, FormsModule, ProyectoCardComponent, ProyectoFormNuevoComponent],
  templateUrl: './proyecto-explorar.component.html',
  styleUrls: ['./proyecto-explorar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProyectoExplorarComponent implements OnInit {
  private readonly storageKey = 'proyectos-explorar-estado';
  vistaActual: VistaModo = 'lista';
  agrupacionActual: AgrupacionKey = 'ninguna';
  terminoBusqueda = '';
  ordenCampo: OrdenCampo = 'nombre';
  ordenDireccion: OrdenDireccion = 'asc';

  proyectos: Proyecto[] = [];
  proyectosFiltrados: Proyecto[] = [];
  gruposLista: GrupoLista[] = [];
  gruposMosaico: GrupoMosaico[] = [];
  loading = false;
  error = false;
  proyectoSeleccionado: Proyecto | null = null;
  mostrarModalEdicion = false;

  readonly agrupaciones: AgrupacionOption[] = [
    { key: 'ninguna', label: 'Mostrar todos' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'tipoProyecto', label: 'Tipo de proyecto' },
    { key: 'tipoPrenda', label: 'Tipo de prenda' },
    { key: 'estado', label: 'Estado' },
    { key: 'areaActual', label: 'Area actual' },
    { key: 'fechaInicio', label: 'Fecha inicio (mes)' },
    { key: 'fechaFin', label: 'Fecha fin (mes)' }
  ];

  readonly ordenCampos: OrdenOption[] = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'prenda', label: 'Prenda' },
    { key: 'estado', label: 'Estado' },
    { key: 'fechaInicio', label: 'Fecha inicio' },
    { key: 'fechaFin', label: 'Fecha fin' },
    { key: 'areaActual', label: 'Area actual' }
  ];

  constructor(
    private proyectosService: ProyectosService,
    private router: Router,
    private alertas: AlertasService
  ) {}

  ngOnInit(): void {
    this.cargarEstadoPersistido();
    this.cargarProyectos();
  }

  cargarProyectos(): void {
    this.loading = true;
    this.error = false;

    this.proyectosService.obtenerProyectosConCache().subscribe({
      next: (data) => {
        this.proyectos = data || [];
        this.recalcularListados();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar proyectos:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  private recalcularListados(): void {
    let resultado = [...this.proyectos];

    if (this.terminoBusqueda) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(p => {
        const area = this.getAreaActualNombre(p).toLowerCase();
        const cliente = this.getClienteNombre(p).toLowerCase();
        const prenda = this.getTipoPrendaNombre(p).toLowerCase();
        return (
          (p.nombreProyecto?.toLowerCase().includes(termino)) ||
          (p.codigoProyecto?.toLowerCase().includes(termino)) ||
          prenda.includes(termino) ||
          (p.tipoEstacion?.toLowerCase().includes(termino)) ||
          (p.estado?.toLowerCase().includes(termino)) ||
          cliente.includes(termino) ||
          area.includes(termino)
        );
      });
    }

    this.proyectosFiltrados = resultado;
    this.gruposLista = this.construirGruposLista(this.proyectosFiltrados);
    this.gruposMosaico = this.gruposLista.map(grupo => ({
      key: grupo.key,
      label: grupo.label,
      orden: grupo.orden,
      proyectos: grupo.proyectos.map(p => proyectoToVista(p))
    }));
  }

  setVista(modo: VistaModo): void {
    this.vistaActual = modo;
    this.persistirEstado();
  }

  toggleOrdenDireccion(): void {
    this.ordenDireccion = this.ordenDireccion === 'asc' ? 'desc' : 'asc';
    this.recalcularListados();
    this.persistirEstado();
  }

  setOrdenCampo(campo: OrdenCampo): void {
    if (this.ordenCampo === campo) {
      this.toggleOrdenDireccion();
      return;
    }
    this.ordenCampo = campo;
    this.ordenDireccion = 'asc';
    this.recalcularListados();
    this.persistirEstado();
  }

  isOrdenCampo(campo: OrdenCampo): boolean {
    return this.ordenCampo === campo;
  }

  getOrdenIcono(campo: OrdenCampo): string {
    if (this.ordenCampo !== campo) return '↕';
    return this.ordenDireccion === 'asc' ? '↑' : '↓';
  }

  verDetalleProyecto(proyecto: Proyecto | ProyectoVista): void {
    if (!proyecto.idProyecto) return;
    this.router.navigate(['/proyectos/detalle', proyecto.idProyecto], {
      state: { proyecto }
    });
  }

  abrirDetalle(proyecto: Proyecto): void {
    this.verDetalleProyecto(proyecto);
  }

  verDetalleAccion(proyecto: Proyecto | ProyectoVista, event?: Event): void {
    event?.stopPropagation();
    this.abrirDetalle(proyecto as Proyecto);
  }

  editarProyecto(proyecto: Proyecto | ProyectoVista, event?: Event): void {
    event?.stopPropagation();
    const estadosNoEditables = ['Finalizado', 'Archivado', 'Cancelado'];
    if (estadosNoEditables.includes(proyecto.estado)) {
      this.alertas.warning('No se puede editar', `El proyecto esta en estado ${proyecto.estado} y no puede ser editado`);
      return;
    }

    const proyectoBase = this.obtenerProyectoBase(proyecto);
    if (!proyectoBase) {
      this.alertas.error('Error', 'No se pudo encontrar el proyecto');
      return;
    }

    this.proyectoSeleccionado = proyectoBase;
    this.mostrarModalEdicion = true;
  }

  cerrarModalEdicion(): void {
    this.mostrarModalEdicion = false;
    this.proyectoSeleccionado = null;
    this.cargarProyectos();
  }

  async eliminarProyecto(proyecto: Proyecto | ProyectoVista, event?: Event): Promise<void> {
    event?.stopPropagation();
    if (!proyecto.idProyecto) {
      this.alertas.error('Error', 'Proyecto sin ID valido');
      return;
    }

    const confirmado = await this.alertas.confirmar(
      'Eliminar proyecto?',
      `Se eliminara el proyecto "${proyecto.nombreProyecto}". Esta accion no se puede deshacer.`,
      'Si, eliminar'
    );

    if (!confirmado) return;

    this.proyectosService.eliminarProyecto(proyecto.idProyecto).subscribe({
      next: () => {
        this.alertas.success('Proyecto eliminado', 'El proyecto se elimino correctamente');
        this.cargarProyectos();
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        this.alertas.error('Error', 'No se pudo eliminar el proyecto');
      }
    });
  }

  getEstadoClass(estado: string): string {
    const estados: { [key: string]: string } = {
      'Pendiente': 'badge-pendiente',
      'En Proceso': 'badge-en-curso',
      'Finalizado': 'badge-finalizado',
      'Despachado': 'badge-despachado',
      'Cancelado': 'badge-cancelado',
      'Pausado': 'badge-pausado',
      'Archivado': 'badge-archivado'
    };
    return estados[estado] || 'badge-default';
  }

  trackByGrupo(index: number, grupo: GrupoLista | GrupoMosaico): string {
    return grupo.key || String(index);
  }

  trackByProyecto(index: number, proyecto: Proyecto | ProyectoVista): number {
    return proyecto.idProyecto ?? index;
  }

  getAreaActualNombre(proyecto: Proyecto): string {
    if (proyecto.areaActual && proyecto.areaActual.trim()) {
      return proyecto.areaActual;
    }

    const area = getAreaActual(proyecto);
    return area?.nombre || area?.nombreCorto || 'Sin area';
  }

  getClienteNombre(proyecto: Proyecto): string {
    const anyProyecto = proyecto as any;
    return (
      proyecto.clienteNombre ||
      anyProyecto.nombreCliente ||
      anyProyecto.clienteNombreCompleto ||
      anyProyecto.cliente?.nombreCompleto ||
      anyProyecto.cliente?.nombre ||
      ''
    );
  }

  getTipoPrendaNombre(proyecto: Proyecto): string {
    const anyProyecto = proyecto as any;
    const prendas = Array.isArray(anyProyecto.prendas) ? (anyProyecto.prendas as any[]) : [];
    if (prendas.length > 0) {
      const nombres: string[] = prendas
        .map((p: any) => String(p?.nombrePrenda ?? p?.nombreTipoPrenda ?? p?.tipoPrenda ?? p?.nombreTipo ?? '').trim())
        .filter((n: string) => !!n);
      const unicos: string[] = Array.from(new Set(nombres));
      if (unicos.length === 1) return unicos[0];
      if (unicos.length > 1) return 'Varias prendas';
    }
    return (
      proyecto.tipoPrenda ||
      anyProyecto.nombrePrenda ||
      anyProyecto.tipoPrendaNombre ||
      anyProyecto.prendaNombre ||
      anyProyecto.prenda ||
      anyProyecto.tipo ||
      ''
    );
  }

  formatearFecha(fecha?: string | null): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private construirGruposLista(proyectos: Proyecto[]): GrupoLista[] {
    if (this.agrupacionActual === 'ninguna') {
      return [{
        key: 'todos',
        label: 'Todos los proyectos',
        orden: 0,
        proyectos: this.ordenarProyectos(proyectos)
      }];
    }

    const mapa = new Map<string, GrupoLista>();

    proyectos.forEach(proyecto => {
      const info = this.getInfoAgrupacion(proyecto);
      const key = info.label;
      if (!mapa.has(key)) {
        mapa.set(key, {
          key,
          label: info.label,
          orden: info.orden,
          proyectos: []
        });
      }
      mapa.get(key)!.proyectos.push(proyecto);
    });

    const grupos = Array.from(mapa.values());
    grupos.forEach(grupo => {
      grupo.proyectos = this.ordenarProyectos(grupo.proyectos);
    });
    return grupos.sort((a, b) => this.compararGrupos(a, b));
  }

  private getInfoAgrupacion(proyecto: Proyecto): { label: string; orden: string | number } {
    switch (this.agrupacionActual) {
      case 'cliente': {
        const label = this.getClienteNombre(proyecto).trim() || 'Sin cliente';
        return { label, orden: label };
      }
      case 'tipoProyecto': {
        const label = proyecto.tipoEstacion?.trim() || 'Sin tipo';
        return { label, orden: label };
      }
      case 'tipoPrenda': {
        const label = this.getTipoPrendaNombre(proyecto).trim() || 'Sin prenda';
        return { label, orden: label };
      }
      case 'estado': {
        const label = proyecto.estado || 'Sin estado';
        return { label, orden: label };
      }
      case 'areaActual': {
        const label = this.getAreaActualNombre(proyecto) || 'Sin area';
        return { label, orden: label };
      }
      case 'fechaInicio': {
        return this.infoFecha(proyecto.fechaInicio, 'Sin fecha inicio');
      }
      case 'fechaFin': {
        return this.infoFecha(proyecto.fechaFin || undefined, 'Sin fecha fin');
      }
      default: {
        return { label: 'Otros', orden: 'Otros' };
      }
    }
  }

  private infoFecha(fecha?: string, sinLabel: string = 'Sin fecha'): { label: string; orden: number | string } {
    if (!fecha) {
      return { label: sinLabel, orden: Number.MAX_SAFE_INTEGER };
    }

    const date = new Date(fecha);
    const mes = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    const orden = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
    return { label: mes, orden };
  }

  private compararGrupos(a: GrupoLista, b: GrupoLista): number {
    if (this.agrupacionActual === 'estado') {
      const ordenEstado: Record<string, number> = {
        'Pendiente': 1,
        'En Proceso': 2,
        'Finalizado': 3,
        'Despachado': 4,
        'Cancelado': 5,
        'Pausado': 6,
        'Archivado': 7
      };
      const ordenA = ordenEstado[a.label] ?? 999;
      const ordenB = ordenEstado[b.label] ?? 999;
      if (ordenA !== ordenB) return ordenA - ordenB;
    }

    if (typeof a.orden === 'number' && typeof b.orden === 'number') {
      return a.orden - b.orden;
    }

    const labelA = String(a.orden);
    const labelB = String(b.orden);
    const sinA = labelA.toLowerCase().startsWith('sin ');
    const sinB = labelB.toLowerCase().startsWith('sin ');

    if (sinA && !sinB) return 1;
    if (!sinA && sinB) return -1;
    return labelA.localeCompare(labelB, 'es', { sensitivity: 'base' });
  }

  private ordenarProyectos(proyectos: Proyecto[]): Proyecto[] {
    const dir = this.ordenDireccion === 'asc' ? 1 : -1;
    return [...proyectos].sort((a, b) => {
      const valA = this.getValorOrden(a);
      const valB = this.getValorOrden(b);

      if (valA === valB) return 0;
      if (valA === null || valA === undefined || valA === '') return 1 * dir;
      if (valB === null || valB === undefined || valB === '') return -1 * dir;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * dir;
      }

      return String(valA).localeCompare(String(valB), 'es', { sensitivity: 'base' }) * dir;
    });
  }

  private getValorOrden(proyecto: Proyecto): string | number {
    switch (this.ordenCampo) {
      case 'cliente':
        return this.getClienteNombre(proyecto);
      case 'prenda':
        return this.getTipoPrendaNombre(proyecto);
      case 'estado':
        return proyecto.estado || '';
      case 'fechaInicio':
        return proyecto.fechaInicio ? new Date(proyecto.fechaInicio).getTime() : Number.MAX_SAFE_INTEGER;
      case 'fechaFin':
        return proyecto.fechaFin ? new Date(proyecto.fechaFin).getTime() : Number.MAX_SAFE_INTEGER;
      case 'areaActual':
        return this.getAreaActualNombre(proyecto);
      case 'nombre':
      default:
        return proyecto.nombreProyecto || '';
    }
  }

  private obtenerProyectoBase(proyecto: Proyecto | ProyectoVista): Proyecto | null {
    if (!proyecto.idProyecto) return null;
    return this.proyectos.find(p => p.idProyecto === proyecto.idProyecto) || (proyecto as Proyecto);
  }

  onBusquedaChange(valor: string): void {
    this.terminoBusqueda = valor;
    this.recalcularListados();
    this.persistirEstado();
  }

  onAgrupacionChange(valor: AgrupacionKey): void {
    this.agrupacionActual = valor;
    this.recalcularListados();
    this.persistirEstado();
  }

  private persistirEstado(): void {
    const estado = {
      vistaActual: this.vistaActual,
      agrupacionActual: this.agrupacionActual,
      terminoBusqueda: this.terminoBusqueda,
      ordenCampo: this.ordenCampo,
      ordenDireccion: this.ordenDireccion
    };
    localStorage.setItem(this.storageKey, JSON.stringify(estado));
  }

  private cargarEstadoPersistido(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const estado = JSON.parse(raw);
      if (estado?.vistaActual) this.vistaActual = estado.vistaActual;
      if (estado?.agrupacionActual) this.agrupacionActual = estado.agrupacionActual;
      if (estado?.terminoBusqueda !== undefined) this.terminoBusqueda = estado.terminoBusqueda;
      if (estado?.ordenCampo) this.ordenCampo = estado.ordenCampo;
      if (estado?.ordenDireccion) this.ordenDireccion = estado.ordenDireccion;
    } catch {
      // ignore invalid storage
    }
  }
}
