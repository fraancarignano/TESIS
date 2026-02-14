import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReportesService, ProduccionPorPrenda } from '../services/reportes.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

@Component({
    selector: 'app-reporte-proyectos',
    standalone: true,
    imports: [CommonModule, HttpClientModule],
    templateUrl: './reporte-proyectos.component.html',
    styleUrls: ['./reporte-proyectos.component.css']
})
export class ReporteProyectosComponent implements OnInit, AfterViewInit, OnDestroy {
    // Estados del componente
    datosReporte: ProduccionPorPrenda[] = [];
    loading = false;
    error = false;
    mensajeError = '';

    // Referencias al canvas para el gráfico
    @ViewChild('chartProduccion') chartRef!: ElementRef<HTMLCanvasElement>;

    // Instancia del gráfico
    private chart?: Chart;

    constructor(
        private reportesService: ReportesService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarDatos();
    }

    ngAfterViewInit(): void {
        // Si ya tenemos datos, crear el gráfico ahora
        if (this.datosReporte.length > 0) {
            this.crearGrafico();
        }
    }

    cargarDatos(): void {
        this.loading = true;
        this.error = false;
        this.mensajeError = '';

        this.reportesService.obtenerProduccionPorTipoPrenda().subscribe({
            next: (datos) => {
                this.datosReporte = datos;
                this.loading = false;

                this.cdr.detectChanges();

                // Dar tiempo a que el DOM se actualice completamente
                setTimeout(() => {
                    this.crearGrafico();
                }, 0);
            },
            error: (err) => {
                console.error('❌ Error al cargar reporte:', err);
                this.error = true;
                this.mensajeError = err.message;
                this.loading = false;
            }
        });
    }

    crearGrafico(): void {
        if (this.datosReporte.length === 0 || !this.chartRef) return;

        if (this.chart) {
            this.chart.destroy();
        }

        const ctx = this.chartRef.nativeElement.getContext('2d');
        if (!ctx) return;

        const labels = this.datosReporte.map(d => d.nombrePrenda);
        const data = this.datosReporte.map(d => d.cantidadProducida);

        // Colores como en el prototipo (Alternando naranja y azul)
        const backgroundColors = labels.map((_, index) => index % 2 === 0 ? '#ff8c42' : '#2c3e50');

        const config: ChartConfiguration = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cantidad Producida',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderRadius: 4,
                    barPercentage: 0.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Ocultar leyenda si cada barra tiene su etiqueta en el eje X
                    },
                    title: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Cantidad: ${context.parsed.y} Unidades`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: false
                        },
                        ticks: {
                            callback: (value) => `${value} Un`,
                            font: {
                                size: 12,
                                weight: 'bold'
                            },
                            color: '#2c3e50'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 12,
                                weight: 'bold'
                            },
                            color: '#2c3e50'
                        }
                    }
                },
                layout: {
                    padding: 20
                }
            }
        };

        this.chart = new Chart(ctx, config);
    }

    ngOnDestroy(): void {
        if (this.chart) {
            this.chart.destroy();
        }
    }
}
