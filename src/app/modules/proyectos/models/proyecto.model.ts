// ============================================
// INTERFACES PRINCIPALES
// ============================================

import { 
  AREAS_PRODUCCION, 
  getAreaActual, 
  calcularProgresoGeneralPorAreas,
  getResumenAreas,
  ResumenAreas
} from '../constants/areas.constants';


export interface DetalleAvanceAreas {
  areaActual?: string;
  progresoGeneral: number;
  areasCompletadas: number;
  totalAreas: number;
  resumen: ResumenAreas;
}

export function getDetalleAvanceAreas(proyecto: Proyecto): DetalleAvanceAreas {
  const resumen = getResumenAreas(proyecto);
  const areaActualObj = getAreaActual(proyecto);
  
  return {
    areaActual: areaActualObj?.nombreCorto,
    progresoGeneral: calcularProgresoGeneralPorAreas(proyecto),
    areasCompletadas: resumen.completadas,
    totalAreas: AREAS_PRODUCCION.length,
    resumen
  };
}

export interface Proyecto {
  idProyecto?: number;
  idCliente: number;
  clienteNombre?: string;
  nombreProyecto: string;
  tipoPrenda?: string | null;
  descripcion?: string | null;
  prioridad?: PrioridadProyecto | null;
  estado: EstadoProyecto;
  fechaInicio: string; // "2025-01-15"
  fechaFin?: string | null;
  cantidadTotal: number;
  cantidadProducida?: number | null;
  idUsuarioEncargado?: number | null;
  nombreEncargado?: string | null;
  tipoEstacion?: string | null;
  codigoProyecto?: string | null;
  areaActual?: string | null;
  
  // Avances (0-100)
  avanceGerenciaAdmin?: number | null;
  avanceDiseñoDesarrollo?: number | null;
  avanceControlCalidad?: number | null;
  avanceEtiquetadoEmpaquetado?: number | null;
  avanceDepositoLogistica?: number | null;
  
  // Costos y scrap
  costoMaterialEstimado?: number | null;
  scrapTotal?: number | null;
  scrapPorcentaje?: number | null;
  
  // Relaciones
  materiales?: MaterialProyecto[];
  observaciones?: ObservacionProyecto[];
}

// ============================================
// TIPOS Y ENUMS
// ============================================

export type EstadoProyecto = 
  | 'Pendiente'
  | 'En Proceso' 
  | 'Finalizado'
  | 'Cancelado'
  | 'Pausado'
  | 'Archivado';

export type PrioridadProyecto = 
  | 'alta'
  | 'media'
  | 'baja';

export type AreaProyecto = 
  | 'gerenciaAdmin'
  | 'diseñoDesarrollo'
  | 'controlCalidad'
  | 'etiquetadoEmpaquetado'
  | 'depositoLogistica';

// ============================================
// INTERFACES AUXILIARES
// ============================================

export interface MaterialProyecto {
  idDetalle: number;
  idInsumo: number;
  nombreInsumo?: string;
  idUnidad: number;
  unidadMedida?: string;
  cantidadAsignada: number;
  cantidadUtilizada?: number;
  desperdicioEstimado?: number;
}

export interface ObservacionProyecto {
  idObservacion: number;
  idUsuario: number;
  nombreUsuario?: string;
  fecha: string; // ISO 8601
  descripcion: string;
}

export interface MaterialAsignado {
  idInsumo: number;
  idUnidad: number;
  cantidadAsignada: number;
  desperdicioEstimado?: number;
}

// ============================================
// DTOs PARA CREAR/EDITAR
// ============================================

export interface CrearProyectoDTO {
  idCliente: number;
  nombreProyecto: string;
  tipoPrenda?: string;
  descripcion?: string;
  prioridad?: string;
  estado: string;
  fechaInicio: string; // "2025-01-15"
  fechaFin?: string;
  cantidadTotal?: number;
  idUsuarioEncargado?: number;
  tipoEstacion?: string;
  materiales?: MaterialAsignado[];
}

export interface EditarProyectoDTO {
  nombreProyecto?: string;
  tipoPrenda?: string;
  descripcion?: string;
  prioridad?: string;
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  cantidadTotal?: number;
  cantidadProducida?: number;
  idUsuarioEncargado?: number;
  tipoEstacion?: string;
  areaActual?: string;
  avanceGerenciaAdmin?: number;
  avanceDiseñoDesarrollo?: number;
  avanceControlCalidad?: number;
  avanceEtiquetadoEmpaquetado?: number;
  avanceDepositoLogistica?: number;
}

export interface BuscarProyectosDTO {
  nombreProyecto?: string;
  idCliente?: number;
  estado?: string;
  prioridad?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  tipoPrenda?: string;
}

export interface CambiarEstadoDTO {
  estado: string;
}

export interface ActualizarAvanceDTO {
  area: string; // "gerenciaAdmin", "diseñoDesarrollo", etc.
  porcentaje: number; // 0-100
  observaciones?: string;
}

