export interface ReporteClientesTemporadaRequest {
  fechaInicio?: string;
  fechaFin?: string;
  idCliente?: number;
}

export interface ReporteClientesTemporadaItem {
  idCliente: number;
  cliente: string;
  tipoCliente: string;
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
