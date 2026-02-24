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
  idOrdenCompra?: number;
  nroOrden?: string;
  cantidad: number;
  fechaActualizacion: string;
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
  nombreTipoInsumo?: string;
  estado?: string;
  proyectosAsignados?: ProyectoAsignado[];
  detalleStock?: InsumoStock[];
}
