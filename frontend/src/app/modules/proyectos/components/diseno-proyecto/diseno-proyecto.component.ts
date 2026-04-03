import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AlertasService } from '../../../../core/services/alertas';
import {
  ProyectoDisenoDetalle,
  ProyectoDisenoPayload,
  ProyectoResumenDiseno,
  ProyectoResumenDisenoPrenda
} from '../../models/diseno.model';
import { DisenoService } from '../../services/diseno.service';

interface DisenoPrendaForm {
  idPrenda: number;
  imagenLogo?: string;
  descripcionLogo: string;
  imagenMockup: string;
  descripcionMockup: string;
}

@Component({
  selector: 'app-diseno-proyecto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diseno-proyecto.component.html',
  styleUrls: ['./diseno-proyecto.component.css']
})
export class DisenoProyectoComponent implements OnInit {
  private readonly formatosPermitidos = ['image/png', 'image/jpeg', 'image/jpg'];
  private readonly maxFileBytes = 5 * 1024 * 1024;

  idProyecto = 0;
  loading = true;
  saving = false;
  error = '';

  resumen: ProyectoResumenDiseno | null = null;
  diseno: ProyectoDisenoDetalle | null = null;
  readonlyMode = false;
  observacionesGenerales = '';
  formByPrenda: Record<number, DisenoPrendaForm> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private disenoService: DisenoService,
    private alertas: AlertasService
  ) {}

  ngOnInit(): void {
    this.idProyecto = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.idProyecto) {
      this.error = 'ID de proyecto inválido.';
      this.loading = false;
      return;
    }

    this.cargarPantalla();
  }

  cargarPantalla(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      resumen: this.disenoService.obtenerResumenProyecto(this.idProyecto),
      diseno: this.disenoService.obtenerDiseno(this.idProyecto).pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ resumen, diseno }) => {
        this.resumen = resumen;
        this.diseno = diseno;
        this.readonlyMode = !!(resumen.areaCompletada || diseno?.completado);
        this.observacionesGenerales = diseno?.observacionesGenerales ?? '';
        this.inicializarFormulario();
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.message || 'No se pudo cargar el módulo de diseño.';
        this.loading = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/proyectos/detalle', this.idProyecto]);
  }

  async completarDiseno(): Promise<void> {
    if (!this.resumen || this.readonlyMode || this.saving) return;

    const validacion = this.validarFormulario();
    if (validacion) {
      this.alertas.warning('Datos incompletos', validacion);
      return;
    }

    const confirmado = await this.alertas.confirmar(
      '¿Completar diseño?',
      'Se guardarán las imágenes y luego el área quedará en modo solo lectura.',
      'Sí, completar'
    );

    if (!confirmado) return;

    this.saving = true;
    const payload = this.construirPayload();

    this.disenoService.guardarDiseno(this.idProyecto, payload).subscribe({
      next: () => {
        this.disenoService.completarArea(this.idProyecto, this.observacionesGenerales).subscribe({
          next: (disenoFinal) => {
            this.diseno = disenoFinal;
            this.readonlyMode = true;
            this.saving = false;
            this.alertas.success('Diseño completado', 'El área quedó registrada como completada.');
          },
          error: (err) => {
            this.saving = false;
            this.alertas.error('Error', err?.message || 'No se pudo completar el área.');
          }
        });
      },
      error: (err) => {
        this.saving = false;
        this.alertas.error('Error', err?.message || 'No se pudo guardar el diseño.');
      }
    });
  }

  getTallesTexto(prenda: ProyectoResumenDisenoPrenda): string {
    if (!prenda.talles?.length) return 'Sin distribución';
    return prenda.talles.map(t => `${t.nombreTalle} (${t.cantidad})`).join(', ');
  }

  necesitaLogo(prenda: ProyectoResumenDisenoPrenda): boolean {
    return !!(prenda.tieneBordado || prenda.tieneEstampado);
  }

  getForm(prendaId: number): DisenoPrendaForm {
    return this.formByPrenda[prendaId];
  }

  async onArchivoSeleccionado(event: Event, prenda: ProyectoResumenDisenoPrenda, tipo: 'logo' | 'mockup'): Promise<void> {
    if (this.readonlyMode) return;

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!this.formatosPermitidos.includes(file.type)) {
      this.alertas.warning('Formato no válido', 'Solo se permiten imágenes JPG, JPEG o PNG.');
      input.value = '';
      return;
    }

    if (file.size > this.maxFileBytes) {
      this.alertas.warning('Archivo demasiado grande', 'La imagen no puede superar los 5 MB.');
      input.value = '';
      return;
    }

    const base64 = await this.archivoABase64(file);
    const form = this.getForm(prenda.idProyectoPrenda);

    if (tipo === 'logo') {
      form.imagenLogo = base64;
    } else {
      form.imagenMockup = base64;
    }

    input.value = '';
  }

  limpiarImagen(prendaId: number, tipo: 'logo' | 'mockup'): void {
    if (this.readonlyMode) return;
    const form = this.getForm(prendaId);
    if (tipo === 'logo') {
      form.imagenLogo = '';
      form.descripcionLogo = '';
      return;
    }

    form.imagenMockup = '';
    form.descripcionMockup = '';
  }

  private inicializarFormulario(): void {
    this.formByPrenda = {};
    if (!this.resumen) return;

    for (const prenda of this.resumen.prendas) {
      const guardado = this.diseno?.prendas.find(x => x.idPrenda === prenda.idProyectoPrenda);
      this.formByPrenda[prenda.idProyectoPrenda] = {
        idPrenda: prenda.idProyectoPrenda,
        imagenLogo: guardado?.imagenLogo ?? '',
        descripcionLogo: guardado?.descripcionLogo ?? '',
        imagenMockup: guardado?.imagenMockup ?? '',
        descripcionMockup: guardado?.descripcionMockup ?? ''
      };
    }
  }

  private construirPayload(): ProyectoDisenoPayload {
    return {
      observacionesGenerales: this.observacionesGenerales?.trim() || undefined,
      prendas: (this.resumen?.prendas ?? []).map(prenda => {
        const form = this.getForm(prenda.idProyectoPrenda);
        return {
          idPrenda: prenda.idProyectoPrenda,
          imagenLogo: form.imagenLogo?.trim() || undefined,
          descripcionLogo: form.descripcionLogo?.trim() || undefined,
          imagenMockup: form.imagenMockup.trim(),
          descripcionMockup: form.descripcionMockup?.trim() || undefined
        };
      })
    };
  }

  private validarFormulario(): string | null {
    if (!this.resumen?.prendas.length) {
      return 'El proyecto no tiene prendas para diseñar.';
    }

    for (const prenda of this.resumen.prendas) {
      const form = this.getForm(prenda.idProyectoPrenda);

      if (!form.imagenMockup?.trim()) {
        return `La prenda "${prenda.tipoPrenda}" necesita un mockup.`;
      }

      if (this.necesitaLogo(prenda) && !form.imagenLogo?.trim()) {
        return `La prenda "${prenda.tipoPrenda}" necesita imagen de logo por bordado o estampado.`;
      }
    }

    return null;
  }

  private archivoABase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
