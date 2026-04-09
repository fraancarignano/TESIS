import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';
import { AlertasService } from '../../../../core/services/alertas';
import { PermissionService } from '../../../../core/services/permission.service';
import { UbicacionesService, Ubicacion } from '../../../ubicaciones/services/ubicaciones.service';
import { Despacho } from '../../models/despacho.model';
import { DespachoService } from '../../services/despacho.service';

@Component({
  selector: 'app-despachos-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, QRCodeComponent],
  templateUrl: './despachos-lista.component.html',
  styleUrls: ['./despachos-lista.component.css']
})
export class DespachosListaComponent implements OnInit {
  despachos: Despacho[] = [];
  ubicaciones: Ubicacion[] = [];
  loading = false;

  despachoImprimir: Despacho | null = null;
  qrUrl = '';

  constructor(
    private despachoService: DespachoService,
    private ubicacionService: UbicacionesService,
    public permissionService: PermissionService,
    private alertas: AlertasService
  ) {}

  ngOnInit(): void {
    this.cargarDespachos();
    this.cargarUbicacionesDES();
  }

  cargarDespachos(): void {
    this.loading = true;
    this.despachoService.obtenerDespachos().subscribe({
      next: (data: Despacho[]) => {
        this.despachos = data;
        this.loading = false;
      },
      error: () => {
        this.alertas.error('Error', 'No se pudieron cargar los despachos.');
        this.loading = false;
      }
    });
  }

  cargarUbicacionesDES(): void {
    this.ubicacionService.getUbicaciones().subscribe({
      next: (data: Ubicacion[]) => {
        this.ubicaciones = data.filter((u: Ubicacion) =>
          u.codigo.toUpperCase().startsWith('DES-')
        );
      }
    });
  }

  asignarUbicacion(idDespacho: number, event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const idUbicacion = selectElement.value ? +selectElement.value : null;

    if (idUbicacion === null) return;

    this.despachoService.asignarUbicacion(idDespacho, { idUbicacion }).subscribe({
      next: () => {
        this.alertas.success('Ubicación Asignada', 'Se actualizó la ubicación del despacho.');
        this.cargarDespachos();
      },
      error: () => this.alertas.error('Error', 'No se pudo asignar la ubicación.')
    });
  }

  async marcarDespachado(despacho: Despacho): Promise<void> {
    const confirmado = await this.alertas.confirmar(
      '¿Despachar Proyecto?',
      `¿Confirmas el despacho definitivo del proyecto ${despacho.nombreProyecto}?`
    );

    if (confirmado) {
      this.despachoService.marcarDespachado(despacho.idDespacho).subscribe({
        next: () => {
          this.alertas.success('¡Despachado!', 'El proyecto ha sido despachado.');
          this.cargarDespachos();
        },
        error: () => this.alertas.error('Error', 'Hubo un error al intentar despachar.')
      });
    }
  }

  prepararImpresion(despacho: Despacho): void {
    this.despachoImprimir = despacho;

    const fechaText = new Date(despacho.fechaCreacion).toLocaleDateString('es-AR');
    this.qrUrl =
      `TAMARINDO - DESPACHO\n` +
      `------------------\n` +
      `PROYECTO: ${despacho.nombreProyecto}\n` +
      `CLIENTE: ${despacho.cliente}\n` +
      `CÓDIGO: ${despacho.codigoDespacho}\n` +
      `UBICACIÓN: ${despacho.codigoUbicacion || 'A DESIGNAR'}\n` +
      `FECHA: ${fechaText}\n` +
      `------------------`;

    setTimeout(() => {
      window.print();
    }, 500);
  }
}