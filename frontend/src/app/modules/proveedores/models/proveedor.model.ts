export interface Proveedor {
  idProveedor: number;
  nombreProveedor: string;
  cuit: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  idCiudad?: number;
  idProvincia?: number;
  nombreCiudad?: string;
  nombreProvincia?: string;
  observaciones?: string;
  fechaAlta?: string;
}

export interface NuevoProveedor {
  nombreProveedor: string;
  cuit: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  idCiudad?: number;
  idProvincia?: number;
  observaciones?: string;
}

export interface ActualizarProveedor extends NuevoProveedor {
  idProveedor: number;
}

export interface Provincia {
  idProvincia: number;
  nombre: string;
}

export interface Ciudad {
  idCiudad: number;
  nombre: string;
  idProvincia: number;
}
