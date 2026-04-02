export interface Despacho {
  idDespacho: number;
  idProyecto: number;
  nombreProyecto: string;
  cliente: string;
  codigoDespacho: string;
  idUbicacion?: number;
  codigoUbicacion?: string;
  estado: string;
  observaciones?: string;
  fechaCreacion: string;
  fechaDespacho?: string;
}

export interface CreateDespachoDTO {
  idProyecto: number;
  observaciones?: string;
}

export interface AsignarUbicacionDTO {
  idUbicacion: number;
}
