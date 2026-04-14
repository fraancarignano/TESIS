import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MuestrasService } from '../../services/muestra.service';
import { MuestraDetalle } from '../../models/muestra.model';
import { AlertasService } from '../../../../core/services/alertas';

@Component({
  selector: 'app-muestra-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './muestra-list.component.html',
  styleUrls: ['./muestra-list.component.css']
})
export class MuestraListComponent implements OnInit {
  muestras: MuestraDetalle[] = [];
  terminoBusqueda = '';
  loading = false;
  error = false;
  paginaActual = 1;
  tamanioPagina = 25;
  readonly tamaniosPagina = [25, 50, 100];

  constructor(
    private muestrasService: MuestrasService,
    private alertas: AlertasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarMuestras();
  }

  cargarMuestras(): void {
    this.loading = true;
    this.error = false;
    this.paginaActual = 1;

    this.muestrasService.obtenerMuestras().subscribe({
      next: (data) => {
        this.muestras = data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar muestras:', err);
        this.error = true;
        this.loading = false;
        this.alertas.error('Error', 'No se pudieron cargar las muestras');
      }
    });
  }

  get muestrasFiltradas(): MuestraDetalle[] {
    let resultado = [...this.muestras];

    if (this.terminoBusqueda) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(m =>
        (m.nombreMuestra?.toLowerCase().includes(termino)) ||
        (m.codigoMuestra?.toLowerCase().includes(termino)) ||
        (m.estado?.toLowerCase().includes(termino)) ||
        (m.nombreCliente?.toLowerCase().includes(termino))
      );
    }

    return resultado;
  }

  get totalFiltrados(): number {
    return this.muestrasFiltradas.length;
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.totalFiltrados / this.tamanioPagina));
  }

  get muestrasPaginadas(): MuestraDetalle[] {
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = this.totalPaginas;
    }
    const inicio = (this.paginaActual - 1) * this.tamanioPagina;
    return this.muestrasFiltradas.slice(inicio, inicio + this.tamanioPagina);
  }

  get desdeRegistro(): number {
    if (this.totalFiltrados === 0) return 0;
    return (this.paginaActual - 1) * this.tamanioPagina + 1;
  }

  get hastaRegistro(): number {
    if (this.totalFiltrados === 0) return 0;
    return Math.min(this.paginaActual * this.tamanioPagina, this.totalFiltrados);
  }

  cambiarTamanioPagina(value: number | string): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    this.tamanioPagina = parsed;
    this.paginaActual = 1;
  }

  paginaAnterior(): void {
    if (this.paginaActual <= 1) return;
    this.paginaActual -= 1;
  }

  paginaSiguiente(): void {
    if (this.paginaActual >= this.totalPaginas) return;
    this.paginaActual += 1;
  }

  abrirDetalle(muestra: MuestraDetalle): void {
    if (!muestra.idMuestra) return;
    this.router.navigate(['/proyectos/muestras', muestra.idMuestra], {
      state: { muestra }
    });
  }

  eliminarMuestra(event: MouseEvent, muestra: MuestraDetalle): void {
    event.stopPropagation();

    const id = muestra.idMuestra;
    if (!id) return;

    const confirmado = window.confirm(`¿Seguro que querés borrar la muestra "${muestra.nombreMuestra}"?`);
    if (!confirmado) return;

    this.muestrasService.eliminarMuestra(id).subscribe({
      next: () => {
        this.muestras = this.muestras.filter(m => m.idMuestra !== id);
        this.alertas.success('Eliminada', 'La muestra se borró correctamente');
      },
      error: (err) => {
        console.error('Error al eliminar muestra:', err);
        this.alertas.error('Error', err.message || 'No se pudo borrar la muestra');
      }
    });
  }

  trackByMuestra(index: number, muestra: MuestraDetalle): number {
    return muestra.idMuestra ?? index;
  }

  abrirCrear(): void {
    this.router.navigate(['/proyectos/crear-muestra']);
  }

  getEstadoClass(estado: string): string {
    const estados: { [key: string]: string } = {
      'Pendiente': 'badge-pendiente',
      'En Proceso': 'badge-en-curso',
      'Finalizado': 'badge-finalizado',
      'Despachado': 'badge-despachado',
      'Cancelado': 'badge-cancelado',
      'Pausado': 'badge-pausado',
      'Archivado': 'badge-inactivo'
    };
    return estados[estado] || 'badge-default';
  }
}
