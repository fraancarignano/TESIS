export interface TipoInsumo {
  idTipoInsumo: number;
  nombreTipo: string;
  descripcion?: string;
}

export interface Proveedor {
  idProveedor: number;
  nombreProveedor: string;
  cuit?: string;
}

export interface ProyectoAsignado {
  idProyecto: number;
  nombreProyecto: string;
  codigoProyecto: string;
  cantidad: number;
  unidadMedida: string;
  tipoCalculo: string;
  nombrePrenda?: string;
}

export interface InsumoStock {
  idInsumoStock: number;
  idInsumo: number;
  idProyecto?: number;
  nombreProyecto?: string;
  codigoProyecto?: string;
  idUbicacion?: number;
  codigoUbicacion?: string;
  estadoUbicacion?: string;
  idOrdenCompra?: number;
  nroOrden?: string;
  cantidad: number;
  fechaActualizacion: string;
  /** Estado del proyecto (Pendiente, En Proceso, Finalizado, Despachado…) */
  estadoProyecto?: string;
  /** Área actual del proyecto (Corte, Confección, Control de Calidad…) */
  areaActualProyecto?: string;
  /** True cuando la edición manual de stock está bloqueada por etapa del proyecto */
  stockBloqueado?: boolean;
  /** Mensaje explicativo del bloqueo */
  motivoBloqueado?: string;
}

export interface Insumo {
  idInsumo?: number;
  nombreInsumo: string;
  idTipoInsumo: number;
  tipoInsumo?: TipoInsumo;
  unidadMedida: string;
  stockActual: number;
  stockMinimo?: number;
  fechaActualizacion: string;
  idProveedor?: number;
  proveedor?: Proveedor;
  nombreProveedor?: string;
  idUbicacion?: number;
  codigoUbicacion?: string;
  estadoUbicacion?: string;
  nombreTipoInsumo?: string;
  estado?: string;
  color?: string;
  tipoTela?: string;
  precioUnitario?: number;
  proyectosAsignados?: ProyectoAsignado[];
  detalleStock?: InsumoStock[];
}
