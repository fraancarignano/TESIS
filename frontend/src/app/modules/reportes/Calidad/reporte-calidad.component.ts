import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import {
  CalidadPorTaller,
  CriterioFalla,
  ReporteCalidad,
  ReportesService,
  TalleCalidad
} from '../services/reportes.service';

Chart.register(...registerables);

@Component({
  selector: 'app-reporte-calidad',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './reporte-calidad.component.html',
  styleUrls: ['./reporte-calidad.component.css']
})
export class ReporteCalidadComponent implements OnInit, AfterViewInit, OnDestroy {
  loading = false;
  error = false;
  mensajeError = '';
  datosReporte: ReporteCalidad | null = null;

  filtroProyectoId?: number;
  filtroFechaInicio = '';
  filtroFechaFin = '';

  @ViewChild('chartResultados') chartResultadosRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartTalles') chartTallesRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartFallas') chartFallasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartCalidadTaller') chartCalidadTallerRef!: ElementRef<HTMLCanvasElement>;

  private chartResultados?: Chart;
  private chartTalles?: Chart;
  private chartFallas?: Chart;
  private chartCalidadTaller?: Chart;

  datosTaller: CalidadPorTaller[] = [];

  constructor(
    private reportesService: ReportesService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    if (this.datosReporte) {
      this.crearGraficos();
    }
  }

  ngOnDestroy(): void {
    this.destruirGraficos();
  }

  aplicarFiltros(): void {
    this.cargarDatos();
  }

  limpiarFiltros(): void {
    this.filtroProyectoId = undefined;
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = false;
    this.mensajeError = '';

    this.reportesService.obtenerReporteCalidad(
      this.filtroProyectoId,
      this.filtroFechaInicio || undefined,
      this.filtroFechaFin || undefined
    ).subscribe({
      next: (datos) => {
        this.datosReporte = datos;
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.crearGraficos(), 0);
      },
      error: (err) => {
        this.loading = false;
        this.error = true;
        this.mensajeError = err.message || 'No se pudo cargar el reporte de calidad.';
      }
    });

    this.reportesService.obtenerCalidadPorTaller(
      this.filtroProyectoId,
      this.filtroFechaInicio || undefined,
      this.filtroFechaFin || undefined
    ).subscribe({
      next: (datos) => {
        this.datosTaller = datos;
        this.cdr.detectChanges();
        setTimeout(() => this.crearGraficoCalidadTaller(), 0);
      },
      error: () => { /* silencioso, el gráfico simplemente no aparece */ }
    });
  }

  private crearGraficos(): void {
    if (!this.datosReporte) return;
    this.destruirGraficos();
    this.crearGraficoResultados();
    this.crearGraficoTalles();
    this.crearGraficoFallas();
  }

  private destruirGraficos(): void {
    this.chartResultados?.destroy();
    this.chartTalles?.destroy();
    this.chartFallas?.destroy();
    this.chartCalidadTaller?.destroy();
    this.chartResultados = undefined;
    this.chartTalles = undefined;
    this.chartFallas = undefined;
    this.chartCalidadTaller = undefined;
  }

  private crearGraficoResultados(): void {
    if (!this.chartResultadosRef || !this.datosReporte) return;
    const ctx = this.chartResultadosRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.datosReporte.distribucionResultados.map(x => x.resultado);
    const data = this.datosReporte.distribucionResultados.map(x => x.cantidad);

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ['#2e7d32', '#f57c00', '#c62828', '#607d8b']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    };

    this.chartResultados = new Chart(ctx, config);
  }

  private crearGraficoTalles(): void {
    if (!this.chartTallesRef || !this.datosReporte) return;
    const ctx = this.chartTallesRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const dataTalles: TalleCalidad[] = this.datosReporte.distribucionPorTalle;
    const labels = dataTalles.map(x => x.talle);
    const data = dataTalles.map(x => x.cantidad);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Inspeccionadas por talle',
          data,
          backgroundColor: '#1976d2'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    };

    this.chartTalles = new Chart(ctx, config);
  }

  private crearGraficoFallas(): void {
    if (!this.chartFallasRef || !this.datosReporte) return;
    const ctx = this.chartFallasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const dataFallas: CriterioFalla[] = this.datosReporte.fallasPorCriterio.slice(0, 8);
    const labels = dataFallas.map(x => x.criterio);
    const data = dataFallas.map(x => x.cantidadFallas);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Fallas por criterio',
          data,
          backgroundColor: '#c62828'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } }
      }
    };

    this.chartFallas = new Chart(ctx, config);
  }

  getPorcentajeAprobacion(t: CalidadPorTaller): number {
    if (!t.totalInspecciones) return 0;
    return Math.round((t.aprobadas / t.totalInspecciones) * 100);
  }

  getTallerOrdenado(): CalidadPorTaller[] {
    return [...this.datosTaller].sort((a, b) => this.getPorcentajeAprobacion(b) - this.getPorcentajeAprobacion(a));
  }

  private crearGraficoCalidadTaller(): void {
    if (!this.chartCalidadTallerRef || !this.datosTaller.length) return;
    const ctx = this.chartCalidadTallerRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chartCalidadTaller?.destroy();

    // Ordenar por % aprobación descendente
    const ordenados = this.getTallerOrdenado();
    const labels = ordenados.map(t => t.nombreTaller);

    // Convertir a porcentajes para stacked 100%
    const pctAprobadas = ordenados.map(t =>
      t.totalInspecciones ? Math.round((t.aprobadas / t.totalInspecciones) * 100) : 0
    );
    const pctObservadas = ordenados.map(t =>
      t.totalInspecciones ? Math.round((t.observadas / t.totalInspecciones) * 100) : 0
    );
    const pctRechazadas = ordenados.map(t =>
      t.totalInspecciones ? Math.round((t.rechazadas / t.totalInspecciones) * 100) : 0
    );

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Aprobadas',
            data: pctAprobadas,
            backgroundColor: '#2e7d32',
            borderRadius: 0
          },
          {
            label: 'Observadas',
            data: pctObservadas,
            backgroundColor: '#f57c00',
            borderRadius: 0
          },
          {
            label: 'Rechazadas',
            data: pctRechazadas,
            backgroundColor: '#c62828',
            borderRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (item) => {
                const idx = item.dataIndex;
                const t = ordenados[idx];
                const abs = item.datasetIndex === 0 ? t.aprobadas
                  : item.datasetIndex === 1 ? t.observadas
                  : t.rechazadas;
                return ` ${item.dataset.label}: ${item.parsed.x}%  (${abs} insp.)`;
              },
              footer: (items) => {
                const idx = items[0].dataIndex;
                return `Total inspecciones: ${ordenados[idx].totalInspecciones}`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            max: 100,
            ticks: { callback: (v) => `${v}%` },
            grid: { display: false }
          },
          y: {
            stacked: true
          }
        }
      }
    };

    this.chartCalidadTaller = new Chart(ctx, config);
  }
}

export default ReporteCalidadComponent;

