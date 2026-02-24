import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Movimiento, MovimientoSearch } from '../models/movimiento.model';
import { MovimientoService } from '../services/movimiento.service';

import { InsumosService } from '../../inventario/services/insumos.service';
import { Insumo } from '../../inventario/models/insumo.model';

@Component({
    selector: 'app-movimientos',
    templateUrl: './movimientos.component.html',
    styleUrls: ['./movimientos.component.css'],
    standalone: true,
    imports: [CommonModule, FormsModule]
})
export class MovimientosComponent implements OnInit {
    movimientos: Movimiento[] = [];
    filtros: MovimientoSearch = {
        fechaDesde: '',
        fechaHasta: '',
        terminoBusqueda: ''
    };
    cargando: boolean = false;

    // Autocomplete intelligent search
    insumosCatalogo: Insumo[] = [];
    insumosFiltrados: Insumo[] = [];
    mostrarResultados: boolean = false;

    constructor(
        private movimientoService: MovimientoService,
        private insumosService: InsumosService
    ) { }

    ngOnInit(): void {
        this.consultar();
        this.cargarCatalogo();
    }

    cargarCatalogo(): void {
        this.insumosService.getInsumos().subscribe({
            next: (data) => this.insumosCatalogo = data,
            error: (err) => console.error('Error al cargar catálogo para autocompletado', err)
        });
    }

    onSearchChange(): void {
        const term = this.filtros.terminoBusqueda?.trim().toLowerCase();
        if (!term) {
            this.insumosFiltrados = [];
            this.mostrarResultados = false;
            return;
        }

        this.insumosFiltrados = this.insumosCatalogo.filter(i =>
            i.nombreInsumo.toLowerCase().includes(term)
        );
        this.mostrarResultados = this.insumosFiltrados.length > 0;
    }

    seleccionarInsumo(nombre: string): void {
        this.filtros.terminoBusqueda = nombre;
        this.mostrarResultados = false;
        this.consultar();
    }

    consultar(): void {
        this.cargando = true;
        this.movimientoService.buscarMovimientos(this.filtros).subscribe({
            next: (data) => {
                this.movimientos = data;
                this.cargando = false;
            },
            error: (err) => {
                console.error('Error al consultar movimientos', err);
                this.cargando = false;
            }
        });
    }

    getBadgeClass(tipo: string): string {
        if (!tipo) return 'badge-default';
        switch (tipo.toLowerCase()) {
            case 'eliminar': return 'badge-danger';
            case 'editar': return 'badge-warning';
            case 'transferencia':
            case 'transferir': return 'badge-info';
            case 'entrada': return 'badge-success';
            case 'salida': return 'badge-secondary';
            default: return 'badge-default';
        }
    }
}
