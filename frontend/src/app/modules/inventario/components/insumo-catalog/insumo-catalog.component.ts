import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InsumosService } from '../../services/insumos.service';
import { Insumo, TipoInsumo } from '../../models/insumo.model';
import { AlertasService } from '../../../../core/services/alertas';

@Component({
    selector: 'app-insumo-catalog',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './insumo-catalog.component.html',
    styleUrls: ['./insumo-catalog.component.css']
})
export class InsumoCatalogComponent implements OnInit {
    insumos: Insumo[] = [];
    tiposInsumo: TipoInsumo[] = [];
    proveedores: any[] = [];

    // Formulario para nuevo insumo
    nuevoInsumo: Partial<Insumo> = {
        nombreInsumo: '',
        unidadMedida: '',
        idTipoInsumo: 0,
        idProveedor: undefined,
        stockActual: 0,
        stockMinimo: 0,
        estado: 'Disponible'
    };

    cargando = false;
    guardando = false;
    mostrarFormulario = false;

    unidadesMedida = ['Unidades', 'Metros', 'Kg', 'Litros', 'Rollos', 'Pares'];

    constructor(
        private insumosService: InsumosService,
        private alertas: AlertasService
    ) { }

    ngOnInit(): void {
        this.cargarDatos();
    }

    cargarDatos(): void {
        this.cargando = true;
        this.insumosService.getInsumos().subscribe({
            next: (res) => {
                this.insumos = res;
                this.cargando = false;
            },
            error: (err) => {
                console.error('Error al cargar insumos:', err);
                this.cargando = false;
            }
        });

        this.insumosService.getTiposInsumo().subscribe({
            next: (res) => {
                this.tiposInsumo = res;
                // Seleccionamos el primero por defecto si hay
                if (this.tiposInsumo.length > 0 && this.nuevoInsumo.idTipoInsumo === 0) {
                    this.nuevoInsumo.idTipoInsumo = this.tiposInsumo[0].idTipoInsumo;
                }
            }
        });

        this.insumosService.getProveedores().subscribe({
            next: (res) => this.proveedores = res,
            error: (err) => console.error('Error al cargar proveedores:', err)
        });
    }

    abrirNuevo(): void {
        this.mostrarFormulario = true;
    }

    cancelar(): void {
        this.mostrarFormulario = false;
        this.nuevoInsumo = {
            nombreInsumo: '',
            unidadMedida: '',
            idTipoInsumo: this.tiposInsumo.length > 0 ? this.tiposInsumo[0].idTipoInsumo : 0,
            idProveedor: undefined,
            stockActual: 0,
            stockMinimo: 0,
            estado: 'Disponible'
        };
    }

    guardar(): void {
        if (!this.nuevoInsumo.nombreInsumo?.trim() || !this.nuevoInsumo.unidadMedida) {
            this.alertas.error('Datos incompletos', 'Nombre y unidad de medida son obligatorios');
            return;
        }

        this.guardando = true;
        this.insumosService.agregarInsumo(this.nuevoInsumo as Insumo).subscribe({
            next: () => {
                this.alertas.success('Exito', 'Insumo registrado en el catálogo');
                this.guardando = false;
                this.cancelar();
                this.cargarDatos();
            },
            error: (err) => {
                console.error('Error al guardar:', err);
                this.alertas.error('Error', 'No se pudo guardar el insumo');
                this.guardando = false;
            }
        });
    }

    eliminar(id: number): void {
        this.alertas.confirmar('¿Eliminar esta definición de insumo?', 'Sí, eliminar').then(confirm => {
            if (confirm) {
                this.insumosService.eliminarInsumo(id).subscribe({
                    next: () => {
                        this.alertas.success('Eliminado', 'Insumo eliminado del catálogo');
                        this.cargarDatos();
                    },
                    error: (err) => {
                        console.error('Error al eliminar:', err);
                        this.alertas.error('Error', 'No se pudo eliminar. Verifique si tiene stock o movimientos asociados.');
                    }
                });
            }
        });
    }
}
