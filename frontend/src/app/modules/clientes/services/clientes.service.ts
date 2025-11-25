import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Cliente } from '../models/cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private clientes: Cliente[] = [
    { id: 1, nombre: 'Octavio', apellido: 'Rodriguez', empresa: 'Tamarindo', email: 'octaro@gmail.com' },
    { id: 2, nombre: 'Alan', apellido: 'Turing', empresa: 'Walmart', email: 'turingalan@gmail.com' },
    { id: 3, nombre: 'Davo', apellido: 'Xeneize', empresa: 'Puerrul', email: 'bover@gmail.com' }
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
