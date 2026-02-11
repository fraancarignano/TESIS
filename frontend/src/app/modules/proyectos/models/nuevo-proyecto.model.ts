// ============================================
// INTERFACES PARA PROYECTOS CON MÚLTIPLES PRENDAS
// ============================================

import { Cliente } from "../../clientes/models/cliente.model";
import { Proyecto } from "./proyecto.model"; // Mantener compatibilidad con el model anterior

// ============================================
// CATÁLOGOS
// ============================================

export interface TipoPrenda {
  idTipoPrenda: number;
  nombrePrenda: string;
  descripcion?: string;
  longitudCosturaMetros?: number;
  estado?: string;
}

export interface Talle {
  idTalle: number;
  nombreTalle: string;
  orden: number;
  categoria?: string; // Adulto, Niño, Bebé
  estado?: string;
}

export interface TipoInsumo {
  idTipoInsumo: number;
  nombreTipo: string;
  descripcion?: string;
  categoria?: string; // Tela, Hilo, Accesorio
}

export interface InsumoFormulario {
  idInsumo: number;
  nombreInsumo: string;
  idTipoInsumo: number;
  nombreTipoInsumo: string;
  categoria: string; // Tela, Hilo, Accesorio
  unidadMedida: string;
  stockActual: number;
  color?: string;
  tipoTela?: string;
  ratioKgUnidad?: number;
}

export interface ClienteSimple {
  idCliente: number;
  nombreCompleto: string;
  tipoCliente: string;
  email?: string;
}

export interface UsuarioSimple {
  idUsuario: number;
  nombreUsuario: string;
  apellidoUsuario: string;
  nombreCompleto: string;
}

// ============================================
// FORMULARIO: INICIALIZACIÓN
// ============================================

export interface FormularioProyectoInicializacion {
  clientes: Cliente[];
  tiposPrenda: TipoPrenda[];
  talles: Talle[];
  tiposInsumo: TipoInsumo[];
  insumos: InsumoFormulario[];
  usuarios: UsuarioSimple[];
  prioridades: string[];
}

// ============================================
// DTOs PARA CREAR PROYECTO
// ============================================

export interface PrendaTalleCrear {
  idTalle: number;
  cantidad: number;
}

export interface ProyectoPrendaCrear {
  idTipoPrenda: number;
  idTipoInsumoMaterial: number;
  idInsumo: number;
  cantidadTotal: number;
  tieneBordado: boolean;
  tieneEstampado: boolean;
  descripcionDiseno?: string;
  orden?: number;
  talles: PrendaTalleCrear[];
}

export interface MaterialManual {
  idInsumo: number;
  cantidad: number;
  unidadMedida: string;
  observaciones?: string;
}

export interface ProyectoCrearNuevo {
  idCliente: number;
  nombreProyecto: string;
  descripcion?: string;
  prioridad?: string;
  estado: string;
  fechaInicio: string; // YYYY-MM-DD
  fechaFin?: string;
  idUsuarioEncargado?: number;
  prendas: ProyectoPrendaCrear[];
  materialesManuales?: MaterialManual[];
}

// ============================================
// DTOs DE RESPUESTA
// ============================================

export interface PrendaTalleDTO {
  idPrendaTalle: number;
  idTalle: number;
  nombreTalle: string;
  cantidad: number;
}

export interface ProyectoPrendaDTO {
  idProyectoPrenda: number;
  idTipoPrenda: number;
  nombrePrenda: string;
  idTipoInsumoMaterial?: number;
  nombreMaterial?: string;
  cantidadTotal: number;
  tieneBordado: boolean;
  tieneEstampado: boolean;
  descripcionDiseno?: string;
  talles: PrendaTalleDTO[];
}

export interface MaterialCalculado {
  idMaterialCalculado: number;
  idInsumo: number;
  nombreInsumo: string;
  tipoInsumo: string;
  tipoCalculo: string; // "Auto" o "Manual"
  cantidadCalculada: number;
  cantidadManual?: number;
  cantidadFinal: number;
  unidadMedida: string;
  stockActual: number;
  tieneStock: boolean;
  observaciones?: string;
  idProyectoPrenda?: number;
  nombrePrenda?: string;
}

export interface ProyectoDetalle {
  idProyecto: number;
  codigoProyecto: string;
  idCliente: number;
  nombreCliente: string;
  nombreProyecto: string;
  descripcion?: string;
  prioridad?: string;
  estado: string;
  fechaInicio: string;
  fechaFin?: string;
  cantidadTotal?: number;
  cantidadProducida?: number;
  idUsuarioEncargado?: number;
  nombreUsuarioEncargado?: string;
  esMultiPrenda: boolean;
  prendas: ProyectoPrendaDTO[];
  materiales: MaterialCalculado[];
  alertasStock: string[];
}

