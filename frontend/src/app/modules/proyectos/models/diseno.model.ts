export interface ProyectoResumenDiseno {
  idProyecto: number;
  cliente: string;
  nombreProyecto: string;
  prioridad?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  areaCompletada: boolean;
  estadoArea: 'Pendiente' | 'EnProceso' | 'Completado' | string;
  idMuestra?: number | null;
  nombreMuestra?: string | null;
  prendas: ProyectoResumenDisenoPrenda[];
}

export interface ProyectoResumenDisenoPrenda {
  idProyectoPrenda: number;
  tipoPrenda: string;
  materialBase?: string | null;
  cantidadTotal: number;
  tieneBordado: boolean;
  tieneEstampado: boolean;
  descripcionDiseno?: string | null;
  talles: ProyectoResumenDisenoTalle[];
}

export interface ProyectoResumenDisenoTalle {
  idTalle: number;
  nombreTalle: string;
  cantidad: number;
}

export interface ProyectoDisenoDetalle {
  idProyecto: number;
  completado: boolean;
  estadoArea: 'Pendiente' | 'EnProceso' | 'Completado' | string;
  fechaCompletado?: string | null;
  observacionesGenerales?: string | null;
  prendas: ProyectoDisenoDetallePrenda[];
}

export interface ProyectoDisenoDetallePrenda {
  idDiseno: number;
  idPrenda: number;
  imagenLogo?: string | null;
  descripcionLogo?: string | null;
  imagenMockup?: string | null;
  descripcionMockup?: string | null;
  imagenBordado?: string | null;
  descripcionBordado?: string | null;
  imagenEstampado?: string | null;
  descripcionEstampado?: string | null;
}

export interface ProyectoDisenoPayload {
  prendas: ProyectoDisenoPayloadPrenda[];
  observacionesGenerales?: string;
}

export interface ProyectoDisenoPayloadPrenda {
  idPrenda: number;
  imagenLogo?: string;
  descripcionLogo?: string;
  imagenMockup: string;
  descripcionMockup?: string;
  imagenBordado?: string;
  descripcionBordado?: string;
  imagenEstampado?: string;
  descripcionEstampado?: string;
}
