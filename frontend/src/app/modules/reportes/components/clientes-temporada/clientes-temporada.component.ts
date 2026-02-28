import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import * as XLSX from 'xlsx';
import { AlertasService } from '../../../../core/services/alertas';
import { ReportesService, ClienteResumen } from '../../services/reportes.service';
import {
  ReporteClientesTemporadaItem,
  ReporteClientesTemporadaRequest,
  ReporteClientesTemporadaResponse
} from '../../models/reporte.model';

Chart.register(...registerables);

@Component({
  selector: 'app-clientes-temporada',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './clientes-temporada.component.html',
  styleUrls: ['./clientes-temporada.component.css']
})
export class ClientesTemporadaComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartClientesTemporada') chartRef!: ElementRef<HTMLCanvasElement>;

  loading = false;
  error = false;
  mensajeError = '';

  clientes: ClienteResumen[] = [];
  datosReporte: ReporteClientesTemporadaResponse | null = null;
  filas: ReporteClientesTemporadaItem[] = [];

  readonly temporadas = ['Primavera-Verano', 'Otoño-Invierno'];
  readonly aniosDisponibles: number[] = [];
  private chart?: Chart<'bar', (number | [number, number] | null)[], unknown>;

  filtros: ReporteClientesTemporadaRequest = {
    anioInicio: undefined,
    anioFin: undefined,
    idCliente: undefined,
    temporada: undefined
  };

  constructor(
    private reportesService: ReportesService,
    private alertas: AlertasService,
    private cdr: ChangeDetectorRef
  ) {
    const anioActual = new Date().getFullYear();
    for (let i = 0; i < 10; i++) {
      this.aniosDisponibles.push(anioActual - i);
    }

    this.filtros.anioInicio = anioActual - 2;
    this.filtros.anioFin = anioActual;
  }

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarReporte();
  }

  ngAfterViewInit(): void {
    if (this.filas.length > 0) {
      this.crearGrafico();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  cargarClientes(): void {
    this.reportesService.obtenerClientesConProyectos().subscribe({
      next: (clientes) => {
        this.clientes = clientes;
      },
      error: () => {
        this.alertas.warning('Aviso', 'No se pudieron cargar los clientes para el filtro');
      }
    });
  }

  aplicarFiltros(): void {
    if (
      this.filtros.anioInicio !== undefined &&
      this.filtros.anioFin !== undefined &&
      this.filtros.anioInicio > this.filtros.anioFin
    ) {
      this.alertas.warning('Rango inválido', 'El Año Inicio no puede ser mayor al Año Fin');
      return;
    }

    this.cargarReporte();
  }

  limpiarFiltros(): void {
    const anioActual = new Date().getFullYear();
    this.filtros = {
      anioInicio: anioActual - 2,
      anioFin: anioActual,
      idCliente: undefined,
      temporada: undefined
    };
    this.cargarReporte();
  }

  cargarReporte(): void {
    this.loading = true;
    this.error = false;
    this.mensajeError = '';

    this.reportesService.obtenerReporteClientesTemporada(this.filtros).subscribe({
      next: (response) => {
        this.datosReporte = response;
        this.filas = [...response.items].sort((a, b) => {
          if (a.anio !== b.anio) return b.anio - a.anio;
          return a.cliente.localeCompare(b.cliente);
        });

        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.crearGrafico(), 0);
      },
      error: (err) => {
        this.loading = false;
        this.error = true;
        this.mensajeError = err.message || 'No se pudo cargar el reporte de clientes por temporada.';
        this.alertas.error('Error', this.mensajeError);
      }
    });
  }

  exportarExcel(): void {
    if (this.filas.length === 0) {
      this.alertas.warning('Sin datos', 'No hay datos para exportar');
      return;
    }

    try {
      const datos = this.filas.map((f) => ({
        Cliente: f.cliente,
        'Tipo Cliente': f.tipoCliente,
        Año: f.anio,
        Temporada: f.temporada,
        'Cant. Proyectos': f.cantidadProyectos,
        'Total Prendas': f.totalPrendas,
        Finalizados: f.proyectosFinalizados,
        Cancelados: f.proyectosCancelados
      }));

      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datos);
      const workbook: XLSX.WorkBook = {
        Sheets: { 'Clientes por Temporada': worksheet },
        SheetNames: ['Clientes por Temporada']
      };

      const excelBuffer: ArrayBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      });

      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
      });

      const fecha = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_clientes_temporada_${fecha}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      this.alertas.success('Exportación exitosa', `Se exportaron ${this.filas.length} registros`);
    } catch {
      this.alertas.error('Error', 'No se pudo generar el archivo Excel');
    }
  }

  get sinDatos(): boolean {
    return !this.loading && !this.error && this.filas.length === 0;
  }

  private crearGrafico(): void {
    if (!this.chartRef) return;

    this.chart?.destroy();
    this.chart = undefined;

    if (this.filas.length === 0) return;

    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const clientes = Array.from(new Set(this.filas.map((f) => f.cliente)));
    const temporadas = this.filtros.temporada ? [this.filtros.temporada] : this.temporadas;

    const datasets = temporadas.map((temporada, index) => {
      const data = clientes.map((cliente) =>
        this.filas
          .filter((f) => f.cliente === cliente && f.temporada === temporada)
          .reduce((acum, actual) => acum + actual.cantidadProyectos, 0)
      );

      return {
        label: temporada,
        data,
        borderRadius: 6,
        borderWidth: 0,
        backgroundColor: index === 0 ? '#ff6d2d' : '#1f3b6b'
      };
    });

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: clientes,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 16
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.x} proyectos`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: '#f2f2f2' },
            ticks: { precision: 0, color: '#5f6368' }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#2f2f2f' }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }
}

export default ClientesTemporadaComponent;
