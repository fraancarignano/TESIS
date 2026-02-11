// ============================================================
// constants/areas.constants.ts
// VERSIÓN ACTUALIZADA CON IdArea
// ============================================================

export interface AreaProduccion {
  id: number;           // ID interno para el frontend (orden)
  idArea: number;       // ID de la base de datos (AreaProduccion.IdArea) ⭐ NUEVO
  nombre: string;
  nombreCorto: string;
  descripcion: string;
  color: string;
  icono: string;
  campo: string;        // Campo en el modelo Proyecto (ej: 'avanceDiseno')
}

// ============================================================
// IMPORTANTE: Asegúrate de que estos IdArea coincidan 
// EXACTAMENTE con los IDs en tu tabla AreaProduccion
// ============================================================

export const AREAS_PRODUCCION: AreaProduccion[] = [
  {
    id: 1,
    idArea: 1,  // ⭐ ID de la tabla AreaProduccion - VERIFICA ESTE VALOR
    nombre: 'Diseño y Desarrollo',
    nombreCorto: 'Diseño',
    descripcion: 'Diseño de patrones, muestras y desarrollo técnico',
    color: '#9c27b0',
    icono: 'fa-pencil-ruler',
    campo: 'avanceDiseno'
  },
  {
    id: 2,
    idArea: 2,  // ⭐ ID de la tabla AreaProduccion - VERIFICA ESTE VALOR
    nombre: 'Corte',
    nombreCorto: 'Corte',
    descripcion: 'Corte de telas y materiales según patrones',
    color: '#f44336',
    icono: 'fa-cut',
    campo: 'avanceCorte'
  },
  {
    id: 3,
    idArea: 3,  // ⭐ ID de la tabla AreaProduccion - VERIFICA ESTE VALOR
    nombre: 'Confección',
    nombreCorto: 'Confección',
    descripcion: 'Armado y costura de las prendas',
    color: '#ff9800',
    icono: 'fa-tshirt',
    campo: 'avanceConfeccion'
  },
  {
    id: 4,
    idArea: 4,  // ⭐ ID de la tabla AreaProduccion - VERIFICA ESTE VALOR
    nombre: 'Control de Calidad',
    nombreCorto: 'Calidad',
    descripcion: 'Inspección y control de calidad de las prendas',
    color: '#4caf50',
    icono: 'fa-check-circle',
    campo: 'avanceCalidadPrenda'
  },
  {
    id: 5,
    idArea: 5,  // ⭐ ID de la tabla AreaProduccion - VERIFICA ESTE VALOR
    nombre: 'Etiquetado y Empaquetado',
    nombreCorto: 'Empaquetado',
    descripcion: 'Etiquetado, empaquetado y preparación para despacho',
    color: '#2196f3',
    icono: 'fa-box',
    campo: 'avanceEtiquetadoEmpaquetado'
  }
];

// ============================================================
// FUNCIONES HELPER
// ============================================================

export interface ResumenAreas {
  completadas: number;
  enProgreso: number;
  pendientes: number;
}

export function getAreaActual(proyecto: any): AreaProduccion | undefined {
  return AREAS_PRODUCCION.find(area => {
    const avance = proyecto[area.campo] ?? 0;
    return avance > 0 && avance < 100;
  }) || AREAS_PRODUCCION.find(area => {
    const avance = proyecto[area.campo] ?? 0;
    return avance === 0;
  });
}

export function getSiguienteArea(areaActual: AreaProduccion): AreaProduccion | undefined {
  const indice = AREAS_PRODUCCION.findIndex(a => a.id === areaActual.id);
  return indice >= 0 && indice < AREAS_PRODUCCION.length - 1 
    ? AREAS_PRODUCCION[indice + 1] 
    : undefined;
}

export function areaEstaCompleta(proyecto: any, area: AreaProduccion): boolean {
  return (proyecto[area.campo] ?? 0) === 100;
}

export function areaEnProgreso(proyecto: any, area: AreaProduccion): boolean {
  const avance = proyecto[area.campo] ?? 0;
  return avance > 0 && avance < 100;
}

export function areaPendiente(proyecto: any, area: AreaProduccion): boolean {
  return (proyecto[area.campo] ?? 0) === 0;
}

export function calcularProgresoGeneralPorAreas(proyecto: any): number {
  const avances = AREAS_PRODUCCION.map(area => proyecto[area.campo] ?? 0);
  const suma = avances.reduce((acc, val) => acc + val, 0);
  return Math.round(suma / AREAS_PRODUCCION.length);
}

export function getResumenAreas(proyecto: any): ResumenAreas {
  let completadas = 0;
  let enProgreso = 0;
  let pendientes = 0;

  AREAS_PRODUCCION.forEach(area => {
    if (areaEstaCompleta(proyecto, area)) {
      completadas++;
    } else if (areaEnProgreso(proyecto, area)) {
      enProgreso++;
    } else {
      pendientes++;
    }
  });

  return { completadas, enProgreso, pendientes };
}

// ============================================================
// INSTRUCCIONES PARA OBTENER LOS IdArea CORRECTOS:
//
// Ejecuta esta query en tu base de datos:
// 
// SELECT IdArea, NombreArea, Orden 
// FROM AreaProduccion 
// ORDER BY Orden;
//
// Y actualiza los valores de idArea en el array AREAS_PRODUCCION
// según corresponda con los nombres.
// ============================================================