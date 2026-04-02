import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProyectosService } from '../../services/proyecto.service';
import { Proyecto, ProyectoVista, proyectoToVista } from '../../models/proyecto.model';
import { getAreaActual } from '../../constants/areas.constants';
import { ProyectoCardComponent } from '../proyecto-card/proyecto-card.component';

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
  imports: [CommonModule, FormsModule, ProyectoCardComponent],
  templateUrl: './proyecto-explorar.component.html',
  styleUrls: ['./proyecto-explorar.component.css']
})
export class ProyectoExplorarComponent implements OnInit {
  vistaActual: VistaModo = 'lista';
  agrupacionActual: AgrupacionKey = 'ninguna';
  terminoBusqueda = '';
  ordenCampo: OrdenCampo = 'nombre';
  ordenDireccion: OrdenDireccion = 'asc';

  proyectos: Proyecto[] = [];
  loading = false;
  error = false;

  readonly agrupaciones: AgrupacionOption[] = [
    { key: 'ninguna', label: 'Sin agrupar' },
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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarProyectos();
  }

  cargarProyectos(): void {
    this.loading = true;
    this.error = false;

    this.proyectosService.obtenerProyectosConCache().subscribe({
      next: (data) => {
        this.proyectos = data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar proyectos:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  get proyectosFiltrados(): Proyecto[] {
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

    return resultado;
  }

  get gruposLista(): GrupoLista[] {
    return this.construirGruposLista(this.proyectosFiltrados);
  }

  get gruposMosaico(): GrupoMosaico[] {
    const gruposBase = this.construirGruposLista(this.proyectosFiltrados);
    return gruposBase.map(grupo => ({
      key: grupo.key,
      label: grupo.label,
      orden: grupo.orden,
      proyectos: grupo.proyectos.map(p => proyectoToVista(p))
    }));
  }

  setVista(modo: VistaModo): void {
    this.vistaActual = modo;
  }

  toggleOrdenDireccion(): void {
    this.ordenDireccion = this.ordenDireccion === 'asc' ? 'desc' : 'asc';
  }

  setOrdenCampo(campo: OrdenCampo): void {
    if (this.ordenCampo === campo) {
      this.toggleOrdenDireccion();
      return;
    }
    this.ordenCampo = campo;
    this.ordenDireccion = 'asc';
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

  getEstadoClass(estado: string): string {
    const estados: { [key: string]: string } = {
      'Pendiente': 'badge-pendiente',
      'En Proceso': 'badge-en-curso',
      'Finalizado': 'badge-finalizado',
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
}
