export interface Taller {
  idTaller: number;
  nombreTaller: string;
  tipoTaller?: string;
  responsable?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  idCiudad: number;
  idProvincia: number;
  nombreCiudad?: string;
  nombreProvincia?: string;
  cantidadProyectosAsignados?: number;
  fechaUltimaAsignacion?: string;
}

export interface NuevoTaller {
  nombreTaller: string;
  tipoTaller?: string;
  responsable?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  idCiudad: number;
  idProvincia?: number;
}

export interface ActualizarTaller extends NuevoTaller {
  idTaller: number;
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
