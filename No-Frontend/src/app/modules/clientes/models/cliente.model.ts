export interface Cliente {
  idCliente: number;
  
  // Campo calculado por el backend
  nombreCompleto?: string;
  
  // Campos según tipo (Física o Jurídica)
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
  
  // Ubicación (IDs)
  idCiudad: number;
  idProvincia: number;
  
  // Ubicación (Nombres - enviados por el backend)
  nombreCiudad?: string;
  nombreProvincia?: string;
  
  // Estado (Nombre - enviado por el backend)
  nombreEstado?: string; // "Activo", "Inactivo", etc.
  
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
  tipoDocumento?: string;
  numeroDocumento?: string;
  tipoCliente: string;
  telefono: string;
  email: string;
  idEstadoCliente: number;
  idCiudad?: number;
  idProvincia?: number;
  direccion?: string;
  codigoPostal?: string;
  observaciones?: string;
  cuitCuil?: string;
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