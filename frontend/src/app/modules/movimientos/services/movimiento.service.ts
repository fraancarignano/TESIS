import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Movimiento, MovimientoSearch } from '../models/movimiento.model';

@Injectable({
    providedIn: 'root'
})
export class MovimientoService {
    private apiUrl = `${environment.apiUrl}/Movimiento`;

    constructor(private http: HttpClient) { }

    buscarMovimientos(filtros: MovimientoSearch): Observable<Movimiento[]> {
        return this.http.post<Movimiento[]>(`${this.apiUrl}/buscar`, filtros);
    }
}
