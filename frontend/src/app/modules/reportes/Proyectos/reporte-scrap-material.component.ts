import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { environment } from '../../../../environments/environment';

Chart.register(...registerables);

interface ScrapKpi {
  totalScrap: number;
  proyectosAfectados: number;
  totalRegistros: number;
}

interface ScrapResumenProyecto {
  idProyecto: number;
  codigoProyecto: string;
  nombreProyecto: string;
  cliente: string;
  cantidadScrapTotal: number;
  registros: number;
}

interface ScrapResumenInsumo {
  insumo: string;
  cantidadScrapTotal: number;
  registros: number;
}

interface ScrapSerieTemporal {
  fecha: string;
  cantidadScrap: number;
}

interface ScrapRegistro {
  idScrap: number;
  idProyecto: number;
  codigoProyecto: string;
  nombreProyecto: string;
  cliente: string;
  insumo: string;
  cantidadScrap: number;
  motivo: string;
  destino: string;
  areaOcurrencia: string;
  fechaRegistro: string;
}

interface ProyectoFiltro {
  idProyecto: number;
  codigoProyecto: string;
  nombreProyecto: string;
}

@Component({
  selector: 'app-reporte-scrap-material',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-scrap-material.component.html',
  styleUrls: ['./reporte-scrap-material.component.css']
})
export class ReporteScrapMaterialComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartTemporal') chartTemporalRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartProyecto') chartProyectoRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartInsumo') chartInsumoRef!: ElementRef<HTMLCanvasElement>;

  loading = false;
  error = false;
  mensajeError = '';
  dataCargada = false;

  filtros = { fechaDesde: '', fechaHasta: '', idProyecto: '' };

  kpis: ScrapKpi = { totalScrap: 0, proyectosAfectados: 0, totalRegistros: 0 };
  resumenPorProyecto: ScrapResumenProyecto[] = [];
  resumenPorInsumo: ScrapResumenInsumo[] = [];
  serieTemporal: ScrapSerieTemporal[] = [];
  registros: ScrapRegistro[] = [];
  proyectos: ProyectoFiltro[] = [];

  vistaActiva: 'graficos' | 'resumen' | 'detalle' = 'graficos';

  private chartTemporal?: Chart;
  private chartProyecto?: Chart;
  private chartInsumo?: Chart;

  private readonly COLORES = [
    '#ff6b35', '#f4511e', '#ff9800', '#ffc107',
    '#4caf50', '#2196f3', '#9c27b0', '#e91e63',
    '#00bcd4', '#8bc34a'
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    if (this.dataCargada) this.renderizarGraficos();
  }

  ngOnDestroy(): void {
    this.chartTemporal?.destroy();
    this.chartProyecto?.destroy();
    this.chartInsumo?.destroy();
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = false;

    const params: Record<string, string> = {};
    if (this.filtros.fechaDesde) params['fechaDesde'] = this.filtros.fechaDesde;
    if (this.filtros.fechaHasta) params['fechaHasta'] = this.filtros.fechaHasta;
    if (this.filtros.idProyecto) params['idProyecto'] = this.filtros.idProyecto;

    const query = new URLSearchParams(params).toString();
    const url = `${environment.apiUrl}/Reportes/scrap${query ? '?' + query : ''}`;

    this.http.get<any>(url).subscribe({
      next: (data) => {
        this.kpis = data.kpis;
        this.resumenPorProyecto = data.resumenPorProyecto;
        this.resumenPorInsumo = data.resumenPorInsumo;
        this.serieTemporal = data.serieTemporal;
        this.registros = data.registros;
        this.proyectos = data.proyectos;
        this.loading = false;
        this.dataCargada = true;
        setTimeout(() => this.renderizarGraficos(), 50);
      },
      error: (err) => {
        this.mensajeError = err?.error?.message || 'Error al cargar el reporte de scrap';
        this.error = true;
        this.loading = false;
      }
    });
  }

  aplicarFiltros(): void { this.cargarDatos(); }

  limpiarFiltros(): void {
    this.filtros = { fechaDesde: '', fechaHasta: '', idProyecto: '' };
    this.cargarDatos();
  }

  cambiarVista(v: 'graficos' | 'resumen' | 'detalle'): void {
    this.vistaActiva = v;
    if (v === 'graficos') setTimeout(() => this.renderizarGraficos(), 50);
  }

  private renderizarGraficos(): void {
    this.renderizarTemporal();
    this.renderizarPorProyecto();
    this.renderizarPorInsumo();
  }

  private renderizarTemporal(): void {
    if (!this.chartTemporalRef?.nativeElement || !this.serieTemporal.length) return;
    this.chartTemporal?.destroy();

    const cfg: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.serieTemporal.map(s => this.formatearFecha(s.fecha)),
        datasets: [{
          label: 'Scrap (u.)',
          data: this.serieTemporal.map(s => Number(s.cantidadScrap)),
          borderColor: '#ff6b35',
          backgroundColor: 'rgba(255,107,53,0.12)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#ff6b35',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 11 } } },
          x: { ticks: { font: { size: 11 } } }
        }
      }
    };
    this.chartTemporal = new Chart(this.chartTemporalRef.nativeElement, cfg);
  }

  private renderizarPorProyecto(): void {
    if (!this.chartProyectoRef?.nativeElement || !this.resumenPorProyecto.length) return;
    this.chartProyecto?.destroy();

    const top = this.resumenPorProyecto.slice(0, 8);
    const cfg: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: top.map(r => r.codigoProyecto),
        datasets: [{
          label: 'Scrap (u.)',
          data: top.map(r => Number(r.cantidadScrapTotal)),
          backgroundColor: top.map((_, i) => this.COLORES[i % this.COLORES.length]),
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { font: { size: 11 } } },
          y: { ticks: { font: { size: 11 } } }
        }
      }
    };
    this.chartProyecto = new Chart(this.chartProyectoRef.nativeElement, cfg);
  }

  private renderizarPorInsumo(): void {
    if (!this.chartInsumoRef?.nativeElement || !this.resumenPorInsumo.length) return;
    this.chartInsumo?.destroy();

    const top = this.resumenPorInsumo.slice(0, 6);
    const cfg: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: top.map(r => r.insumo),
        datasets: [{
          data: top.map(r => Number(r.cantidadScrapTotal)),
          backgroundColor: top.map((_, i) => this.COLORES[i % this.COLORES.length]),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 14 } }
        }
      }
    };
    this.chartInsumo = new Chart(this.chartInsumoRef.nativeElement, cfg);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  getClaseScrap(cantidad: number): string {
    if (cantidad <= 0) return '';
    if (cantidad < 5) return 'scrap-bajo';
    if (cantidad < 20) return 'scrap-medio';
    return 'scrap-alto';
  }
}
