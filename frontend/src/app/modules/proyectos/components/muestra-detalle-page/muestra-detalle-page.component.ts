import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MuestrasService } from '../../services/muestra.service';
import { MuestraDetalle } from '../../models/muestra.model';

type AccionComentario = 'actualizacion' | 'rechazo' | 'aceptacion';

@Component({
  selector: 'app-muestra-detalle-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './muestra-detalle-page.component.html',
  styleUrls: ['./muestra-detalle-page.component.css']
})
export class MuestraDetallePageComponent implements OnInit {
  muestra?: MuestraDetalle;
  form: FormGroup;
  loading = false;
  error = '';
  editando = false;

  mostrarModalComentario = false;
  comentario = '';
  accionComentario?: AccionComentario;
  comentarioObligatorio = false;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private fb: FormBuilder,
    private muestrasService: MuestrasService
  ) {
    this.form = this.fb.group({
      nombreMuestra: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      prioridad: [''],
      fechaEntrega: [''],
      idUsuarioEncargado: [''],
      mockupUrl: ['', Validators.required],
      bordadoRequerido: [false],
      bordadoDescripcion: [''],
      bordadoReferencia: [''],
      estampadoRequerido: [false],
      estampadoDescripcion: [''],
      estampadoReferencia: [''],
      otrosDetalle: [''],
      paletaRgb: ['']
    });
    this.form.disable();
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/proyectos/muestras']);
      return;
    }
    this.cargarMuestra(id);
  }

  private cargarMuestra(id: number): void {
    this.loading = true;
    this.error = '';
    this.muestrasService.obtenerMuestraPorId(id).subscribe({
      next: (muestra) => {
        this.muestra = muestra;
        this.form.patchValue({
          nombreMuestra: muestra.nombreMuestra,
          descripcion: muestra.descripcion || '',
          prioridad: muestra.prioridad || '',
          fechaEntrega: muestra.fechaEntrega || '',
          idUsuarioEncargado: muestra.idUsuarioEncargado ?? '',
          mockupUrl: muestra.mockupUrl || '',
          bordadoRequerido: muestra.bordadoRequerido,
          bordadoDescripcion: muestra.bordadoDescripcion || '',
          bordadoReferencia: muestra.bordadoReferencia || '',
          estampadoRequerido: muestra.estampadoRequerido,
          estampadoDescripcion: muestra.estampadoDescripcion || '',
          estampadoReferencia: muestra.estampadoReferencia || '',
          otrosDetalle: muestra.otrosDetalle || '',
          paletaRgb: muestra.paletaRgb || ''
        });
        this.form.disable();
        this.editando = false;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'No se pudo cargar la muestra';
        this.loading = false;
      }
    });
  }

  iniciarEdicion(): void {
    this.editando = true;
    this.form.enable();
  }

  cancelarEdicion(): void {
    if (!this.muestra) return;
    this.form.patchValue({
      nombreMuestra: this.muestra.nombreMuestra,
      descripcion: this.muestra.descripcion || '',
      prioridad: this.muestra.prioridad || '',
      fechaEntrega: this.muestra.fechaEntrega || '',
      idUsuarioEncargado: this.muestra.idUsuarioEncargado ?? '',
      mockupUrl: this.muestra.mockupUrl || '',
      bordadoRequerido: this.muestra.bordadoRequerido,
      bordadoDescripcion: this.muestra.bordadoDescripcion || '',
      bordadoReferencia: this.muestra.bordadoReferencia || '',
      estampadoRequerido: this.muestra.estampadoRequerido,
      estampadoDescripcion: this.muestra.estampadoDescripcion || '',
      estampadoReferencia: this.muestra.estampadoReferencia || '',
      otrosDetalle: this.muestra.otrosDetalle || '',
      paletaRgb: this.muestra.paletaRgb || ''
    });
    this.form.disable();
    this.editando = false;
  }

  solicitarComentario(accion: AccionComentario): void {
    this.accionComentario = accion;
    this.comentario = '';
    this.comentarioObligatorio = accion !== 'aceptacion';
    this.mostrarModalComentario = true;
  }

  cerrarModalComentario(): void {
    this.mostrarModalComentario = false;
    this.accionComentario = undefined;
    this.comentario = '';
  }

  confirmarComentario(): void {
    if (!this.accionComentario) return;
    if (this.comentarioObligatorio && !this.comentario.trim()) {
      this.error = 'El comentario es obligatorio';
      return;
    }

    const id = this.muestra?.idMuestra;
    if (!id) return;

    const comentario = this.comentario.trim();

    if (this.accionComentario === 'actualizacion') {
      if (this.form.invalid) {
        this.error = 'Completa los campos obligatorios';
        return;
      }

      const formValue = this.form.getRawValue();
      const dto = {
        nombreMuestra: formValue.nombreMuestra?.trim(),
        descripcion: formValue.descripcion?.trim() || undefined,
        prioridad: formValue.prioridad || undefined,
        fechaEntrega: formValue.fechaEntrega || undefined,
        idUsuarioEncargado: formValue.idUsuarioEncargado
          ? Number(formValue.idUsuarioEncargado)
          : undefined,
        mockupUrl: formValue.mockupUrl?.trim() || undefined,
        bordadoRequerido: !!formValue.bordadoRequerido,
        bordadoDescripcion: formValue.bordadoDescripcion?.trim() || undefined,
        bordadoReferencia: formValue.bordadoReferencia?.trim() || undefined,
        estampadoRequerido: !!formValue.estampadoRequerido,
        estampadoDescripcion: formValue.estampadoDescripcion?.trim() || undefined,
        estampadoReferencia: formValue.estampadoReferencia?.trim() || undefined,
        otrosDetalle: formValue.otrosDetalle?.trim() || undefined,
        paletaRgb: formValue.paletaRgb?.trim() || undefined,
        comentarioActualizacion: comentario
      };

      this.muestrasService.actualizarMuestra(id, dto).subscribe({
        next: (actualizada) => {
          this.muestra = actualizada;
          this.form.disable();
          this.editando = false;
          this.cerrarModalComentario();
        },
        error: (err) => {
          this.error = err.message || 'No se pudo actualizar la muestra';
        }
      });

      return;
    }

    if (this.accionComentario === 'rechazo') {
      this.muestrasService.rechazarMuestra(id, comentario).subscribe({
        next: () => {
          this.cargarMuestra(id);
          this.cerrarModalComentario();
        },
        error: (err) => {
          this.error = err.message || 'No se pudo rechazar la muestra';
        }
      });
      return;
    }

    this.muestrasService.aceptarMuestra(id, comentario || undefined).subscribe({
      next: () => {
        this.cargarMuestra(id);
        this.cerrarModalComentario();
      },
      error: (err) => {
        this.error = err.message || 'No se pudo aprobar la muestra';
      }
    });
  }

  get estadoActual(): string {
    return this.muestra?.estado || '-';
  }

  get puedeAceptar(): boolean {
    return this.estadoActual !== 'Aprobada' && this.estadoActual !== 'Rechazada';
  }

  get puedeRechazar(): boolean {
    return this.estadoActual !== 'Rechazada';
  }
}
