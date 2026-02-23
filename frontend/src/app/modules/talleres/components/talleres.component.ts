import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TalleresService } from '../services/talleres.service';
import { Taller } from '../models/taller.model';
import { TallerFormComponent } from './taller-form/taller-form.component';
import { AlertasService } from '../../../core/services/alertas';
import { TallerDetalleModalComponent } from '../taller-detalle-modal.component';

@Component({
  selector: 'app-talleres',
  standalone: true,
  imports: [CommonModule, FormsModule, TallerFormComponent, TallerDetalleModalComponent],
  templateUrl: './talleres.component.html',
  styleUrls: ['./talleres.component.css']
})
export class TalleresComponent implements OnInit {
  talleres: Taller[] = [];
  mostrarFormulario = false;
  mostrarDetalle = false;
  tallerSeleccionado: Taller | null = null;
  tallerDetalle: Taller | null = null;
  terminoBusqueda = '';
  loading = false;
  error = false;

  constructor(
    private router: Router,
    private alertas: AlertasService,
    private talleresService: TalleresService
  ) {}

  ngOnInit(): void {
    this.cargarTalleres();
  }

  cargarTalleres(): void {
    this.loading = true;
    this.error = false;

    this.talleresService.obtenerTalleres().subscribe({
      next: (data) => {
        this.talleres = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar talleres:', err);
        this.error = true;
        this.loading = false;
        this.alertas.error('Error', 'No se pudieron cargar los talleres');
      }
    });
  }

  get talleresFiltrados(): Taller[] {
    if (!this.terminoBusqueda.trim()) {
      return this.talleres;
    }

    const termino = this.terminoBusqueda.toLowerCase();
    return this.talleres.filter((t) =>
      t.nombreTaller?.toLowerCase().includes(termino) ||
      t.tipoTaller?.toLowerCase().includes(termino) ||
      t.responsable?.toLowerCase().includes(termino) ||
      t.telefono?.toLowerCase().includes(termino) ||
      t.email?.toLowerCase().includes(termino) ||
      t.nombreProvincia?.toLowerCase().includes(termino) ||
      t.nombreCiudad?.toLowerCase().includes(termino)
    );
  }

  abrirFormularioNuevo(): void {
    this.tallerSeleccionado = null;
    this.mostrarFormulario = true;
  }

  abrirFormularioEditar(taller: Taller, event: Event): void {
    event.stopPropagation();
    this.tallerSeleccionado = { ...taller };
    this.mostrarFormulario = true;
  }

  abrirFormularioEditarDesdeDetalle(taller: Taller): void {
    this.cerrarDetalle();
    this.tallerSeleccionado = { ...taller };
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.tallerSeleccionado = null;
    this.cargarTalleres();
  }

  verProyectosAsignados(taller: Taller, event: Event): void {
    event.stopPropagation();
    this.mostrarDetalle = false;
    this.router.navigate(['/proyectos/lista'], {
      queryParams: { taller: taller.idTaller, nombreTaller: taller.nombreTaller }
    });
  }

  verProyectosDesdeDetalle(taller: Taller): void {
    this.mostrarDetalle = false;
    this.router.navigate(['/proyectos/lista'], {
      queryParams: { taller: taller.idTaller, nombreTaller: taller.nombreTaller }
    });
  }

  abrirDetalle(taller: Taller): void {
    this.tallerDetalle = taller;
    this.mostrarDetalle = true;
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.tallerDetalle = null;
  }

  async eliminarTaller(taller: Taller, event: Event): Promise<void> {
    event.stopPropagation();

    if (!taller.idTaller) {
      this.alertas.error('Error', 'Taller sin ID valido');
      return;
    }

    const confirmado = await this.alertas.confirmar(
      'Eliminar taller?',
      `Se eliminara a ${taller.nombreTaller}. Esta accion no se puede deshacer.`,
      'Si, eliminar'
    );

    if (!confirmado) {
      return;
    }

    this.talleresService.eliminarTaller(taller.idTaller).subscribe({
      next: () => {
        this.alertas.success('Taller eliminado', 'El taller se elimino correctamente');
        this.cargarTalleres();
      },
      error: (err) => {
        console.error('Error al eliminar taller:', err);
        this.alertas.error('Error', 'No se pudo eliminar el taller');
      }
    });
  }

  async eliminarTallerDesdeDetalle(taller: Taller): Promise<void> {
    if (!taller.idTaller) {
      this.alertas.error('Error', 'Taller sin ID valido');
      return;
    }

    const confirmado = await this.alertas.confirmar(
      'Eliminar taller?',
      `Se eliminara a ${taller.nombreTaller}. Esta accion no se puede deshacer.`,
      'Si, eliminar'
    );

    if (!confirmado) {
      return;
    }

    this.talleresService.eliminarTaller(taller.idTaller).subscribe({
      next: () => {
        this.alertas.success('Taller eliminado', 'El taller se elimino correctamente');
        this.cerrarDetalle();
        this.cargarTalleres();
      },
      error: (err) => {
        console.error('Error al eliminar taller:', err);
        this.alertas.error('Error', 'No se pudo eliminar el taller');
      }
    });
  }
}
