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
  estado?: string;
  proyectosAsignados?: ProyectoAsignado[];
}