export interface RegistrarScrapDTO {
  idInsumo: number;
  cantidadScrap: number;
  motivo?: string;
  destino?: string;
  areaOcurrencia?: string;
  costoScrap?: number;
}

export interface AgregarObservacionDTO {
  idUsuario: number;
  descripcion: string;
}

// ============================================
// INTERFAZ PARA VISTA (CON DATOS CALCULADOS)
// ============================================

export interface ProyectoVista extends Proyecto {
  progresoGeneral: number;
  diasTranscurridos: number;
  diasRestantes?: number;
  estaVencido: boolean;
  estadoColor: string;
  prioridadColor: string;
}

// ============================================
// FUNCIONES HELPER
// ============================================

/**
 * Calcular progreso general del proyecto
 */
export function calcularProgresoGeneral(proyecto: Proyecto): number {
  const avances = [
    proyecto.avanceGerenciaAdmin ?? 0,
    proyecto.avanceDiseñoDesarrollo ?? 0,
    proyecto.avanceControlCalidad ?? 0,
    proyecto.avanceEtiquetadoEmpaquetado ?? 0,
    proyecto.avanceDepositoLogistica ?? 0
  ];
  
  const suma = avances.reduce((acc, val) => acc + val, 0);
  return Math.round(suma / avances.length);
}

/**
 * Calcular días transcurridos
 */
export function calcularDiasTranscurridos(fechaInicio: string): number {
  const inicio = new Date(fechaInicio);
  const hoy = new Date();
  const diff = hoy.getTime() - inicio.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calcular días restantes
 */
export function calcularDiasRestantes(fechaFin?: string): number | undefined {
  if (!fechaFin) return undefined;
  
  const fin = new Date(fechaFin);
  const hoy = new Date();
  const diff = fin.getTime() - hoy.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Verificar si está vencido
 */
export function estaVencido(fechaFin?: string, estado?: EstadoProyecto): boolean {
  if (!fechaFin || estado === 'Finalizado' || estado === 'Cancelado' || estado === 'Archivado') {
    return false;
  }
  
  const fin = new Date(fechaFin);
  const hoy = new Date();
  return hoy > fin;
}

/**
 * Obtener color según el estado
 */
export function getEstadoColor(estado: EstadoProyecto): string {
  const colores: Record<EstadoProyecto, string> = {
    'Pendiente': '#ffa726',
    'En Proceso': '#42a5f5',
    'Finalizado': '#66bb6a',
    'Cancelado': '#ef5350',
    'Pausado': '#bdbdbd',
    'Archivado': '#9e9e9e'
  };
  return colores[estado] || '#9e9e9e';
}

/**
 * Obtener color según la prioridad
 */
export function getPrioridadColor(prioridad?: PrioridadProyecto): string {
  if (!prioridad) return '#9e9e9e';
  
  const colores: Record<PrioridadProyecto, string> = {
    'baja': '#66bb6a',
    'media': '#ffa726',
    'alta': '#ef5350'
  };
  return colores[prioridad] || '#9e9e9e';
}

/**
 * Convertir Proyecto a ProyectoVista
 */
export function proyectoToVista(proyecto: Proyecto): ProyectoVista {
  return {
    ...proyecto,
    progresoGeneral: calcularProgresoGeneral(proyecto),
    diasTranscurridos: calcularDiasTranscurridos(proyecto.fechaInicio),
    diasRestantes: calcularDiasRestantes(proyecto.fechaFin ?? undefined),
    estaVencido: estaVencido(proyecto.fechaFin ?? undefined, proyecto.estado),
    estadoColor: getEstadoColor(proyecto.estado),
    prioridadColor: getPrioridadColor(proyecto.prioridad ?? undefined)
  };
}

/**
 * Formatear fecha para el backend (YYYY-MM-DD)
 */
export function formatearFechaParaBackend(fecha: Date | string): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return date.toISOString().split('T')[0];
}

/**
 * Generar código de proyecto
 */
export function generarCodigoProyecto(numero: number): string {
  const año = new Date().getFullYear();
  const numeroFormateado = numero.toString().padStart(3, '0');
  return `P-${año}-${numeroFormateado}`;
}

/**
 * Mapear estado del frontend al backend
 */
export function mapearEstadoParaBackend(estado: string): string {
  const mapeo: Record<string, string> = {
    'pendiente': 'Pendiente',
    'en-proceso': 'En Proceso',
    'finalizado': 'Finalizado',
    'cancelado': 'Cancelado',
    'pausado': 'Pausado',
    'archivado': 'Archivado'
  };
  return mapeo[estado.toLowerCase()] || estado;
}

/**
 * Mapear estado del backend al frontend
 */
export function mapearEstadoDesdeBackend(estado: string): EstadoProyecto {
  // El backend devuelve "Pendiente", "En Proceso", etc.
  return estado as EstadoProyecto;
}