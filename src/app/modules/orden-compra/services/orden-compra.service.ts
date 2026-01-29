import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrdenCompra, NuevaOrdenCompra, Proveedor, Insumo } from '../models/orden-compra.model';

@Injectable({
  providedIn: 'root'
})
export class OrdenCompraService {
  private apiUrl = 'https://localhost:7163/api/OrdenCompra';
  private proveedorUrl = 'https://localhost:7163/api/Proveedor';
  private insumoUrl = 'https://localhost:7163/api/Insumo';

  constructor(private http: HttpClient) {}

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

  // Proveedores
  obtenerProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.proveedorUrl);
  }

  // Insumos
  obtenerInsumos(): Observable<Insumo[]> {
    return this.http.get<Insumo[]>(this.insumoUrl);
  }
}