import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdenCompraService, ControlRecepcionDTO } from '../../../orden-compra/services/orden-compra.service';
import { OrdenCompra } from '../../../orden-compra/models/orden-compra.model';
import { AuthService } from '../../../login/services/auth.service';
import { AlertasService } from '../../../../core/services/alertas';
import { NotificacionesService } from '../../../../core/services/notificaciones.service';

@Component({
    selector: 'app-control-recepcion',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './control-recepcion.component.html',
    styleUrls: ['./control-recepcion.component.css']
})
export class ControlRecepcionComponent implements OnInit {
    ordenes: OrdenCompra[] = [];
    loading = false;
    error = false;

    // Orden seleccionada para realizar el control
    ordenActiva: OrdenCompra | null = null;
    fechaControl = '';
    observacion = '';
    detallesControl: { idInsumo: number; cantidadRecibida: number; observacionDetalle?: string }[] = [];
    guardando = false;

    constructor(
        private ordenCompraService: OrdenCompraService,
        private authService: AuthService,
        private alertas: AlertasService,
        private notificacionesService: NotificacionesService
    ) { }

    ngOnInit(): void {
        this.fechaControl = new Date().toISOString().split('T')[0];
        this.cargarOrdenes();
    }

    cargarOrdenes(): void {
        this.loading = true;
        this.error = false;
        this.ordenCompraService.obtenerOrdenesPendienteControl().subscribe({
            next: (data) => { this.ordenes = data; this.loading = false; },
            error: () => { this.error = true; this.loading = false; }
        });
    }

    abrirControl(orden: OrdenCompra): void {
        this.ordenActiva = orden;
        this.observacion = '';
        // Pre-cargar con la cantidad pedida en la OC (lo que falta recibir)
        this.detallesControl = (orden.detalles || []).map(d => {
            const yaRecibido = d.cantidadRecibida ?? 0;
            const pendiente = Math.max(0, d.cantidad - yaRecibido);
            return {
                idInsumo: d.idInsumo,
                // Si nunca se recibió nada, pre-cargar con la cantidad total pedida
                // Si ya se recibió algo, pre-cargar con lo que falta
                cantidadRecibida: pendiente > 0 ? pendiente : d.cantidad,
                observacionDetalle: ''
            };
        });
    }

    cerrarControl(): void {
        this.ordenActiva = null;
    }

    getNombreInsumo(idInsumo: number): string {
        return this.ordenActiva?.detalles?.find(d => d.idInsumo === idInsumo)?.nombreInsumo || 'Insumo';
    }

    getColorInsumo(idInsumo: number): string {
        return this.ordenActiva?.detalles?.find(d => d.idInsumo === idInsumo)?.colorInsumo || '';
    }

    getNombreConColor(idInsumo: number): string {
        const d = this.ordenActiva?.detalles?.find(x => x.idInsumo === idInsumo);
        if (!d) return 'Insumo';
        return d.colorInsumo ? `${d.nombreInsumo} — ${d.colorInsumo}` : (d.nombreInsumo || 'Insumo');
    }

    getCantidadSolicitada(idInsumo: number): number {
        return this.ordenActiva?.detalles?.find(d => d.idInsumo === idInsumo)?.cantidad || 0;
    }

    getCantidadYaRecibida(idInsumo: number): number {
        return this.ordenActiva?.detalles?.find(d => d.idInsumo === idInsumo)?.cantidadRecibida ?? 0;
    }

    getFaltante(idInsumo: number): number {
        const pedido = this.getCantidadSolicitada(idInsumo);
        const recibido = this.getCantidadYaRecibida(idInsumo);
        return Math.max(0, pedido - recibido);
    }

    esRecontrol(idInsumo: number): boolean {
        return this.getCantidadYaRecibida(idInsumo) > 0;
    }

    async confirmarControl(): Promise<void> {
        if (!this.ordenActiva) return;

        const hayInvalidos = this.detallesControl.some(d => d.cantidadRecibida < 0);
        if (hayInvalidos) {
            this.alertas.error('Cantidades inválidas', 'Las cantidades no pueden ser negativas.');
            return;
        }

        const todosCero = this.detallesControl.every(d => d.cantidadRecibida === 0);
        if (todosCero) {
            this.alertas.error('Sin cantidades', 'Debe ingresar al menos una cantidad mayor a 0.');
            return;
        }

        const usuario = this.authService.obtenerUsuarioActual();
        if (!usuario) { this.alertas.error('Error', 'No se pudo obtener el usuario actual.'); return; }

        const confirmado = await this.alertas.confirmar(
            '¿Confirmar control de recepción?',
            `Se actualizará el stock con las cantidades ingresadas y la orden quedará como "Recibida".`,
            'Confirmar'
        );
        if (!confirmado) return;

        const dto: ControlRecepcionDTO = {
            idOrdenCompra: this.ordenActiva.idOrdenCompra,
            idUsuarioControl: usuario.idUsuario,
            fechaControl: this.fechaControl,
            observacion: this.observacion || undefined,
            detalles: this.detallesControl
        };

        this.guardando = true;
        this.ordenCompraService.registrarControlRecepcion(this.ordenActiva.idOrdenCompra, dto).subscribe({
            next: () => {
                this.guardando = false;
                this.alertas.success('Control registrado', 'El stock fue actualizado correctamente.');
                // Notificar al administrador que el control fue completado
                const nroOrden = this.ordenActiva?.nroOrden ?? '';
                const idOC = this.ordenActiva?.idOrdenCompra ?? 0;
                this.notificacionesService.crearNotificacionControlRecepcion({
                    idOrdenCompra: idOC,
                    nroOrden: nroOrden,
                    tipo: 'ControlCompletado'
                }).subscribe({ error: () => {} }); // silencioso — no bloquear el flujo principal
                this.cerrarControl();
                this.cargarOrdenes();
            },
            error: () => {
                this.guardando = false;
                this.alertas.error('Error', 'No se pudo registrar el control de recepción.');
            }
        });
    }

    formatearFecha(fecha: string): string {
        if (!fecha) return '-';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
}
