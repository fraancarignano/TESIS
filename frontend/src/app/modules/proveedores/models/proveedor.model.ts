export interface Proveedor {
  idProveedor: number;
  nombreProveedor: string;
  cuit: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  observaciones?: string;
  fechaAlta?: string;
}

export interface NuevoProveedor {
  nombreProveedor: string;
  cuit: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  observaciones?: string;
}

export interface ActualizarProveedor extends NuevoProveedor {
  idProveedor: number;
}
