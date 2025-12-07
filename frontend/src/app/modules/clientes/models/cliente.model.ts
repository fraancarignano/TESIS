export interface Cliente {
  idCliente: number;
  // Campos según tipo (Física o Jurídica - NO se almacena)
  nombre?: string;  // Obligatorio si es Persona Física
  apellido?: string; // Obligatorio si es Persona Física
  razonSocial?: string; // Obligatorio si es Persona Jurídica
  
  // Tipo de documento
  tipoDocumento?: string; // 'DNI' o 'CUIT/CUIL'
  numeroDocumento?: string; // Obligatorio
  
  // Campos obligatorios
  tipoCliente: string; // Mayorista, Minorista, Otro
  telefono: string;
  email: string;
  idEstadoCliente: number; // Activo, Inactivo, Suspendido, En revisión
  idCiudad: number;
  idProvincia: number;
  
  // Campos opcionales
  direccion?: string;
  codigoPostal?: string;
  observaciones?: string;
  
  // Otros
  fechaAlta: string;
  cuitCuil?: string; // DEPRECATED - usar numeroDocumento
}

export interface NuevoCliente {
  nombre?: string;
  apellido?: string;
  razonSocial?: string;
  tipoDocumento: string;
  numeroDocumento: string;
  tipoCliente: string;
  telefono: string;
  email: string;
  idEstadoCliente: number;
  idCiudad: number;
  idProvincia: number;
  direccion?: string;
  codigoPostal?: string;
  observaciones?: string;
}

export interface ActualizarCliente extends NuevoCliente {
  idCliente: number;
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

export interface EstadoCliente {
  idEstadoCliente: number;
  nombre: string;
}