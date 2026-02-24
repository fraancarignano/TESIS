import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdenCompraService } from '../../../orden-compra/services/orden-compra.service';
import { UbicacionesService, Ubicacion } from '../../../ubicaciones/services/ubicaciones.service';
import { ProyectosService } from '../../../proyectos/services/proyecto.service';
import { OrdenCompra } from '../../../orden-compra/models/orden-compra.model';
import { Proyecto } from '../../../proyectos/models/proyecto.model';
import { Insumo } from '../../models/insumo.model';

@Component({
    selector: 'app-ubicacion-transfer',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ubicacion-transfer.component.html',
    styleUrls: ['./ubicacion-transfer.component.css']
})
export class UbicacionTransferComponent implements OnInit {
    ordenesRecibidas: OrdenCompra[] = [];
    ubicaciones: Ubicacion[] = [];
    proyectos: Proyecto[] = [];

    tipoOrigen: 'OC' | 'UBICACION' = 'OC';
    idOrdenSeleccionada: number | null = null;
    idUbicacionOrigen: number | null = null;
    idUbicacionDestino: number | null = null;
    idProyectoSeleccionado: number | null = null;

    insumosParaTransferir: (Insumo & { seleccionado: boolean })[] = [];

    cargando = false;
    todosSeleccionados = false;

    constructor(
        private ordenCompraService: OrdenCompraService,
        private ubicacionesService: UbicacionesService,
        private proyectosService: ProyectosService
    ) { }

    ngOnInit(): void {
        this.cargarDatos();
    }

    cargarDatos(): void {
        this.cargando = true;
        // Cargar órdenes recibidas
        this.ordenCompraService.obtenerOrdenes().subscribe({
            next: (res: OrdenCompra[]) => {
                this.ordenesRecibidas = res.filter((o: OrdenCompra) => o.estado === 'Recibida');
                this.cargando = false;
            },
            error: (err: any) => {
                console.error('Error al cargar órdenes:', err);
                this.cargando = false;
            }
        });

        // Cargar ubicaciones
        this.ubicacionesService.getUbicaciones().subscribe({
            next: (res: Ubicacion[]) => this.ubicaciones = res,
            error: (err: any) => console.error('Error al cargar ubicaciones:', err)
        });

        // Cargar proyectos activos
        this.proyectosService.obtenerProyectos().subscribe({
            next: (res: Proyecto[]) => {
                this.proyectos = res.filter(p =>
                    p.estado !== 'Archivado' &&
                    p.estado !== 'Cancelado' &&
                    p.estado !== 'Finalizado'
                );
            },
            error: (err: any) => console.error('Error al cargar proyectos:', err)
        });
    }

    onOrigenTypeChange(): void {
        this.limpiar(false);
    }

    onOrdenChange(): void {
        if (!this.idOrdenSeleccionada) {
            this.insumosParaTransferir = [];
            return;
        }

        const orden = this.ordenesRecibidas.find(o => o.idOrdenCompra === this.idOrdenSeleccionada);
        if (orden && orden.detalles) {
            this.insumosParaTransferir = orden.detalles.map((d: any) => ({
                idInsumo: d.idInsumo,
                nombreInsumo: d.nombreInsumo,
                stockActual: d.cantidad,
                seleccionado: true,
                nombreTipoInsumo: '',
                unidadMedida: ''
            } as any));
            this.todosSeleccionados = true;
        }
    }

    onUbicacionOrigenChange(): void {
        if (!this.idUbicacionOrigen) {
            this.insumosParaTransferir = [];
            return;
        }

        this.cargando = true;
        this.ubicacionesService.getInsumosPorUbicacion(this.idUbicacionOrigen).subscribe({
            next: (insumos: Insumo[]) => {
                this.insumosParaTransferir = insumos.map((i: Insumo) => ({
                    ...i,
                    seleccionado: true
                }));
                this.todosSeleccionados = true;
                this.cargando = false;
            },
            error: (err: any) => {
                console.error('Error al cargar insumos de ubicación:', err);
                this.cargando = false;
            }
        });
    }

    toggleTodos(): void {
        this.todosSeleccionados = !this.todosSeleccionados;
        this.insumosParaTransferir.forEach(i => i.seleccionado = this.todosSeleccionados);
    }

    actualizarTodosSeleccionados(): void {
        this.todosSeleccionados = this.insumosParaTransferir.every(i => i.seleccionado);
    }

    confirmarTransferencia(): void {
        const idsSeleccionados = this.insumosParaTransferir
            .filter(i => i.seleccionado)
            .map(i => i.idInsumo!);

        if (idsSeleccionados.length === 0) {
            alert('Debe seleccionar al menos un insumo para transferir.');
            return;
        }

        if (!this.idUbicacionDestino) {
            alert('Debe seleccionar una ubicación de destino.');
            return;
        }

        if (this.tipoOrigen === 'UBICACION' && this.idUbicacionOrigen === this.idUbicacionDestino) {
            alert('La ubicación de origen y destino no pueden ser la misma.');
            return;
        }

        // Obtener ID de usuario del localStorage (ajustar según tu sistema de auth)
        const currentUser = JSON.parse(localStorage.getItem('usuario') || '{}');
        const idUsuario = currentUser.idUsuario || null;

        const transferDto = {
            idOrdenCompra: this.tipoOrigen === 'OC' ? this.idOrdenSeleccionada : null,
            idUbicacionOrigen: this.tipoOrigen === 'UBICACION' ? this.idUbicacionOrigen : null,
            idsInsumos: idsSeleccionados,
            idUbicacionDestino: this.idUbicacionDestino,
            idProyecto: this.idProyectoSeleccionado,
            idUsuario: idUsuario
        };

        this.ubicacionesService.transferirDesdeOrden(transferDto).subscribe({
            next: () => {
                alert('Transferencia realizada con éxito.');
                this.limpiar();
                this.cargarDatos();
            },
            error: (err: any) => {
                console.error('Error en transferencia:', err);
                alert('Hubo un error al realizar la transferencia.');
            }
        });
    }

    limpiar(todo: boolean = true): void {
        if (todo) {
            this.idOrdenSeleccionada = null;
            this.idUbicacionOrigen = null;
        }
        this.idUbicacionDestino = null;
        this.idProyectoSeleccionado = null;
        this.insumosParaTransferir = [];
        this.todosSeleccionados = false;
    }
}
