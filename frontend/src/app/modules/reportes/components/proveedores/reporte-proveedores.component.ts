import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import DataLabelsPlugin from 'chartjs-plugin-datalabels';
import { ProveedoresService } from '../../../proveedores/services/proveedores.service';
import { ReportesService, ReporteTiemposEntrega, ReportePrecisionPedidos } from '../../services/reportes.service';

@Component({
    selector: 'app-reporte-proveedores',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, BaseChartDirective],
    providers: [DatePipe],
    templateUrl: './reporte-proveedores.component.html',
    styleUrls: ['./reporte-proveedores.component.scss']
})
export class ReporteProveedoresComponent implements OnInit {
    filtroForm!: FormGroup;
    proveedores: any[] = [];
    reporteTiempos: ReporteTiemposEntrega | null = null;
    reportePrecision: ReportePrecisionPedidos | null = null;
    cargando = false;
    error = '';

    // Configuración de Gráfico Tiempos
    public chartTiemposPlugins = [DataLabelsPlugin];
    public chartTiemposData: ChartData<'doughnut'> = {
        labels: ['A tiempo', 'Anticipado', 'Con retraso'],
        datasets: [{
            data: [0, 0, 0],
            backgroundColor: ['#28a745', '#17a2b8', '#dc3545'],
            hoverBackgroundColor: ['#218838', '#138496', '#c82333']
        }]
    };
    public chartTiemposOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' },
            datalabels: {
                color: '#fff',
                formatter: (value: any, ctx: any) => {
                    let sum = 0;
                    let dataArr = ctx.chart.data.datasets[0].data;
                    dataArr.map((data: any) => {
                        sum += (data as number);
                    });
                    if (sum === 0) return '';
                    let percentage = (value * 100 / sum).toFixed(1) + "%";
                    return value > 0 ? percentage : '';
                }
            }
        }
    };

    // Configuración Gráfico Precisión
    public chartPrecisionData: ChartData<'bar'> = {
        labels: [],
        datasets: [
            { data: [], label: 'Pedida', backgroundColor: '#007bff' },
            { data: [], label: 'Recibida', backgroundColor: '#28a745' }
        ]
    };
    public chartPrecisionOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true }
        },
        plugins: {
            legend: { position: 'top' },
            datalabels: {
                anchor: 'end',
                align: 'end',
                font: { size: 10 },
                formatter: (val: any) => val > 0 ? val : ''
            }
        }
    };


    constructor(
        private fb: FormBuilder,
        private proveedoresService: ProveedoresService,
        private reportesService: ReportesService
    ) { }

    ngOnInit(): void {
        this.filtroForm = this.fb.group({
            fechaInicio: [''],
            fechaFin: [''],
            idProveedor: ['']
        });

        this.cargarProveedores();
    }

    cargarProveedores() {
        this.proveedoresService.obtenerProveedores().subscribe({
            next: (data) => {
                this.proveedores = data;
            },
            error: (e) => console.error('Error cargando proveedores', e)
        });
    }

    generarReporte() {
        this.cargando = true;
        this.error = '';

        const filtros = this.filtroForm.value;

        // Obtener Tiempos de Entrega
        this.reportesService.obtenerReporteTiemposEntrega(
            filtros.fechaInicio, filtros.fechaFin, filtros.idProveedor
        ).subscribe({
            next: (data) => {
                this.reporteTiempos = data;
                this.actualizarGraficoTiempos(data);
                this.cargando = false;
            },
            error: (e) => {
                this.error = 'Error obteniendo reporte de tiempos';
                this.cargando = false;
            }
        });

        // Obtener Precisión de Pedidos
        this.reportesService.obtenerReportePrecisionPedidos(
            filtros.fechaInicio, filtros.fechaFin, filtros.idProveedor
        ).subscribe({
            next: (data) => {
                this.reportePrecision = data;
                this.actualizarGraficoPrecision(data);
            },
            error: (e) => {
                this.error = 'Error obteniendo reporte de precisión';
            }
        });
    }

    limpiarFiltros() {
        this.filtroForm.reset();
    }

    private actualizarGraficoTiempos(data: ReporteTiemposEntrega) {
        this.chartTiemposData.datasets[0].data = [
            data.ordenesATiempo,
            data.ordenesAnticipadas,
            data.ordenesConRetraso
        ];

        // Forzar redibujado
        this.chartTiemposData = { ...this.chartTiemposData };
    }

    private actualizarGraficoPrecision(data: ReportePrecisionPedidos) {
        const labels = data.resumenPorProveedor.map(p => p.nombreProveedor);
        const cantPedida = data.resumenPorProveedor.map(p => p.cantidadPedida);
        const cantRecibida = data.resumenPorProveedor.map(p => p.cantidadRecibida);

        this.chartPrecisionData.labels = labels;
        this.chartPrecisionData.datasets[0].data = cantPedida;
        this.chartPrecisionData.datasets[1].data = cantRecibida;

        this.chartPrecisionData = { ...this.chartPrecisionData };
    }
}

