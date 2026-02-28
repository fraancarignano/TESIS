import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ReportesService, ProduccionPorPrenda, EvolucionPrenda, ClienteResumen } from '../services/reportes.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Component({
    selector: 'app-reporte-proyectos',
    standalone: true,
    imports: [CommonModule, FormsModule, HttpClientModule],
    templateUrl: './reporte-proyectos.component.html',
    styleUrls: ['./reporte-proyectos.component.css']
})
export class ReporteProyectosComponent implements OnInit, AfterViewInit, OnDestroy {

    // Datos del gráfico
    datosReporte: ProduccionPorPrenda[] = [];
    datosEvolucion: EvolucionPrenda[] = [];
    loading = false;
    error = false;
    mensajeError = '';

    // Para filtros
    clientes: ClienteResumen[] = [];
    tiposPrenda: string[] = [];

    // Filtros activos en el formulario
    filtros = {
        fechaDesde: '',
        fechaHasta: '',
        idCliente: undefined as number | undefined,
        tipoPrenda: ''
    };

    get modoEvolucion(): boolean {
        return !!this.filtros.tipoPrenda;
    }

    @ViewChild('chartProduccion') chartRef!: ElementRef<HTMLCanvasElement>;

    private chart?: Chart;

    constructor(
        private reportesService: ReportesService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarOpciones();
        this.cargarDatos();
    }

    ngAfterViewInit(): void {
        if (this.datosReporte.length > 0 || this.datosEvolucion.length > 0) {
            this.crearGrafico();
        }
    }

    cargarOpciones(): void {
        this.reportesService.obtenerClientesConProyectos().subscribe({
            next: (c) => this.clientes = c,
            error: () => { }
        });
        this.reportesService.obtenerTiposPrenda().subscribe({
            next: (t) => this.tiposPrenda = t,
            error: () => { }
        });
    }

    cargarDatos(): void {
        this.loading = true;
        this.error = false;

        if (this.modoEvolucion) {
            // Gráfico de línea — evolución temporal de una prenda
            this.reportesService.obtenerEvolucionPrenda(
                this.filtros.tipoPrenda,
                this.filtros.fechaDesde || undefined,
                this.filtros.fechaHasta || undefined,
                this.filtros.idCliente
            ).subscribe({
                next: (datos) => {
                    this.datosEvolucion = datos;
                    this.datosReporte = [];
                    this.loading = false;
                    this.cdr.detectChanges();
                    setTimeout(() => this.crearGrafico(), 0);
                },
                error: (err) => this.manejarError(err)
            });
        } else {
            // Gráfico de barras — producción por tipo de prenda
            this.reportesService.obtenerProduccionPorTipoPrenda(
                this.filtros.fechaDesde || undefined,
                this.filtros.fechaHasta || undefined,
                this.filtros.idCliente,
                undefined
            ).subscribe({
                next: (datos) => {
                    this.datosReporte = datos;
                    this.datosEvolucion = [];
                    this.loading = false;
                    this.cdr.detectChanges();
                    setTimeout(() => this.crearGrafico(), 0);
                },
                error: (err) => this.manejarError(err)
            });
        }
    }

    private manejarError(err: any): void {
        console.error('Error al cargar reporte:', err);
        this.error = true;
        this.mensajeError = err.message;
        this.loading = false;
    }

    aplicarFiltros(): void {
        this.cargarDatos();
    }

    limpiarFiltros(): void {
        this.filtros = { fechaDesde: '', fechaHasta: '', idCliente: undefined, tipoPrenda: '' };
        this.cargarDatos();
    }

    crearGrafico(): void {
        if (!this.chartRef) return;
        if (this.chart) this.chart.destroy();

        const ctx = this.chartRef.nativeElement.getContext('2d');
        if (!ctx) return;

        let config: ChartConfiguration;

        if (this.modoEvolucion && this.datosEvolucion.length > 0) {
            // Gráfico de línea (evolución temporal)
            const labels = this.datosEvolucion.map(d => `${MESES[d.mes - 1]} ${d.año}`);
            const data = this.datosEvolucion.map(d => d.cantidad);

            config = {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: this.filtros.tipoPrenda,
                        data,
                        borderColor: '#ff5722',
                        backgroundColor: 'rgba(255,87,34,0.1)',
                        borderWidth: 2.5,
                        pointBackgroundColor: '#ff5722',
                        pointRadius: 5,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top' },
                        tooltip: { callbacks: { label: (c) => `Cantidad: ${c.parsed.y} Un` } }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { display: true, color: '#f0f0f0' },
                            ticks: { callback: (v) => `${v} Un`, font: { size: 11 }, color: '#666' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 11 }, color: '#666' }
                        }
                    },
                    layout: { padding: 10 }
                }
            };
        } else if (!this.modoEvolucion && this.datosReporte.length > 0) {
            // Gráfico de barras (por tipo de prenda)
            const labels = this.datosReporte.map(d => d.nombrePrenda);
            const data = this.datosReporte.map(d => d.cantidadProducida);
            const colors = labels.map((_, i) => i % 2 === 0 ? '#ff8c42' : '#2c3e50');

            config = {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Cantidad Producida',
                        data,
                        backgroundColor: colors,
                        borderRadius: 4,
                        barPercentage: 0.5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: (c) => `Cantidad: ${c.parsed.y} Un` } }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { display: false },
                            ticks: { callback: (v) => `${v} Un`, font: { size: 11, weight: 'bold' }, color: '#2c3e50' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 11, weight: 'bold' }, color: '#2c3e50' }
                        }
                    },
                    layout: { padding: 10 }
                }
            };
        } else {
            return; // Sin datos
        }

        this.chart = new Chart(ctx, config);
    }

    get sinDatos(): boolean {
        return !this.loading && !this.error &&
            this.datosReporte.length === 0 && this.datosEvolucion.length === 0;
    }

    ngOnDestroy(): void {
        if (this.chart) this.chart.destroy();
    }
}
