import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MuestrasService } from '../../services/muestra.service';
import { MuestraDetalle } from '../../models/muestra.model';

type AccionComentario = 'actualizacion' | 'rechazo';

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
  mostrarModalHistorial = false;
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
          paletaRgb: this.normalizarPaleta(muestra.paletaRgb)
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
      paletaRgb: this.normalizarPaleta(this.muestra.paletaRgb)
    });
    this.form.disable();
    this.editando = false;
    this.error = '';
  }

  solicitarComentario(accion: AccionComentario): void {
    this.accionComentario = accion;
    this.comentario = '';
    this.comentarioObligatorio = accion === 'rechazo';
    this.error = '';
    this.mostrarModalComentario = true;
  }

  cerrarModalComentario(): void {
    this.mostrarModalComentario = false;
    this.accionComentario = undefined;
    this.comentario = '';
    this.error = '';
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

    this.muestrasService.rechazarMuestra(id, comentario).subscribe({
      next: () => {
        this.cargarMuestra(id);
        this.cerrarModalComentario();
      },
      error: (err) => {
        this.error = err.message || 'No se pudo rechazar la muestra';
      }
    });
  }

  aceptarMuestra(): void {
    const id = this.muestra?.idMuestra;
    if (!id) return;

    this.error = '';
    this.muestrasService.aceptarMuestra(id).subscribe({
      next: () => {
        this.cargarMuestra(id);
      },
      error: (err) => {
        this.error = err.message || 'No se pudo aprobar la muestra';
      }
    });
  }

  sincronizarConDiseno(): void {
    const id = this.muestra?.idMuestra;
    if (!id) return;

    this.loading = true;
    this.error = '';

    this.muestrasService.sincronizarDiseno(id).subscribe({
      next: (res) => {
        alert(res.message || 'Diseño sincronizado correctamente');
        this.cargarMuestra(id);
      },
      error: (err) => {
        this.error = err.message || 'Error al sincronizar con diseño';
        this.loading = false;
      }
    });
  }

  abrirHistorial(): void {
    this.mostrarModalHistorial = true;
  }

  cerrarHistorial(): void {
    this.mostrarModalHistorial = false;
  }

  eliminarMuestra(): void {
    const id = this.muestra?.idMuestra;
    if (!id || this.editando) return;

    const confirmado = window.confirm('¿Seguro que querés borrar esta muestra? Esta acción no se puede deshacer.');
    if (!confirmado) return;

    this.loading = true;
    this.error = '';

    this.muestrasService.eliminarMuestra(id).subscribe({
      next: () => {
        this.router.navigate(['/proyectos/muestras']);
      },
      error: (err) => {
        this.error = err.message || 'No se pudo eliminar la muestra';
        this.loading = false;
      }
    });
  }

  get estadoActual(): string {
    return this.muestra?.estado || '-';
  }

  getEstadoClass(estado?: string | null): string {
    const valor = (estado || '').toLowerCase();
    if (valor.includes('aprob')) return 'badge-aprobada';
    if (valor.includes('rechaz')) return 'badge-rechazada';
    if (valor.includes('pend')) return 'badge-pendiente';
    return 'badge-neutra';
  }

  /** Normaliza el valor de paletaRgb a un hex simple para el color picker */
  private normalizarPaleta(valor: string | null | undefined): string {
    if (!valor) return '#000000';
    const hex = valor.trim().match(/#([A-Fa-f0-9]{6})/);
    return hex ? hex[0] : '#000000';
  }

  get puedeAceptar(): boolean {
    return this.estadoActual !== 'Aprobada' && this.estadoActual !== 'Rechazada';
  }

  get puedeRechazar(): boolean {
    return this.estadoActual !== 'Rechazada';
  }
}
