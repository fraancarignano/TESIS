import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of, concat } from 'rxjs';
import { catchError, finalize, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { MuestraDetalle } from '../models/muestra.model';

@Injectable({
  providedIn: 'root'
})
export class MuestrasService {
  private apiUrl = `${environment.apiUrl}/Muestra`;
  private readonly cacheKey = 'muestras_cache_v1';
  private readonly cacheTimestampKey = 'muestras_cache_v1_ts';
  private readonly cacheTtlMs = 5 * 60 * 1000;

  private muestrasSubject = new BehaviorSubject<MuestraDetalle[]>([]);
  public muestras$ = this.muestrasSubject.asObservable();
  private fetchEnCurso$?: Observable<MuestraDetalle[]>;

  constructor(private http: HttpClient) {}

  obtenerMuestras(): Observable<MuestraDetalle[]> {
    return this.obtenerMuestrasDesdeApi();
  }

  obtenerMuestrasConCache(): Observable<MuestraDetalle[]> {
    const cache = this.obtenerCacheValido();
    if (!cache) {
      return this.obtenerMuestrasDesdeApi();
    }

    this.muestrasSubject.next(cache);
    return concat(
      of(cache),
      this.obtenerMuestrasDesdeApi().pipe(
        catchError(() => of(cache))
      )
    );
  }

  obtenerMuestraPorId(id: number): Observable<MuestraDetalle> {
    return this.http.get<MuestraDetalle>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  actualizarMuestra(id: number, dto: any): Observable<MuestraDetalle> {
    return this.http.put<MuestraDetalle>(`${this.apiUrl}/${id}`, dto).pipe(
      catchError(this.handleError)
    );
  }

  aceptarMuestra(id: number, comentario?: string): Observable<any> {
    const payload = comentario ? { comentario } : null;
    return this.http.put(`${this.apiUrl}/${id}/aceptar`, payload).pipe(
      catchError(this.handleError)
    );
  }

  rechazarMuestra(id: number, comentario: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/rechazar`, { comentario }).pipe(
      catchError(this.handleError)
    );
  }

  asignarMuestraAProyecto(idMuestra: number, idProyecto: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${idMuestra}/asignar-proyecto/${idProyecto}`, {}).pipe(
      catchError(this.handleError)
    );
  }

  private obtenerMuestrasDesdeApi(): Observable<MuestraDetalle[]> {
    if (this.fetchEnCurso$) {
      return this.fetchEnCurso$;
    }

    this.fetchEnCurso$ = this.http.get<MuestraDetalle[]>(this.apiUrl).pipe(
      tap(muestras => {
        this.muestrasSubject.next(muestras);
        this.guardarCache(muestras);
      }),
      catchError(this.handleError),
      finalize(() => {
        this.fetchEnCurso$ = undefined;
      }),
      shareReplay(1)
    );

    return this.fetchEnCurso$;
  }

  private obtenerCacheValido(): MuestraDetalle[] | null {
    try {
      const cacheRaw = localStorage.getItem(this.cacheKey);
      const tsRaw = localStorage.getItem(this.cacheTimestampKey);
      if (!cacheRaw || !tsRaw) return null;

      const ageMs = Date.now() - Number(tsRaw);
      if (Number.isNaN(ageMs) || ageMs > this.cacheTtlMs) {
        return null;
      }

      const muestras = JSON.parse(cacheRaw) as MuestraDetalle[];
      return Array.isArray(muestras) ? muestras : null;
    } catch {
      return null;
    }
  }

  private guardarCache(muestras: MuestraDetalle[]): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(muestras));
      localStorage.setItem(this.cacheTimestampKey, Date.now().toString());
    } catch {
      // Ignorar errores de almacenamiento local.
    }
  }

  private handleError(error: HttpErrorResponse) {
    console.error('HTTP Error:', error);

    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 404) {
        errorMessage = 'Muestra no encontrada';
      } else if (error.status === 400) {
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.errors) {
          const errors = error.error.errors;
          const errorMessages = Object.keys(errors).map(key =>
            `${key}: ${errors[key].join(', ')}`
          );
          errorMessage = errorMessages.join(' | ');
        } else if (error.error?.title) {
          errorMessage = error.error.title;
        } else {
          errorMessage = 'Datos inválidos. Verifica los campos.';
        }
      } else if (error.status === 0) {
        errorMessage = 'No se puede conectar con el servidor';
      } else {
        errorMessage = `Error del servidor: ${error.status}`;
      }
    }

    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      statusText: error.statusText,
      error: error.error
    }));
  }
}
