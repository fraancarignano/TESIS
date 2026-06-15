import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MuestrasService } from '../../services/muestra.service';
import { MuestraDetalle } from '../../models/muestra.model';
import { AlertasService } from '../../../../core/services/alertas';

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

  mostrarModalImagen = false;
  imagenModalUrl = '';
  imagenModalNombre = 'imagen';

  mostrarModalComentario = false;
  mostrarModalHistorial = false;
  comentario = '';
  accionComentario?: AccionComentario;
  comentarioObligatorio = false;
  guardando = false;
  paletaColores: string[] = [];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private fb: FormBuilder,
    private muestrasService: MuestrasService,
    private alertas: AlertasService
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

  get ultimaActualizacionFecha(): Date | null {
    if (!this.muestra) return null;

    const historial = this.muestra.historial || [];
    const fechasHistorial = historial
      .map(item => new Date(item.fecha))
      .filter(d => !Number.isNaN(d.getTime()));

    const fechaBase = new Date(this.muestra.fechaCreacion);
    const fechaCreacionValida = !Number.isNaN(fechaBase.getTime());

    return fechasHistorial.length
      ? new Date(Math.max(...fechasHistorial.map(d => d.getTime())))
      : (fechaCreacionValida ? fechaBase : null);
  }

  abrirImagen(url: string | null | undefined, nombre: string): void {
    const src = (url || '').trim();
    if (!src) return;

    this.imagenModalUrl = src;
    this.imagenModalNombre = nombre || 'imagen';
    this.mostrarModalImagen = true;
  }

  cerrarImagen(): void {
    this.mostrarModalImagen = false;
    this.imagenModalUrl = '';
    this.imagenModalNombre = 'imagen';
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/proyectos/muestras']);
      return;
    }

    // Mostrar datos pre-cargados del estado de navegación (vienen del listado)
    const navMuestra = history.state?.muestra as MuestraDetalle | undefined;
    if (navMuestra?.idMuestra === id) {
      this.poblarFormulario(navMuestra);
    }

    this.cargarMuestra(id);
  }

  private cargarMuestra(id: number): void {
    this.loading = true;
    this.error = '';

    this.muestrasService.obtenerMuestraPorId(id).subscribe({
      next: (muestra) => {
        this.poblarFormulario(muestra);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'No se pudo cargar la muestra';
        this.loading = false;
      }
    });
  }

  private poblarFormulario(muestra: MuestraDetalle): void {
    this.muestra = muestra;
    const paletaPrincipal = this.setearPaletaDesdeTexto(muestra.paletaRgb);
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
      paletaRgb: paletaPrincipal
    });
    this.form.disable();
    this.editando = false;
  }

  iniciarEdicion(): void {
    this.editando = true;
    this.form.enable();
  }

  cancelarEdicion(): void {
    if (!this.muestra) return;
    const paletaPrincipal = this.setearPaletaDesdeTexto(this.muestra.paletaRgb);

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
      paletaRgb: paletaPrincipal
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
    if (!this.accionComentario || this.guardando) return;
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
      this.sincronizarPaletaConControl(formValue.paletaRgb);
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
        paletaRgb: this.serializarPaleta(),
        comentarioActualizacion: comentario
      };

      this.guardando = true;
      this.muestrasService.actualizarMuestra(id, dto).subscribe({
        next: (actualizada) => {
          this.muestra = actualizada;
          const paletaPrincipal = this.setearPaletaDesdeTexto(actualizada.paletaRgb);
          this.form.patchValue({ paletaRgb: paletaPrincipal });
          this.form.disable();
          this.editando = false;
          this.cerrarModalComentario();
          this.guardando = false;
        },
        error: (err) => {
          this.error = err.message || 'No se pudo actualizar la muestra';
          this.guardando = false;
        }
      });

      return;
    }

    this.guardando = true;
    this.muestrasService.rechazarMuestra(id, comentario).subscribe({
      next: () => {
        this.cargarMuestra(id);
        this.cerrarModalComentario();
        this.guardando = false;
      },
      error: (err) => {
        this.error = err.message || 'No se pudo rechazar la muestra';
        this.guardando = false;
      }
    });
  }

  aceptarMuestra(): void {
    const id = this.muestra?.idMuestra;
    if (!id) return;

    const mensajeValidacion = this.validarMuestraParaAceptar();
    if (mensajeValidacion) {
      this.error = mensajeValidacion;
      return;
    }

    this.error = '';
    this.muestrasService.aceptarMuestra(id).subscribe({
      next: async () => {
        this.cargarMuestra(id);
        const irACrear = await this.alertas.confirmar(
          'Muestra aprobada',
          '¿Querés ir ahora a crear el proyecto?',
          'Ir a crear proyecto'
        );
        if (irACrear) {
          this.router.navigate(['/proyectos/crear'], { queryParams: { muestra: id } });
        }
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

    this.alertas.confirmar(
      'Borrar muestra',
      '¿Segús que querés borrar esta muestra? Esta acción no se puede deshacer.',
      'Sí, borrar'
    ).then(confirmado => {
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

  private normalizarPaleta(valor: string | null | undefined): string {
    if (!valor) return '#000000';
    const hex = valor.trim().match(/#([A-Fa-f0-9]{6})/);
    return hex ? hex[0].toUpperCase() : '#000000';
  }

  get puedeAceptar(): boolean {
    return this.estadoActual !== 'Aprobada' && this.estadoActual !== 'Rechazada';
  }

  get puedeRechazar(): boolean {
    return this.estadoActual !== 'Rechazada';
  }

  onImagenReferenciaChange(event: Event, controlName: 'bordadoReferencia' | 'estampadoReferencia' | 'mockupUrl'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.error = 'El archivo debe ser una imagen valida';
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.form.get(controlName)?.setValue(String(reader.result || ''));
      this.form.get(controlName)?.markAsDirty();
      this.error = '';
    };
    reader.onerror = () => {
      this.error = 'No se pudo leer la imagen seleccionada';
    };
    reader.readAsDataURL(file);
  }

  limpiarImagen(controlName: 'bordadoReferencia' | 'estampadoReferencia' | 'mockupUrl'): void {
    this.form.get(controlName)?.setValue('');
    this.form.get(controlName)?.markAsDirty();
  }

  onPaletaPrincipalChange(): void {
    const color = this.normalizarPaleta(this.form.get('paletaRgb')?.value);
    this.form.get('paletaRgb')?.setValue(color, { emitEvent: false });
    this.sincronizarPaletaConControl(color);
  }

  quitarColorPaleta(color: string): void {
    this.paletaColores = this.paletaColores.filter(c => c !== color);
    const actual = this.normalizarPaleta(this.form.get('paletaRgb')?.value);
    if (actual === color) {
      this.form.get('paletaRgb')?.setValue(this.paletaColores[0] || '#000000');
    }
  }

  agregarColorPaleta(): void {
    const color = this.normalizarPaleta(this.form.get('paletaRgb')?.value);
    if (color && !this.paletaColores.includes(color)) {
      this.paletaColores = [...this.paletaColores, color];
    }
  }

  private setearPaletaDesdeTexto(paletaRaw: string | null | undefined): string {
    this.paletaColores = this.extraerColoresPaleta(paletaRaw);
    const principal = this.paletaColores[0] || '#000000';
    if (this.paletaColores.length === 0) this.paletaColores = [principal];
    return principal;
  }

  private extraerColoresPaleta(paletaRaw: string | null | undefined): string[] {
    if (!paletaRaw) return [];
    const matches = paletaRaw.match(/#([A-Fa-f0-9]{6})/g) || [];
    const normalizados = matches.map(c => c.toUpperCase());
    return Array.from(new Set(normalizados));
  }

  private sincronizarPaletaConControl(colorControl: string | null | undefined): void {
    const color = this.normalizarPaleta(colorControl);
    if (!this.paletaColores.includes(color)) {
      this.paletaColores = [color, ...this.paletaColores.filter(c => c !== color)];
    }
  }

  private serializarPaleta(): string {
    const controlColor = this.normalizarPaleta(this.form.get('paletaRgb')?.value);
    const colores = [controlColor, ...this.paletaColores.filter(c => c !== controlColor)];
    const unicos = Array.from(new Set(colores.filter(Boolean)));
    return unicos.join(', ');
  }

  private validarMuestraParaAceptar(): string | null {
    if (this.form.invalid) return 'Completa los campos obligatorios antes de aceptar la muestra';

    const formValue = this.form.getRawValue();
    if (!String(formValue.mockupUrl || '').trim()) {
      return 'Para aceptar la muestra debes cargar el mockup';
    }

    if (formValue.bordadoRequerido) {
      if (!String(formValue.bordadoDescripcion || '').trim()) {
        return 'Marcaste bordado: completa la descripcion';
      }
      if (!String(formValue.bordadoReferencia || '').trim()) {
        return 'Marcaste bordado: debes cargar la imagen de referencia';
      }
    }

    if (formValue.estampadoRequerido) {
      if (!String(formValue.estampadoDescripcion || '').trim()) {
        return 'Marcaste estampado: completa la descripcion';
      }
      if (!String(formValue.estampadoReferencia || '').trim()) {
        return 'Marcaste estampado: debes cargar la imagen de referencia';
      }
    }

    if (!String(formValue.paletaRgb || '').trim()) {
      return 'Completa la paleta de color antes de aceptar';
    }

    return null;
  }
}
