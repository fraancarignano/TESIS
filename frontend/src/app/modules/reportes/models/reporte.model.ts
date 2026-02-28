export interface ReporteClientesTemporadaRequest {
  anioInicio?: number;
  anioFin?: number;
  idCliente?: number;
  temporada?: string;
}

export interface ReporteClientesTemporadaItem {
  idCliente: number;
  cliente: string;
  tipoCliente: string;
  anio: number;
  temporada: string;
  cantidadProyectos: number;
  totalPrendas: number;
  proyectosFinalizados: number;
  proyectosCancelados: number;
}

export interface ReporteClientesTemporadaResponse {
  totalRegistros: number;
  fechaGeneracion: string;
  filtrosAplicados: ReporteClientesTemporadaRequest;
  items: ReporteClientesTemporadaItem[];
}
