export interface LoginCredentials {
  nombreUsuario: string;
  contraseña: string;
}

export interface LoginResponse {
  token: string;
  idUsuario: number;
  nombreUsuario: string;
  apellidoUsuario?: string;
  email: string;
  idRol?: number;
  estado?: string;
  fechaCreacion?: string;
  ultimoAcceso?: string | null;
}

export interface UsuarioCreate {
  nombreUsuario: string;
  apellidoUsuario: string;
  email: string;
  contraseña: string;
  nombreRol: string; // 'Administrador', 'Operador', 'Supervisor'
}

export interface Usuario {
  idUsuario: number;
  nombreUsuario: string;
  apellidoUsuario: string;
  email: string;
  nombreRol: string;
  estado: string;
  fechaCreacion: string;
  ultimoAcceso: string | null;
}

export interface Rol {
  idRol: number;
  nombreRol: string;
}

export interface ApiError {
  message: string;
  errors?: any;
  detalles?: string[];
}