import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrdenCompra, NuevaOrdenCompra, Proveedor, Insumo } from '../models/orden-compra.model';
import { OrdenCompraReceiveDTO } from '../models/orden-compra-receive.model';
import { environment } from '../../../../environments/environment';

export interface ControlRecepcionDTO {
  idOrdenCompra: number;
  idUsuarioControl: number;
  fechaControl: string;
  observacion?: string;
  detalles: { idInsumo: number; cantidadRecibida: number; observacionDetalle?: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class OrdenCompraService {
  private apiUrl = `${environment.apiUrl}/OrdenCompra`;
  private proveedorUrl = `${environment.apiUrl}/Proveedor`;
  private insumoUrl = `${environment.apiUrl}/Insumo`;

  constructor(private http: HttpClient) { }

  obtenerOrdenes(): Observable<OrdenCompra[]> {
    return this.http.get<OrdenCompra[]>(this.apiUrl);
  }

  obtenerOrdenPorId(id: number): Observable<OrdenCompra> {
    return this.http.get<OrdenCompra>(`${this.apiUrl}/${id}`);
  }

  crearOrden(orden: NuevaOrdenCompra): Observable<OrdenCompra> {
    return this.http.post<OrdenCompra>(this.apiUrl, orden);
  }

  actualizarOrden(id: number, orden: NuevaOrdenCompra): Observable<OrdenCompra> {
    return this.http.put<OrdenCompra>(`${this.apiUrl}/${id}`, orden);
  }

  eliminarOrden(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  registrarRecepcion(id: number, recepcion: OrdenCompraReceiveDTO): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/receive`, recepcion);
  }

  // ==================== CONTROL DE RECEPCIÓN ====================

  obtenerOrdenesPendienteControl(): Observable<OrdenCompra[]> {
    return this.http.get<OrdenCompra[]>(`${this.apiUrl}/pendiente-control`);
  }

  habilitarControl(id: number, idUsuarioAdmin: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/habilitar-control`, { idUsuarioAdmin });
  }

  registrarControlRecepcion(id: number, dto: ControlRecepcionDTO): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/control`, dto);
  }

  recalcularRecepcion(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/recalcular`, {});
  }

  // Proveedores
  obtenerProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.proveedorUrl);
  }

  // Insumos
  obtenerInsumos(): Observable<Insumo[]> {
    return this.http.get<Insumo[]>(this.insumoUrl);
  }
}
