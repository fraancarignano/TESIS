export interface UsuarioInterno {
  idUsuario: number;
  nombre: string;
  apellido: string;
  nombreUsuarioIngreso: string;
  idRol: number;
  nombreRol: string;
  estado: string;
  fechaCreacion: string;
  ultimoAcceso?: string | null;
  subRolesAreaIds?: number[];
}

export interface RolUsuario {
  idRol: number;
  nombreRol: string;
}

export interface AreaSubrol {
  idArea: number;
  nombreArea: string;
}

export interface UsuarioInternoCreate {
  nombre: string;
  apellido: string;
  nombreUsuarioIngreso: string;
  contrasena: string;
  idRol: number;
  subRolesAreaIds?: number[];
}

export interface UsuarioInternoUpdate {
  nombre: string;
  apellido: string;
  nombreUsuarioIngreso: string;
  contrasena?: string;
  idRol: number;
  estado: string;
  subRolesAreaIds?: number[];
}

export interface UsuarioAuditoriaEvento {
  accion: string;
  modulo?: string;
  fechaAccion: string;
}

export interface UsuarioAuditoria {
  idUsuario: number;
  fechaCreacion: string;
  ultimoAcceso?: string | null;
  eventos: UsuarioAuditoriaEvento[];
}
