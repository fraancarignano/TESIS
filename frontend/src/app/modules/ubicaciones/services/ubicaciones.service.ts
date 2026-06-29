import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Insumo } from '../../inventario/models/insumo.model';

export interface Ubicacion {
    idUbicacion?: number;
    codigo: string;
    nombre?: string;      // Nombre descriptivo (ej: Pasillo A)
    tipo?: string;        // 'Rack' | 'Despacho' | 'Scrap' | 'Virtual' | 'Otro'
    rack: number;
    division: number;
    espacio: number;
    descripcion?: string;
    estadoUbicacion?: string; // 'Activa' | 'Ocupado' | 'BloqIN' | 'BloqOUT'
}

export interface ScrapUbicacionItem {
    idScrap: number;
    idProyecto: number;
    codigoProyecto?: string;
    nombreProyecto?: string;
    idInsumo: number;
    nombreInsumo: string;
    cantidadKg: number;
    motivo?: string;
    areaOcurrencia?: string;
    fechaRegistro: string;
}

export interface InventarioScrap {
    idInsumo: number;
    nombreInsumo: string;
    cantidadTotalKg: number;
    cantidadProyectos: number;
    ultimoRegistro: string;
}

export interface ScrapProyectoInsumo {
    idInsumo: number;
    nombreInsumo: string;
    color?: string;
    unidadMedida?: string;
    cantidadAsignada: number;
    stockProyecto: number;
    cantidadTransferir?: number;
    motivo?: string;
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

    getInventarioScrapGeneral(): Observable<InventarioScrap[]> {
        return this.http.get<InventarioScrap[]>(`${this.apiUrl}/scraps/inventario`);
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

    /** Cambia solo el estado operativo de una ubicación */
    cambiarEstadoUbicacion(id: number, estadoUbicacion: string): Observable<Ubicacion> {
        return this.http.patch<Ubicacion>(`${this.apiUrl}/${id}/estado`, { estadoUbicacion });
    }

    getInsumosPorUbicacion(id: number): Observable<Insumo[]> {
        return this.http.get<Insumo[]>(`${this.apiUrl}/${id}/insumos`);
    }

    getProyectosPorUbicacion(id: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${id}/proyectos`);
    }

    getScrapsPorUbicacion(id: number): Observable<ScrapUbicacionItem[]> {
        return this.http.get<ScrapUbicacionItem[]>(`${this.apiUrl}/${id}/scraps`);
    }

    transferirDesdeOrden(transferDto: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/transfer`, transferDto);
    }

    getInsumosProyectoParaScrap(idProyecto: number): Observable<ScrapProyectoInsumo[]> {
        return this.http.get<ScrapProyectoInsumo[]>(`${this.apiUrl}/scrap/proyecto/${idProyecto}/insumos`);
    }

    getScrapsProyectoParaTransferencia(idProyecto: number): Observable<ScrapProyectoInsumo[]> {
        return this.http.get<ScrapProyectoInsumo[]>(`${this.apiUrl}/scrap/proyecto/${idProyecto}/disponibles`);
    }

    transferirProyectoAScrap(transferDto: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/scrap/proyecto-a-scrap`, transferDto);
    }

    transferirScrapAProyecto(transferDto: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/scrap/scrap-a-proyecto`, transferDto);
    }
}
