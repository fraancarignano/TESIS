export interface Cliente {
  id?: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  empresa: string;
  razonSocial?: string;
  cuit: string;
  tipoCliente: string;
  observaciones?: string;
}