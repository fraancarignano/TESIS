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
        estado: 'Disponible',
        color: '',
        tipoTela: '',
        precioUnitario: undefined
    };

    cargando = false;
    guardando = false;
    mostrarFormulario = false;
    editandoInsumo: Insumo | null = null;

    // Selección múltiple para ajuste de precios
    seleccionados = new Set<number>();
    porcentajeAjuste: number | null = null;

    get todosSeleccionados(): boolean {
        return this.insumos.length > 0 && this.insumos.every(i => this.seleccionados.has(i.idInsumo!));
    }

    toggleSeleccion(insumo: Insumo): void {
        if (this.seleccionados.has(insumo.idInsumo!)) this.seleccionados.delete(insumo.idInsumo!);
        else this.seleccionados.add(insumo.idInsumo!);
    }

    toggleSeleccionTodos(): void {
        if (this.todosSeleccionados) this.limpiarSeleccion();
        else this.insumos.forEach(i => this.seleccionados.add(i.idInsumo!));
    }

    limpiarSeleccion(): void {
        this.seleccionados.clear();
        this.porcentajeAjuste = null;
    }

    aplicarAjusteMasivo(): void {
        if (!this.porcentajeAjuste || this.seleccionados.size === 0) return;
        const ids = Array.from(this.seleccionados);
        const pct = this.porcentajeAjuste;
        const signo = pct > 0 ? `+${pct}%` : `${pct}%`;
        this.alertas.confirmar(
            '¿Aplicar ajuste de precios?',
            `Se aplicará ${signo} a ${ids.length} insumo(s). Solo afecta los que ya tienen precio.`,
            'Sí, aplicar'
        ).then(confirmado => {
            if (!confirmado) return;
            this.insumosService.ajustarPreciosMasivo(ids, pct).subscribe({
                next: () => {
                    this.alertas.success('Precios actualizados', 'Ajuste aplicado correctamente.');
                    this.limpiarSeleccion();
                    this.cargarDatos();
                },
                error: () => this.alertas.error('Error', 'No se pudieron actualizar los precios')
            });
        });
    }

    abrirEditar(insumo: Insumo): void {
        this.editandoInsumo = { ...insumo };
        this.nuevoInsumo = { ...insumo };
        this.mostrarFormulario = true;
    }

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
        this.editandoInsumo = null;
        this.nuevoInsumo = {
            nombreInsumo: '',
            unidadMedida: '',
            idTipoInsumo: this.tiposInsumo.length > 0 ? this.tiposInsumo[0].idTipoInsumo : 0,
            idProveedor: undefined,
            stockActual: 0,
            stockMinimo: 0,
            estado: 'Disponible',
            color: '',
            tipoTela: '',
            precioUnitario: undefined
        };
    }

    guardar(): void {
        if (!this.nuevoInsumo.nombreInsumo?.trim() || !this.nuevoInsumo.unidadMedida) {
            this.alertas.error('Datos incompletos', 'Nombre y unidad de medida son obligatorios');
            return;
        }

        this.guardando = true;
        const operacion = this.editandoInsumo
            ? this.insumosService.actualizarInsumo(this.nuevoInsumo as Insumo)
            : this.insumosService.agregarInsumo(this.nuevoInsumo as Insumo);

        operacion.subscribe({
            next: () => {
                this.alertas.success('Exito', this.editandoInsumo ? 'Insumo actualizado' : 'Insumo registrado en el catálogo');
                this.guardando = false;
                this.cancelar();
                this.cargarDatos();
            },
            error: (err: any) => {
                this.alertas.error('Error', err?.error?.message || 'No se pudo guardar el insumo');
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
