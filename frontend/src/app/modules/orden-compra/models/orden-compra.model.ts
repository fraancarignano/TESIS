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
  descripcion?: string;
  fechaSolicitud: string;
  fechaEntregaEstimada?: string;
  totalOrden: number;
  detalles: DetalleOrdenCompraDTO[];
}

export interface DetalleOrdenCompraDTO {
  idInsumo: number;       // 0 si es insumo nuevo
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  // Campos para insumo nuevo (solo cuando idInsumo === 0)
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
}