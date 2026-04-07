export interface MuestraDetalle {
  idMuestra: number;
  idCliente: number;
  nombreCliente?: string | null;
  nombreMuestra: string;
  descripcion?: string | null;
  prioridad?: string | null;
  estado: string;
  fechaCreacion: string;
  fechaEntrega?: string | null;
  idUsuarioEncargado?: number | null;
  codigoMuestra?: string | null;
  idProyectoAsignado?: number | null;
  mockupUrl?: string | null;
  bordadoRequerido: boolean;
  bordadoDescripcion?: string | null;
  bordadoReferencia?: string | null;
  estampadoRequerido: boolean;
  estampadoDescripcion?: string | null;
  estampadoReferencia?: string | null;
  otrosDetalle?: string | null;
  paletaRgb?: string | null;
  prendas?: MuestraPrenda[];
}

export interface MuestraPrenda {
  idMuestraPrenda: number;
  idTipoPrenda: number;
  nombrePrenda?: string | null;
  idTipoInsumoMaterial: number;
  nombreMaterial?: string | null;
  colorTela?: string | null;
  tieneBordado: boolean;
  tieneEstampado: boolean;
  descripcionDiseno?: string | null;
}
