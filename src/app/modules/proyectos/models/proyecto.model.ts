
export interface Material {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
}

export interface ObservacionProyecto {
  id: string;
  fecha: Date;
  usuario: string;
  texto: string;
  tipo: 'observacion' | 'incidencia';
}

export interface AvanceEtapa {
  diseño: number;      // 0-100
  corte: number;       // 0-100
  confeccion: number;  // 0-100
  calidad: number;     // 0-100
}

export type EstadoProyecto = 'pendiente' | 'en-proceso' | 'finalizado' | 'archivado' | 'cancelado';

export interface Proyecto {
  id: string;
  codigo: string; // P-2025-001
  
  // Datos básicos
  clienteId: string;
  clienteNombre: string;
  tipoPrenda: string;
  cantidadTotal: number;
  cantidadProducida: number;
  
  // Materiales
  materiales: Material[];
  costoMaterialEstimado: number;
  
  // Fechas
  fechaInicio: Date;
  fechaEstimadaFin: Date;
  fechaFinReal?: Date;
  
  // Estado y progreso
  estado: EstadoProyecto;
  avanceEtapas: AvanceEtapa;
  
  // Scrap
  scrapGenerado: number;
  scrapPorcentaje: number;
  
  // Observaciones
  observaciones: ObservacionProyecto[];
  
  // Auditoría
  fechaCreacion: Date;
  fechaUltimaModificacion: Date;
  usuarioCreador: string;
}

// Función helper para generar código de proyecto
export function generarCodigoProyecto(numero: number): string {
  const año = new Date().getFullYear();
  const numeroFormateado = numero.toString().padStart(3, '0');
  return `P-${año}-${numeroFormateado}`;
}

// Función helper para calcular progreso general
export function calcularProgresoGeneral(avance: AvanceEtapa): number {
  return Math.round((avance.diseño + avance.corte + avance.confeccion + avance.calidad) / 4);
}