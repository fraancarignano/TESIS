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

interface TreemapBloque {
  nombre: string;
  cantidad: number;
  porcentaje: number;
  color: string;
  textColor: string;
  width: number;
  height: number;
  x: number;
  y: number;
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
  treemapProyectos: TreemapBloque[] = [];

  vistaActiva: 'graficos' | 'resumen' | 'detalle' = 'graficos';

  private chartTemporal?: Chart;
  private chartInsumo?: Chart;

  private readonly COLORES = [
    '#ff6b35', '#f4511e', '#ff9800', '#ffc107',
    '#4caf50', '#2196f3', '#9c27b0', '#e91e63',
    '#00bcd4', '#8bc34a'
  ];

  private readonly COLORES_TIDEPOOL = [
    '#2a78d6', '#1baf7a', '#eda100', '#4a3aa7',
    '#e34948', '#e87ba4', '#eb6834'
  ];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    if (this.dataCargada) this.renderizarGraficos();
  }

  ngOnDestroy(): void {
    this.chartTemporal?.destroy();
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
    this.calcularTreemapProyectos();
    this.renderizarPorInsumo();
  }

  private renderizarTemporal(): void {
    if (!this.chartTemporalRef?.nativeElement || !this.registros.length) return;
    this.chartTemporal?.destroy();

    // Agrupar registros por fecha y motivo
    const agrupado = new Map<string, { corte: number; otros: number }>();

    this.registros.forEach(reg => {
      const fecha = reg.fechaRegistro.split('T')[0]; // Obtener solo la fecha
      if (!agrupado.has(fecha)) {
        agrupado.set(fecha, { corte: 0, otros: 0 });
      }
      const grupo = agrupado.get(fecha)!;
      const cantidad = Number(reg.cantidadScrap);

      if (reg.motivo?.toLowerCase() === 'corte') {
        grupo.corte += cantidad;
      } else {
        grupo.otros += cantidad;
      }
    });

    // Ordenar por fecha
    const fechasOrdenadas = Array.from(agrupado.keys()).sort();

    const cfg: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: fechasOrdenadas.map(f => this.formatearFecha(f)),
        datasets: [
          {
            label: 'Corte',
            data: fechasOrdenadas.map(f => agrupado.get(f)!.corte),
            backgroundColor: '#2a78d6',
            borderRadius: 4,
            borderSkipped: false
          },
          {
            label: 'Desperfecto / operativo',
            data: fechasOrdenadas.map(f => agrupado.get(f)!.otros),
            backgroundColor: '#e34948',
            borderRadius: 4,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            stacked: true,
            ticks: { font: { size: 11 } },
            grid: { display: false }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: { font: { size: 11 } },
            grid: { color: '#e1e0d9', lineWidth: 1 }
          }
        }
      }
    };
    this.chartTemporal = new Chart(this.chartTemporalRef.nativeElement, cfg);
  }

  private calcularTreemapProyectos(): void {
    if (!this.resumenPorProyecto.length) {
      this.treemapProyectos = [];
      return;
    }

    // Tomar top 8 proyectos ordenados de mayor a menor
    const ordenados = [...this.resumenPorProyecto]
      .sort((a, b) => Number(b.cantidadScrapTotal) - Number(a.cantidadScrapTotal));

    const top8 = ordenados.slice(0, 8);
    const resto = ordenados.slice(8);

    // Calcular total
    const totalScrap = ordenados.reduce((sum, p) => sum + Number(p.cantidadScrapTotal), 0);

    // Preparar bloques (top 8 + otros si hay)
    const bloques: Array<{ nombre: string; cantidad: number; porcentaje: number }> = [];

    top8.forEach(p => {
      bloques.push({
        nombre: p.nombreProyecto,
        cantidad: Number(p.cantidadScrapTotal),
        porcentaje: (Number(p.cantidadScrapTotal) / totalScrap) * 100
      });
    });

    if (resto.length > 0) {
      const cantidadOtros = resto.reduce((sum, p) => sum + Number(p.cantidadScrapTotal), 0);
      bloques.push({
        nombre: 'Otros',
        cantidad: cantidadOtros,
        porcentaje: (cantidadOtros / totalScrap) * 100
      });
    }

    // Asignar colores secuenciales de azul (oscuro a claro según magnitud)
    const coloresAzules = ['#2a78d6', '#4d8fdd', '#70a6e4', '#85b7eb', '#a3c9f0', '#b5d4f4', '#cde4f9', '#e6f1fb'];

    this.treemapProyectos = bloques.map((b, idx) => {
      const color = coloresAzules[idx % coloresAzules.length];
      // Texto blanco para colores oscuros, azul oscuro para claros
      const textColor = idx < 3 ? '#ffffff' : '#0C447C';

      return {
        nombre: b.nombre,
        cantidad: b.cantidad,
        porcentaje: b.porcentaje,
        color,
        textColor,
        width: 0,
        height: 0,
        x: 0,
        y: 0
      };
    });

    // Calcular layout del treemap con algoritmo de división simple
    this.calcularLayoutTreemap();
  }

  private calcularLayoutTreemap(): void {
    const anchoTotal = 100; // porcentaje
    const altoTotal = 100;  // porcentaje
    const bloques = this.treemapProyectos;

    if (bloques.length === 0) return;

    // Algoritmo simple: distribuir en filas
    let x = 0;
    let y = 0;
    let altoFila = 0;
    const anchoDisponible = anchoTotal;

    bloques.forEach((bloque, idx) => {
      const area = bloque.porcentaje;

      // Calcular dimensiones proporcionales
      // Usar raíz cuadrada del área para dimensiones más balanceadas
      const escala = Math.sqrt(area / 100);
      let ancho = anchoTotal * escala * 1.4; // Factor de ajuste
      let alto = (area / ancho) * 100;

      // Limitar dimensiones mínimas y máximas
      ancho = Math.max(15, Math.min(ancho, anchoDisponible));
      alto = Math.max(12, Math.min(alto, altoTotal));

      // Si no cabe en la fila actual, pasar a la siguiente
      if (x + ancho > anchoTotal && x > 0) {
        x = 0;
        y += altoFila;
        altoFila = 0;
      }

      bloque.x = x;
      bloque.y = y;
      bloque.width = ancho;
      bloque.height = alto;

      x += ancho;
      altoFila = Math.max(altoFila, alto);
    });
  }

  private renderizarPorInsumo(): void {
    if (!this.chartInsumoRef?.nativeElement || !this.resumenPorInsumo.length) return;
    this.chartInsumo?.destroy();

    // Ordenar de mayor a menor cantidad
    const ordenados = [...this.resumenPorInsumo].sort((a, b) =>
      Number(b.cantidadScrapTotal) - Number(a.cantidadScrapTotal)
    );

    // Ajustar alto del canvas dinámicamente
    const alturaDinamica = Math.max(ordenados.length * 40 + 60, 60);
    this.chartInsumoRef.nativeElement.style.height = `${alturaDinamica}px`;

    const cfg: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ordenados.map(r => r.insumo),
        datasets: [{
          label: 'Scrap (u.)',
          data: ordenados.map(r => Number(r.cantidadScrapTotal)),
          backgroundColor: ordenados.map((_, i) =>
            this.COLORES_TIDEPOOL[i % this.COLORES_TIDEPOOL.length]
          ),
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { font: { size: 11 } },
            grid: { display: false }
          },
          y: {
            ticks: { font: { size: 11 } },
            grid: { color: '#e1e0d9', lineWidth: 1 }
          }
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
