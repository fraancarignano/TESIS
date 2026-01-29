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

export interface Insumo {
  idInsumo?: number;
  nombreInsumo: string;
  idTipoInsumo: number;
  tipoInsumo?: TipoInsumo; // Para mostrar el nombre
  unidadMedida: string;
  stockActual: number;
  stockMinimo?: number;
  fechaActualizacion: string; // ISO date string
  idProveedor?: number;
  proveedor?: Proveedor; // Para mostrar el nombre
  estado?: string;
}