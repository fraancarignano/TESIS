import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Cliente } from '../models/cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private clientes: Cliente[] = [
    { 
      id: 1, 
      nombre: 'Octavio', 
      apellido: 'Rodriguez', 
      telefono: '+54 351 123-4567',
      empresa: 'Tamarindo', 
      email: 'octaro@gmail.com',
      razonSocial: 'Tamarindo S.A.',
      cuit: '20-12345678-9',
      tipoCliente: 'Mayorista',
      observaciones: 'Cliente frecuente, pago puntual'
    },
    { 
      id: 2, 
      nombre: 'Alan', 
      apellido: 'Turing', 
      telefono: '+54 11 9876-5432',
      empresa: 'Walmart', 
      email: 'turingalan@gmail.com',
      razonSocial: 'Walmart Argentina S.R.L.',
      cuit: '30-98765432-1',
      tipoCliente: 'Corporativo',
      observaciones: 'Requiere factura A'
    },
    { 
      id: 3, 
      nombre: 'Davo', 
      apellido: 'Xeneize', 
      telefono: '+54 341 555-8899',
      empresa: 'Puerrul', 
      email: 'bover@gmail.com',
      razonSocial: 'Puerrul S.A.',
      cuit: '27-55588899-3',
      tipoCliente: 'Minorista',
      observaciones: ''
    }
  ];

  private clientesSubject = new BehaviorSubject<Cliente[]>(this.clientes);

  getClientes(): Observable<Cliente[]> {
    return this.clientesSubject.asObservable();
  }

  agregarCliente(cliente: Cliente): void {
    const nuevoId = Math.max(...this.clientes.map(c => c.id || 0)) + 1;
    const nuevoCliente = { ...cliente, id: nuevoId };
    this.clientes.push(nuevoCliente);
    this.clientesSubject.next([...this.clientes]);
  }

  actualizarCliente(cliente: Cliente): void {
    const index = this.clientes.findIndex(c => c.id === cliente.id);
    if (index !== -1) {
      this.clientes[index] = cliente;
      this.clientesSubject.next([...this.clientes]);
    }
  }

  eliminarCliente(id: number): void {
    this.clientes = this.clientes.filter(c => c.id !== id);
    this.clientesSubject.next([...this.clientes]);
  }
}