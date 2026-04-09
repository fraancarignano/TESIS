export interface OrdenCompra {
  idOrdenCompra: number;
  nroOrden: string;
  idProveedor: number;
  nombreProveedor?: string;
  descripcion?: string;
  fechaSolicitud: string;
  fechaEntregaEstimada?: string;
  estado: string;
  totalOrden: number;
  // Control de Recepción
  fechaHabilitacionControl?: string;
  fechaRecepcionControl?: string;
  observacionControl?: string;
  detalles?: DetalleOrdenCompra[];
}

export interface DetalleOrdenCompra {
  idDetalle?: number;
  idInsumo: number;
  nombreInsumo?: string;
  cantidad: number;
  cantidadRecibida: number;
  diferencia: number;
  estadoRecepcion: 'Satisfecho' | 'Sobrante' | 'Faltante' | 'Pendiente';
  precioUnitario: number;
  subtotal: number;
}

export interface NuevaOrdenCompra {
  idProveedor: number;
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
}