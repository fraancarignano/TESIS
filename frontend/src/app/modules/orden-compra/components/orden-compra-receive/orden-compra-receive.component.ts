import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdenCompraService } from '../../services/orden-compra.service';
import { OrdenCompra } from '../../models/orden-compra.model';
import { OrdenCompraReceiveDTO, DetalleRecepcionDTO } from '../../models/orden-compra-receive.model';
import { AlertasService } from '../../../../core/services/alertas';
import { AuthService } from '../../../login/services/auth.service';

@Component({
  selector: 'app-orden-compra-receive',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orden-compra-receive.component.html',
  styleUrls: ['./orden-compra-receive.component.css']
})
export class OrdenCompraReceiveComponent implements OnInit {
  @Input() orden!: OrdenCompra;
  @Output() cerrar = new EventEmitter<void>();
  @Output() recepcionRegistrada = new EventEmitter<void>();

  fechaRecepcion = '';
  observacion = '';
  detalles: DetalleRecepcionDTO[] = [];
  cargando = false;

  constructor(
    private ordenCompraService: OrdenCompraService,
    private alertas: AlertasService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.fechaRecepcion = new Date().toISOString().split('T')[0];
    this.inicializarDetalles();
  }

  inicializarDetalles(): void {
    if (this.orden.detalles) {
      this.detalles = this.orden.detalles.map(d => ({
        idInsumo: d.idInsumo,
        cantidadRecibida: d.cantidad,
        observacionDetalle: ''
      }));
    }
  }

  obtenerNombreInsumo(idInsumo: number): string {
    const detalle = this.orden.detalles?.find(d => d.idInsumo === idInsumo);
    return detalle?.nombreInsumo || 'Desconocido';
  }

  obtenerCantidadSolicitada(idInsumo: number): number {
    const detalle = this.orden.detalles?.find(d => d.idInsumo === idInsumo);
    return detalle?.cantidad || 0;
  }

  async confirmarRecepcion(): Promise<void> {
    if (!this.fechaRecepcion) {
      this.alertas.error('Fecha requerida', 'Debe ingresar la fecha de recepción');
      return;
    }

    // Validar que todas las cantidades sean válidas
    const hayErrores = this.detalles.some(d => d.cantidadRecibida <= 0);
    if (hayErrores) {
      this.alertas.error('Cantidades inválidas', 'Todas las cantidades deben ser mayores a 0');
      return;
    }

    const usuario = this.authService.obtenerUsuarioActual();

    if (!usuario || !usuario.idUsuario) {
      this.alertas.error('Error', 'No se pudo obtener el usuario actual');
      return;
    }

    const recepcionDto: OrdenCompraReceiveDTO = {
      idOrdenCompra: this.orden.idOrdenCompra,
      fechaRecepcion: this.fechaRecepcion,
      observacion: this.observacion || undefined,
      idUsuario: usuario.idUsuario,
      detalles: this.detalles
    };

    this.cargando = true;

    this.ordenCompraService.registrarRecepcion(this.orden.idOrdenCompra, recepcionDto).subscribe({
      next: (response) => {
        this.cargando = false;
        this.alertas.success('Recepción registrada', 'El stock se actualizó correctamente');
        this.recepcionRegistrada.emit();
        this.cerrar.emit();
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al registrar recepción:', err);
        console.error('Detalles del error:', err.error);
        this.alertas.error('Error', 'No se pudo registrar la recepción');
      }
    });
  }
}