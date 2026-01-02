import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Insumo, TipoInsumo, Proveedor } from '../models/insumo.model';

@Injectable({
  providedIn: 'root'
})
export class InsumosService {
  // Datos mock de tipos de insumo
  private tiposInsumo: TipoInsumo[] = [
    { idTipoInsumo: 1, nombreTipo: 'Cuerinas', descripcion: 'Materiales tipo cuero' },
    { idTipoInsumo: 2, nombreTipo: 'Friselina', descripcion: 'Telas no tejidas' },
    { idTipoInsumo: 3, nombreTipo: 'Botones', descripcion: 'Accesorios de cierre' },
    { idTipoInsumo: 4, nombreTipo: 'Hilos', descripcion: 'Materiales de costura' }
  ];

  // Datos mock de proveedores
  private proveedores: Proveedor[] = [
    { idProveedor: 1, nombreProveedor: 'JJhonson', cuit: '20-12345678-9' },
    { idProveedor: 2, nombreProveedor: 'Aton', cuit: '30-98765432-1' },
    { idProveedor: 3, nombreProveedor: 'TextilPro', cuit: '27-55588899-3' }
  ];

  // Datos mock de insumos
  private insumos: Insumo[] = [
    {
      idInsumo: 1,
      nombreInsumo: 'CueRol',
      idTipoInsumo: 1,
      tipoInsumo: this.tiposInsumo[0],
      unidadMedida: 'Kg',
      stockActual: 20,
      stockMinimo: 10,
      fechaActualizacion: '2024-12-10',
      idProveedor: 1,
      proveedor: this.proveedores[0],
      estado: 'En uso'
    },
    {
      idInsumo: 2,
      nombreInsumo: 'Friz24',
      idTipoInsumo: 2,
      tipoInsumo: this.tiposInsumo[1],
      unidadMedida: 'Mts',
      stockActual: 12,
      stockMinimo: 15,
      fechaActualizacion: '2024-12-08',
      idProveedor: 1,
      proveedor: this.proveedores[0],
      estado: 'En uso'
    },
    {
      idInsumo: 3,
      nombreInsumo: 'Boton Clarc',
      idTipoInsumo: 3,
      tipoInsumo: this.tiposInsumo[2],
      unidadMedida: 'Un',
      stockActual: 100,
      stockMinimo: 50,
      fechaActualizacion: '2024-12-12',
      idProveedor: 2,
      proveedor: this.proveedores[1],
      estado: 'A designar'
    },
    {
      idInsumo: 4,
      nombreInsumo: 'Hilo Poliester',
      idTipoInsumo: 4,
      tipoInsumo: this.tiposInsumo[3],
      unidadMedida: 'Mts',
      stockActual: 5,
      stockMinimo: 20,
      fechaActualizacion: '2024-12-05',
      idProveedor: 3,
      proveedor: this.proveedores[2],
      estado: 'Agotado'
    }
  ];

  private insumosSubject = new BehaviorSubject<Insumo[]>(this.insumos);

  getInsumos(): Observable<Insumo[]> {
    return this.insumosSubject.asObservable();
  }

  getTiposInsumo(): TipoInsumo[] {
    return this.tiposInsumo;
  }

  getProveedores(): Proveedor[] {
    return this.proveedores;
  }

  agregarInsumo(insumo: Insumo): void {
    const nuevoId = Math.max(...this.insumos.map(i => i.idInsumo || 0)) + 1;
    
    // Buscar el tipo de insumo y proveedor para incluirlos
    const tipo = this.tiposInsumo.find(t => t.idTipoInsumo === insumo.idTipoInsumo);
    const proveedor = this.proveedores.find(p => p.idProveedor === insumo.idProveedor);
    
    const nuevoInsumo = { 
      ...insumo, 
      idInsumo: nuevoId,
      tipoInsumo: tipo,
      proveedor: proveedor,
      fechaActualizacion: new Date().toISOString().split('T')[0]
    };
    
    this.insumos.push(nuevoInsumo);
    this.insumosSubject.next([...this.insumos]);
  }

  actualizarInsumo(insumo: Insumo): void {
    const index = this.insumos.findIndex(i => i.idInsumo === insumo.idInsumo);
    if (index !== -1) {
      // Buscar el tipo de insumo y proveedor para incluirlos
      const tipo = this.tiposInsumo.find(t => t.idTipoInsumo === insumo.idTipoInsumo);
      const proveedor = this.proveedores.find(p => p.idProveedor === insumo.idProveedor);
      
      this.insumos[index] = {
        ...insumo,
        tipoInsumo: tipo,
        proveedor: proveedor,
        fechaActualizacion: new Date().toISOString().split('T')[0]
      };
      this.insumosSubject.next([...this.insumos]);
    }
  }

  eliminarInsumo(id: number): void {
    this.insumos = this.insumos.filter(i => i.idInsumo !== id);
    this.insumosSubject.next([...this.insumos]);
  }

  cambiarEstado(id: number, nuevoEstado: string): void {
    const index = this.insumos.findIndex(i => i.idInsumo === id);
    if (index !== -1) {
      this.insumos[index].estado = nuevoEstado;
      this.insumosSubject.next([...this.insumos]);
    }
  }
}