export interface OrdenCompra {
  idOrdenCompra: number;
  nroOrden: string;
  idProveedor: number;
  nombreProveedor?: string;
  idProyecto?: number;
  nombreProyecto?: string;
  descripcion?: string;
  fechaSolicitud: string;
  fechaEntregaEstimada?: string;
  estado: string;
  totalOrden: number;
  fechaHabilitacionControl?: string;
  fechaRecepcionControl?: string;
  observacionControl?: string;
  detalles?: DetalleOrdenCompra[];
}

export interface DetalleOrdenCompra {
  idDetalle?: number;
  idInsumo: number;
  nombreInsumo?: string;
  colorInsumo?: string;
  cantidad: number;
  cantidadRecibida: number;
  diferencia: number;
  estadoRecepcion: 'Satisfecho' | 'Sobrante' | 'Faltante' | 'Pendiente';
  precioUnitario: number;
  subtotal: number;
}

export interface NuevaOrdenCompra {
  idProveedor: number;
  idProyecto?: number;
  descripcion?: string;
  fechaSolicitud: string;
  fechaEntregaEstimada?: string;
  totalOrden: number;
  detalles: DetalleOrdenCompraDTO[];
}

export interface DetalleOrdenCompraDTO {
  idInsumo: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  nuevoNombreInsumo?: string;
  nuevoIdTipoInsumo?: number;
  nuevoColor?: string;
  nuevoUnidadMedida?: string;
}

export interface Proveedor {
  idProveedor: number;
  nombreProveedor: string;
  cuit?: string;
}

export interface Insumo {
  idInsumo: number;
  nombreInsumo: string;
  stockActual: number;
  unidadMedida: string;
  idProveedor?: number;
  color?: string;
  precioUnitario?: number;
}
