// ============================================
// CONSTANTES DE ÁREAS DE PRODUCCIÓN
// ============================================

export interface AreaProduccion {
  id: number;
  nombre: string;
  nombreCorto: string;
  campo: keyof ProyectoAvances; // Campo en el modelo Proyecto
  icono: string; // Clase de FontAwesome
  color: string; // Color hex
  descripcion: string;
  orden: number; // Orden en el flujo de producción
}

// Interface auxiliar para type-safety
export interface ProyectoAvances {
  avanceGerenciaAdmin: number;
  avanceDiseñoDesarrollo: number;
  avanceControlCalidad: number;
  avanceEtiquetadoEmpaquetado: number;
  avanceDepositoLogistica: number;
}

// ============================================
// DEFINICIÓN DE LAS 5 ÁREAS
// ============================================

export const AREAS_PRODUCCION: AreaProduccion[] = [
  {
    id: 1,
    nombre: 'Gerencia y Administración',
    nombreCorto: 'Gerencia',
    campo: 'avanceGerenciaAdmin',
    icono: 'fa-briefcase',
    color: '#9c27b0',
    descripcion: 'Aprobación inicial y planificación del proyecto',
    orden: 1
  },
  {
    id: 2,
    nombre: 'Diseño y Desarrollo',
    nombreCorto: 'Diseño',
    campo: 'avanceDiseñoDesarrollo',
    icono: 'fa-pencil-ruler',
    color: '#2196f3',
    descripcion: 'Creación de diseños, patrones y prototipos',
    orden: 2
  },
  {
    id: 3,
    nombre: 'Control de Calidad',
    nombreCorto: 'Calidad',
    campo: 'avanceControlCalidad',
    icono: 'fa-check-circle',
    color: '#4caf50',
    descripcion: 'Verificación y control de estándares',
    orden: 3
  },
  {
    id: 4,
    nombre: 'Etiquetado y Empaquetado',
    nombreCorto: 'Etiquetado',
    campo: 'avanceEtiquetadoEmpaquetado',
    icono: 'fa-tags',
    color: '#ff9800',
    descripcion: 'Etiquetado, empaque y preparación para envío',
    orden: 4
  },
  {
    id: 5,
    nombre: 'Depósito y Logística',
    nombreCorto: 'Logística',
    campo: 'avanceDepositoLogistica',
    icono: 'fa-warehouse',
    color: '#795548',
    descripcion: 'Almacenamiento y gestión de envíos',
    orden: 5
  }
];

// ============================================
// FUNCIONES HELPER PARA ÁREAS
// ============================================

/**
 * Obtener área por ID
 */
export function getAreaById(id: number): AreaProduccion | undefined {
  return AREAS_PRODUCCION.find(area => area.id === id);
}

/**
 * Obtener área por nombre del campo
 */
export function getAreaByCampo(campo: string): AreaProduccion | undefined {
  return AREAS_PRODUCCION.find(area => area.campo === campo);
}

/**
 * Obtener área actual del proyecto
 */
export function getAreaActual(proyecto: any): AreaProduccion | undefined {
  // Si tiene areaActual definida, buscar por nombre
  if (proyecto.areaActual) {
    return AREAS_PRODUCCION.find(area => 
      area.nombre.toLowerCase().includes(proyecto.areaActual.toLowerCase())
    );
  }
  
  // Si no, buscar la primera área que no esté completa
  for (const area of AREAS_PRODUCCION) {
    const avance = proyecto[area.campo] ?? 0;
    if (avance < 100) {
      return area;
    }
  }
  
  // Si todas están completas, retornar la última
  return AREAS_PRODUCCION[AREAS_PRODUCCION.length - 1];
}

/**
 * Obtener siguiente área en el flujo
 */
export function getSiguienteArea(areaActual: AreaProduccion): AreaProduccion | undefined {
  const siguienteOrden = areaActual.orden + 1;
  return AREAS_PRODUCCION.find(area => area.orden === siguienteOrden);
}

/**
 * Obtener área anterior en el flujo
 */
export function getAreaAnterior(areaActual: AreaProduccion): AreaProduccion | undefined {
  const ordenAnterior = areaActual.orden - 1;
  return AREAS_PRODUCCION.find(area => area.orden === ordenAnterior);
}

/**
 * Calcular progreso general del proyecto
 */
export function calcularProgresoGeneralPorAreas(proyecto: any): number {
  const avances = AREAS_PRODUCCION.map(area => proyecto[area.campo] ?? 0);
  const suma = avances.reduce((acc, val) => acc + val, 0);
  return Math.round(suma / AREAS_PRODUCCION.length);
}

/**
 * Obtener color de progreso según porcentaje
 */
export function getColorProgreso(porcentaje: number): string {
  if (porcentaje === 0) return '#e0e0e0';
  if (porcentaje < 30) return '#f44336'; // Rojo - Crítico
  if (porcentaje < 60) return '#ff9800'; // Naranja - En progreso
  if (porcentaje < 100) return '#2196f3'; // Azul - Avanzado
  return '#4caf50'; // Verde - Completado
}

/**
 * Verificar si un área está completa
 */
export function areaEstaCompleta(proyecto: any, area: AreaProduccion): boolean {
  const avance = proyecto[area.campo] ?? 0;
  return avance >= 100;
}

/**
 * Verificar si un área está en progreso
 */
export function areaEnProgreso(proyecto: any, area: AreaProduccion): boolean {
  const avance = proyecto[area.campo] ?? 0;
  return avance > 0 && avance < 100;
}

/**
 * Verificar si un área está pendiente
 */
export function areaPendiente(proyecto: any, area: AreaProduccion): boolean {
  const avance = proyecto[area.campo] ?? 0;
  return avance === 0;
}

/**
 * Obtener ícono de estado del área
 */
export function getIconoEstadoArea(proyecto: any, area: AreaProduccion): string {
  if (areaEstaCompleta(proyecto, area)) return 'fa-check-circle';
  if (areaEnProgreso(proyecto, area)) return 'fa-play-circle';
  return 'fa-circle';
}

/**
 * Obtener resumen de áreas del proyecto
 */
export interface ResumenAreas {
  completadas: number;
  enProgreso: number;
  pendientes: number;
  areaActual?: AreaProduccion;
}

export function getResumenAreas(proyecto: any): ResumenAreas {
  let completadas = 0;
  let enProgreso = 0;
  let pendientes = 0;
  let areaActual: AreaProduccion | undefined;

  AREAS_PRODUCCION.forEach(area => {
    const avance = proyecto[area.campo] ?? 0;
    
    if (avance >= 100) {
      completadas++;
    } else if (avance > 0) {
      enProgreso++;
      if (!areaActual) areaActual = area; // Primera área en progreso
    } else {
      pendientes++;
      if (!areaActual && enProgreso === 0) areaActual = area; // Primera pendiente
    }
  });

  return { completadas, enProgreso, pendientes, areaActual };
}