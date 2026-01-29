import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

export interface Ciudad {
  id: string;
  nombre: string;
  provincia: {
    id: string;
    nombre: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GeoService {
  private apiGeoUrl = 'https://apis.datos.gob.ar/georef/api';
  private busquedaSubject = new Subject<string>();

  constructor(private http: HttpClient) {}

  /**
   * Buscar ciudades por nombre con debounce
   */
  buscarCiudadesConDebounce(): Observable<Ciudad[]> {
    return this.busquedaSubject.pipe(
      debounceTime(300), // Espera 300ms después de que el usuario deje de escribir
      distinctUntilChanged(), // Solo si el valor cambió
      switchMap(termino => this.buscarCiudades(termino))
    );
  }

  /**
   * Emitir término de búsqueda
   */
  buscarTermino(termino: string): void {
    this.busquedaSubject.next(termino);
  }

  /**
   * Buscar ciudades por nombre
   */
  buscarCiudades(termino: string, provinciaId?: string): Observable<Ciudad[]> {
    if (!termino || termino.length < 3) {
      return of([]);
    }

    let url = `${this.apiGeoUrl}/localidades?nombre=${encodeURIComponent(termino)}&max=10`;
    
    if (provinciaId) {
      url += `&provincia=${provinciaId}`;
    }

    return this.http.get<any>(url).pipe(
      map(response => response.localidades || []),
      map(localidades => localidades.map((loc: any) => ({
        id: loc.id,
        nombre: loc.nombre,
        provincia: {
          id: loc.provincia.id,
          nombre: loc.provincia.nombre
        }
      }))),
      catchError(error => {
        console.error('Error al buscar ciudades:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener ciudades de una provincia específica
   */
  obtenerCiudadesPorProvincia(provinciaId: string, max: number = 100): Observable<Ciudad[]> {
    const url = `${this.apiGeoUrl}/localidades?provincia=${provinciaId}&max=${max}&campos=id,nombre`;
    
    return this.http.get<any>(url).pipe(
      map(response => response.localidades || []),
      map(localidades => localidades.map((loc: any) => ({
        id: loc.id,
        nombre: loc.nombre,
        provincia: {
          id: provinciaId,
          nombre: ''
        }
      }))),
      catchError(() => of([]))
    );
  }
}