export interface OrdenCompra {
  idOrdenCompra: number;
  nroOrden: string;
  idProveedor: number;
  nombreProveedor?: string;
  fechaSolicitud: string;
  fechaEntregaEstimada?: string;
  estado: string;
  totalOrden: number;
  detalles?: DetalleOrdenCompra[];
}

export interface DetalleOrdenCompra {
  idDetalle?: number;
  idInsumo: number;
  nombreInsumo?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface NuevaOrdenCompra {
  nroOrden: string;
  idProveedor: number;
  fechaSolicitud: string;
  fechaEntregaEstimada?: string;
  estado: string;
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