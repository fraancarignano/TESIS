import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UbicacionesService, Ubicacion } from '../services/ubicaciones.service';
import { UbicacionDetalleModalComponent } from './ubicacion-detalle-modal/ubicacion-detalle-modal.component';

@Component({
    selector: 'app-ubicaciones',
    standalone: true,
    imports: [CommonModule, FormsModule, UbicacionDetalleModalComponent, NgIf, NgFor],
    templateUrl: './ubicaciones.component.html',
    styleUrls: ['./ubicaciones.component.css']
})
export class UbicacionesComponent implements OnInit {
    ubicaciones: Ubicacion[] = [];
    mostrarFormulario = false;
    mostrarDetalle = false;
    ubicacionSeleccionada: Ubicacion | null = null;
    ubicacionDetalle: Ubicacion | null = null;

    // Data for the form
    nuevaUbicacion: Partial<Ubicacion> = {
        codigo: '',
        rack: 1,
        division: 1,
        espacio: 1,
        descripcion: ''
    };

    constructor(private ubicacionesService: UbicacionesService) { }

    ngOnInit(): void {
        this.cargarUbicaciones();
    }

    cargarUbicaciones(): void {
        this.ubicacionesService.getUbicaciones().subscribe(
            (res: Ubicacion[]) => this.ubicaciones = res
        );
    }

    abrirNuevo(): void {
        this.ubicacionSeleccionada = null;
        this.nuevaUbicacion = {
            codigo: '',
            rack: 1,
            division: 1,
            espacio: 1,
            descripcion: ''
        };
        this.mostrarFormulario = true;
    }

    abrirEditar(ubicacion: Ubicacion): void {
        this.ubicacionSeleccionada = { ...ubicacion };
        this.nuevaUbicacion = { ...ubicacion };
        this.mostrarFormulario = true;
    }

    cerrarFormulario(): void {
        this.mostrarFormulario = false;
        this.ubicacionSeleccionada = null;
    }

    abrirDetalle(ubicacion: Ubicacion): void {
        this.ubicacionDetalle = { ...ubicacion };
        this.mostrarDetalle = true;
    }

    cerrarDetalle(): void {
        this.mostrarDetalle = false;
        this.ubicacionDetalle = null;
    }

    guardar(): void {
        if (!this.nuevaUbicacion.codigo || !this.nuevaUbicacion.rack || !this.nuevaUbicacion.division) {
            alert('Por favor complete los campos obligatorios');
            return;
        }

        if (this.ubicacionSeleccionada) {
            this.ubicacionesService.updateUbicacion(this.ubicacionSeleccionada.idUbicacion!, this.nuevaUbicacion).subscribe({
                next: () => {
                    this.cerrarFormulario();
                    this.cargarUbicaciones();
                },
                error: (err: any) => alert(err.error?.message || 'Error al actualizar')
            });
        } else {
            this.ubicacionesService.createUbicacion(this.nuevaUbicacion).subscribe({
                next: () => {
                    this.cerrarFormulario();
                    this.cargarUbicaciones();
                },
                error: (err: any) => alert(err.error?.message || 'Error al crear')
            });
        }
    }

    eliminar(id: number): void {
        if (confirm('¿Está seguro de eliminar esta ubicación?')) {
            this.ubicacionesService.deleteUbicacion(id).subscribe({
                next: () => this.cargarUbicaciones(),
                error: (err: any) => alert(err.error?.message || 'Error al eliminar. Verifique que no esté en uso.')
            });
        }
    }

    generarCodigo(): void {
        const rackStr = this.nuevaUbicacion.rack?.toString().padStart(2, '0');
        const divStr = this.nuevaUbicacion.division?.toString().padStart(2, '0');
        const espStr = this.nuevaUbicacion.espacio?.toString().padStart(2, '0');
        this.nuevaUbicacion.codigo = `RCK-${divStr}-${espStr}`;
        // Assumption: the user wants RCK-DIVISION-ESPACIO based on his example RCK-01-01
    }
}
