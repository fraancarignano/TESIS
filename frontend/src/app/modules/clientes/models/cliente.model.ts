/**
 * Interface del modelo Cliente (para mostrar datos)
 * Corresponde a la tabla de clientes en la base de datos
 */
export interface Cliente {
  id?: number;
  nombreApellido: string;
  telefono: string;
  email: string;
  razonSocial?: string;
  cuit: string;
  tipoCliente: string;
  idEstadoCliente?: number;
  estadoCliente?: {
    id: number;
    nombre: string;
  };
  fechaAlta: string | Date;
  observaciones?: string;
  idDireccion?: number;
}

/**
 * Tipos de cliente disponibles
 */
export enum TipoCliente {
  REGULAR = 'Regular',
  PREMIUM = 'Premium',
  CORPORATIVO = 'Corporativo',
  GOBIERNO = 'Gobierno'
}

/**
 * Estados de cliente disponibles
 */
export enum EstadoCliente {
  ACTIVO = 1,
  INACTIVO = 2,
  SUSPENDIDO = 3
}

/**
 * DTO para crear un nuevo cliente
 * ⭐ Usa PascalCase para coincidir con el backend C#
 */
export interface NuevoCliente {
  NombreApellido: string;
  Telefono: string;
  Email: string;
  RazonSocial?: string;
  Cuit: string;
  TipoCliente: string;
  IdEstadoCliente: number;
  Observaciones?: string;
  IdDireccion?: number;
}

/**
 * DTO para actualizar un cliente existente
 * ⭐ Usa PascalCase para coincidir con el backend C#
 */
export interface ActualizarCliente {
  id: number;  // ← id en minúscula para la URL
  NombreApellido: string;
  Telefono: string;
  Email: string;
  RazonSocial?: string;
  Cuit: string;
  TipoCliente: string;
  IdEstadoCliente: number;
  Observaciones?: string;
  IdDireccion?: number;
}