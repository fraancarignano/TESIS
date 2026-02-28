import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProyectosService } from '../../services/proyecto.service';
import { ProyectoVista, proyectoToVista } from '../../models/proyecto.model';
import { ProyectoDetalleModalComponent } from '../proyecto-detalle-modal/proyecto-detalle-modal.component';

@Component({
  selector: 'app-proyecto-detalle-page',
  standalone: true,
  imports: [CommonModule, ProyectoDetalleModalComponent],
  template: `
    <section class="detalle-page">
      <header class="detalle-page-header">
        <button type="button" class="btn-volver" (click)="volver()">
          Volver
        </button>
      </header>

      <div class="estado" *ngIf="loading">Cargando proyecto...</div>
      <div class="estado error" *ngIf="!loading && error">{{ error }}</div>

      <app-proyecto-detalle-modal
        *ngIf="!loading && proyecto"
        [proyecto]="proyecto"
        [modoPantallaCompleta]="true"
        (cerrar)="volver()"
        (actualizado)="recargar()">
      </app-proyecto-detalle-modal>
    </section>
  `,
  styles: [`
    .detalle-page { padding: 0.75rem; }
    .detalle-page-header { margin-bottom: 0.75rem; }
    .btn-volver {
      border: 1px solid #d0d5dd;
      background: #ffffff;
      color: #344054;
      border-radius: 8px;
      padding: 0.45rem 0.8rem;
      cursor: pointer;
      font-weight: 600;
    }
    .btn-volver:hover { background: #f9fafb; }
    .estado { color: #475467; font-weight: 600; padding: 0.8rem 0; }
    .estado.error { color: #b42318; }
  `]
})
export class ProyectoDetallePageComponent implements OnInit {
  proyecto: ProyectoVista | null = null;
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private proyectosService: ProyectosService
  ) {}

  ngOnInit(): void {
    this.recargar();
  }

  recargar(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'ID de proyecto inválido.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.proyectosService.obtenerProyectoPorId(id).subscribe({
      next: (proyecto) => {
        this.proyecto = proyectoToVista(proyecto);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.message || 'No se pudo cargar el proyecto.';
      }
    });
  }

  volver(): void {
    this.router.navigate(['/proyectos']);
  }
}