// ============================================
// VALIDACIONES Y CÁLCULOS
// ============================================

export interface ValidarTallesRequest {
  cantidadTotal: number;
  talles: { idTalle: number; cantidad: number }[];
}

export interface ValidarTallesResponse {
  esValido: boolean;
  cantidadTotal: number;
  sumaTalles: number;
  diferencia: number;
  mensaje?: string;
}

export interface MaterialCalculadoPreview {
  idInsumo: number;
  nombreInsumo: string;
  categoria : string;
  tipoInsumo: string;
  color?: string;
  tipoCalculo: string;
  cantidadNecesaria: number;
  unidadMedida: string;
  stockActual: number;
  tieneStockSuficiente: boolean;
  faltante?: number;
}

export interface AlertaCalculo {
  tipo: string; // "SinStock", "StockInsuficiente", "Advertencia"
  mensaje: string;
  idInsumo?: string;
  nombreInsumo?: string;
}

export interface CalculoMaterialesRequest {
  prendas: {
    idTipoPrenda: number;
    idTipoInsumoMaterial: number;
    cantidadTotal: number;
  }[];
  materialesManuales?: {
    idInsumo: number;
    cantidad: number;
  }[];
}

export interface CalculoMaterialesResponse {
  materialesCalculados: MaterialCalculadoPreview[];
  alertas: AlertaCalculo[];
  puedeCrearse: boolean;
}

export interface AlertaStock {
  idInsumo: number;
  nombreInsumo: string;
  cantidadRequerida: number;
  stockActual: number;
  faltante: number;
  unidadMedida: string;
  severidad: string; // "Warning", "Error"
}

export interface ValidacionStock {
  tieneStockSuficiente: boolean;
  alertas: AlertaStock[];
}

// ============================================
// ESTADO LOCAL DEL FORMULARIO
// ============================================

export interface PrendaFormulario {
  // Temporal, antes de guardar
  id: string; // UUID temporal para el array
  idTipoPrenda?: number;
  nombrePrenda?: string;
  idTipoInsumoMaterial?: number;
  nombreMaterial?: string;
  idInsumo?: number; // ID del insumo específico (tela con color)
  colorTela?: string; // Color de la tela seleccionada
  cantidadTotal: number;
  tieneBordado: boolean;
  tieneEstampado: boolean;
  descripcionDiseno?: string;
  tallesDistribuidos: TalleDistribuido[];
  mostrarModalTalles?: boolean;
}

export interface TalleDistribuido {
  idTalle: number;
  nombreTalle: string;
  cantidad: number;
}

export interface MaterialManualFormulario {
  id: string; // UUID temporal
  idInsumo?: number;
  nombreInsumo?: string;
  categoria?: string;
  cantidad: number;
  unidadMedida?: string;
  stockActual?: number;
}

// ============================================
// FUNCIONES HELPER
// ============================================

/**
 * Genera un ID temporal único para arrays del formulario
 */
export function generarIdTemporal(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Valida que la suma de talles coincida con la cantidad total
 */
export function validarSumaTalles(talles: TalleDistribuido[], cantidadTotal: number): boolean {
  const suma = talles.reduce((acc, t) => acc + t.cantidad, 0);
  return suma === cantidadTotal;
}

/**
 * Obtiene la suma de talles
 */
export function obtenerSumaTalles(talles: TalleDistribuido[]): number {
  return talles.reduce((acc, t) => acc + t.cantidad, 0);
}

/**
 * Filtra insumos por categoría
 */
export function filtrarInsumosPorCategoria(
  insumos: InsumoFormulario[], 
  categoria: 'Tela' | 'Hilo' | 'Accesorio'
): InsumoFormulario[] {
  return insumos.filter(i => i.categoria === categoria);
}

/**
 * Obtiene tipos de insumo por categoría
 */
export function filtrarTiposInsumoPorCategoria(
  tiposInsumo: TipoInsumo[], 
  categoria: 'Tela' | 'Hilo' | 'Accesorio'
): TipoInsumo[] {
  return tiposInsumo.filter(ti => {
    const nombre = ti.nombreTipo.toLowerCase();
    if (categoria === 'Tela') return nombre.includes('tela');
    if (categoria === 'Hilo') return nombre.includes('hilo');
    if (categoria === 'Accesorio') return nombre.includes('accesorio');
    return false;
  });
}

/**
 * Calcula el total de prendas del proyecto
 */
export function calcularTotalPrendas(prendas: PrendaFormulario[]): number {
  return prendas.reduce((acc, p) => acc + p.cantidadTotal, 0);
}

/**
 * Formatea fecha para el backend (YYYY-MM-DD)
 */
export function formatearFechaParaBackend(fecha: Date | string): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD
 */
export function obtenerFechaHoy(): string {
  return formatearFechaParaBackend(new Date());
}