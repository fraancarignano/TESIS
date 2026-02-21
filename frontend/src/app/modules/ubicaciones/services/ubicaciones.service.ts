import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Insumo } from '../../inventario/models/insumo.model';

export interface Ubicacion {
    idUbicacion?: number;
    codigo: string;
    rack: number;
    division: number;
    espacio: number;
    descripcion?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UbicacionesService {
    private apiUrl = `${environment.apiUrl}/Ubicacion`;

    constructor(private http: HttpClient) { }

    getUbicaciones(): Observable<Ubicacion[]> {
        return this.http.get<Ubicacion[]>(this.apiUrl);
    }

    getUbicacion(id: number): Observable<Ubicacion> {
        return this.http.get<Ubicacion>(`${this.apiUrl}/${id}`);
    }

    createUbicacion(ubicacion: Partial<Ubicacion>): Observable<Ubicacion> {
        return this.http.post<Ubicacion>(this.apiUrl, ubicacion);
    }

    updateUbicacion(id: number, ubicacion: Partial<Ubicacion>): Observable<Ubicacion> {
        return this.http.put<Ubicacion>(`${this.apiUrl}/${id}`, ubicacion);
    }

    deleteUbicacion(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    getInsumosPorUbicacion(id: number): Observable<Insumo[]> {
        return this.http.get<Insumo[]>(`${this.apiUrl}/${id}/insumos`);
    }
}
