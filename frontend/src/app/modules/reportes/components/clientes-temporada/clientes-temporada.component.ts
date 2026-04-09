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

interface ClientePrendasResumen {
  cliente: string;
  tipoCliente: string;
  totalPrendas: number;
  cantidadProyectos: number;
  proyectosFinalizados: number;
  proyectosCancelados: number;
}

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

  readonly limiteTopClientes = 10;
  private chart?: Chart<'bar', (number | [number, number] | null)[], unknown>;

  filtros: ReporteClientesTemporadaRequest = {
    fechaInicio: undefined,
    fechaFin: undefined,
    idCliente: undefined
  };

  constructor(
    private reportesService: ReportesService,
    private alertas: AlertasService,
    private cdr: ChangeDetectorRef
  ) {
    this.filtros.fechaInicio = this.formatearFechaInput(this.sumarAnios(new Date(), -2));
    this.filtros.fechaFin = this.formatearFechaInput(new Date());
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
    if (this.filtros.fechaInicio && this.filtros.fechaFin && this.filtros.fechaInicio > this.filtros.fechaFin) {
      this.alertas.warning('Rango invalido', 'La fecha de inicio no puede ser mayor a la fecha de fin');
      return;
    }

    this.cargarReporte();
  }

  limpiarFiltros(): void {
    this.filtros = {
      fechaInicio: this.formatearFechaInput(this.sumarAnios(new Date(), -2)),
      fechaFin: this.formatearFechaInput(new Date()),
      idCliente: undefined
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
          if (a.totalPrendas !== b.totalPrendas) return b.totalPrendas - a.totalPrendas;
          return a.cliente.localeCompare(b.cliente);
        });

        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.crearGrafico(), 0);
      },
      error: (err) => {
        this.loading = false;
        this.error = true;
        this.mensajeError = err.message || 'No se pudo cargar el reporte de demanda por cliente.';
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
        'Cant. Proyectos': f.cantidadProyectos,
        'Total Prendas': f.totalPrendas,
        'Promedio Prendas/Proyecto': this.calcularPromedioPrendas(f),
        Finalizados: f.proyectosFinalizados,
        Cancelados: f.proyectosCancelados,
        'Cancelacion %': this.calcularPorcentajeCancelacion(f)
      }));

      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datos);
      const workbook: XLSX.WorkBook = {
        Sheets: { 'Demanda por Cliente': worksheet },
        SheetNames: ['Demanda por Cliente']
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
      a.download = `reporte_demanda_clientes_${fecha}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      this.alertas.success('Exportacion exitosa', `Se exportaron ${this.filas.length} registros`);
    } catch {
      this.alertas.error('Error', 'No se pudo generar el archivo Excel');
    }
  }

  get sinDatos(): boolean {
    return !this.loading && !this.error && this.filas.length === 0;
  }

  get totalPrendasReporte(): number {
    return this.filas.reduce((total, fila) => total + fila.totalPrendas, 0);
  }

  get totalProyectosReporte(): number {
    return this.filas.reduce((total, fila) => total + fila.cantidadProyectos, 0);
  }

  get clientesConDemanda(): number {
    return this.filas.filter((fila) => fila.totalPrendas > 0).length;
  }

  get promedioPrendasPorCliente(): number {
    if (this.clientesConDemanda === 0) return 0;
    return Math.round(this.totalPrendasReporte / this.clientesConDemanda);
  }

  calcularPromedioPrendas(fila: ReporteClientesTemporadaItem): number {
    if (fila.cantidadProyectos === 0) return 0;
    return Math.round(fila.totalPrendas / fila.cantidadProyectos);
  }

  calcularPorcentajeCancelacion(fila: ReporteClientesTemporadaItem): number {
    if (fila.cantidadProyectos === 0) return 0;
    return Math.round((fila.proyectosCancelados / fila.cantidadProyectos) * 100);
  }

  private formatearFechaInput(fecha: Date): string {
    return fecha.toISOString().slice(0, 10);
  }

  private sumarAnios(fecha: Date, anios: number): Date {
    const resultado = new Date(fecha);
    resultado.setFullYear(resultado.getFullYear() + anios);
    return resultado;
  }

  get tituloGrafico(): string {
    if (this.filtros.idCliente) {
      return 'Prendas del cliente seleccionado';
    }

    return `Top ${Math.min(this.limiteTopClientes, this.obtenerTopClientesPorPrendas().length)} clientes por prendas`;
  }

  private obtenerTopClientesPorPrendas(): ClientePrendasResumen[] {
    const clientes = new Map<number, ClientePrendasResumen>();

    this.filas.forEach((fila) => {
      const resumen = clientes.get(fila.idCliente) || {
        cliente: fila.cliente,
        tipoCliente: fila.tipoCliente,
        totalPrendas: 0,
        cantidadProyectos: 0,
        proyectosFinalizados: 0,
        proyectosCancelados: 0
      };

      resumen.totalPrendas += fila.totalPrendas;
      resumen.cantidadProyectos += fila.cantidadProyectos;
      resumen.proyectosFinalizados += fila.proyectosFinalizados;
      resumen.proyectosCancelados += fila.proyectosCancelados;

      clientes.set(fila.idCliente, resumen);
    });

    return Array.from(clientes.values())
      .sort((a, b) => b.totalPrendas - a.totalPrendas)
      .slice(0, this.limiteTopClientes);
  }

  private crearGrafico(): void {
    if (!this.chartRef) return;

    this.chart?.destroy();
    this.chart = undefined;

    if (this.filas.length === 0) return;

    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const topClientes = this.obtenerTopClientesPorPrendas();
    const clientes = topClientes.map((item) => item.cliente);
    const data = topClientes.map((item) => item.totalPrendas);

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: clientes,
        datasets: [
          {
            label: 'Total prendas',
            data,
            borderRadius: 6,
            borderWidth: 0,
            backgroundColor: '#ff6d2d'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const resumen = topClientes[context.dataIndex];
                if (!resumen) return '';

                const prendas = resumen.totalPrendas.toLocaleString('es-AR');
                const cancelacion = resumen.cantidadProyectos > 0
                  ? Math.round((resumen.proyectosCancelados / resumen.cantidadProyectos) * 100)
                  : 0;

                return [
                  `Prendas: ${prendas}`,
                  `Proyectos: ${resumen.cantidadProyectos}`,
                  `Finalizados: ${resumen.proyectosFinalizados}`,
                  `Cancelados: ${resumen.proyectosCancelados} (${cancelacion}%)`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: '#f2f2f2' },
            title: {
              display: true,
              text: 'Total prendas',
              color: '#5f6368',
              font: { weight: 600 }
            },
            ticks: {
              precision: 0,
              color: '#5f6368',
              callback: (value) => Number(value).toLocaleString('es-AR')
            }
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
