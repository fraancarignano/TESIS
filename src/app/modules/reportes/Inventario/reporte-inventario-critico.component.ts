import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReportesService, ResumenInventarioCritico, DashboardInventario } from '../services/reportes.service'
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-reporte-inventario-critico',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './reporte-inventario-critico.component.html',
  styleUrls: ['./reporte-inventario-critico.component.css']
})
export class ReporteInventarioCriticoComponent implements OnInit, AfterViewInit, OnDestroy {
  // Estados del componente
  datosReporte: ResumenInventarioCritico | null = null;
  loading = false;
  error = false;
  mensajeError = '';

  // Referencias al canvas para el gráfico
  @ViewChild('chartStockVsMinimo') chartStockVsMinimoRef!: ElementRef<HTMLCanvasElement>;

  // Instancia del gráfico
  private chartStockVsMinimo?: Chart;

  constructor(
    private reportesService: ReportesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    console.log('👁️ ngAfterViewInit ejecutado');
    console.log('   Canvas disponible?', !!this.chartStockVsMinimoRef);
    
    // Si ya tenemos datos, crear el gráfico ahora
    if (this.datosReporte) {
      console.log('   Datos ya disponibles, creando gráfico...');
      this.crearGraficoStockVsMinimo();
    }
  }

  /**
   * Cargar datos del reporte desde el backend
   */
  cargarDatos(): void {
    this.loading = true;
    this.error = false;
    this.mensajeError = '';

    this.reportesService.obtenerReporteInventarioCritico().subscribe({
      next: (datos) => {
        this.datosReporte = datos;
        this.loading = false;
        console.log('✅ Datos del reporte cargados:', datos);
        console.log('📦 Cantidad de insumos críticos:', datos.insumos?.length || 0);
        
        // Forzar detección de cambios para que Angular renderice el *ngIf
        this.cdr.detectChanges();
        
        // Dar tiempo a que el DOM se actualice completamente
        setTimeout(() => {
          console.log('🎨 Intentando crear gráfico después de detectChanges...');
          console.log('   Canvas ahora disponible?', !!this.chartStockVsMinimoRef);
          this.crearGraficoStockVsMinimo();
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

  /**
   * Crear gráfico de barras agrupadas: Stock Actual vs Stock Mínimo
   * Similar al prototipo mostrado
   */
  crearGraficoStockVsMinimo(): void {
    console.log('🎨 === INICIANDO CREACIÓN DE GRÁFICO ===');
    console.log('1. datosReporte existe?', !!this.datosReporte);
    console.log('2. chartStockVsMinimoRef existe?', !!this.chartStockVsMinimoRef);
    
    if (!this.datosReporte) {
      console.error('❌ No hay datosReporte');
      return;
    }
    
    if (!this.chartStockVsMinimoRef) {
      console.error('❌ No hay chartStockVsMinimoRef (ViewChild no encontrado)');
      console.log('Posible causa: el canvas no está en el DOM todavía');
      return;
    }

    console.log('3. Total insumos en datosReporte:', this.datosReporte.insumos.length);

    // Destruir gráfico anterior si existe
    if (this.chartStockVsMinimo) {
      console.log('🗑️ Destruyendo gráfico anterior');
      this.chartStockVsMinimo.destroy();
    }

    // MOSTRAR TODOS LOS INSUMOS (no limitar a 10)
    const insumosMostrar = this.datosReporte.insumos;
    console.log('4. Insumos a mostrar en gráfico:', insumosMostrar.length);

    if (insumosMostrar.length === 0) {
      console.warn('⚠️ No hay insumos para mostrar en el gráfico');
      console.log('Esto es normal si no hay insumos con stock bajo');
      return;
    }

    console.log('5. Obteniendo contexto del canvas...');
    const ctx = this.chartStockVsMinimoRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('❌ No se pudo obtener contexto 2D del canvas');
      return;
    }
    console.log('✅ Contexto 2D obtenido');

    // Preparar datos
    const labels = insumosMostrar.map(i => i.nombreInsumo);
    const stockActual = insumosMostrar.map(i => i.stockActual);
    const stockMinimo = insumosMostrar.map(i => i.stockMinimo);
    
    // Colores dinámicos según nivel de criticidad
    const coloresStock = insumosMostrar.map(i => {
      switch(i.nivelCriticidad) {
        case 'Agotado': return '#dc3545';   // Rojo
        case 'Crítico': return '#fd7e14';   // Naranja
        case 'Bajo': return '#ffc107';      // Amarillo
        case 'Alerta': return '#20c997';    // Verde agua
        case 'Normal': return '#28a745';    // Verde
        default: return '#36b9cc';          // Azul por defecto
      }
    });

    console.log('6. Datos preparados:');
    console.log('   Labels:', labels);
    console.log('   Stock Actual:', stockActual);
    console.log('   Stock Mínimo:', stockMinimo);
    console.log('   Colores:', coloresStock);

    console.log('7. Creando configuración del gráfico...');

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Stock',
            data: stockActual,
            backgroundColor: coloresStock, // ← Colores dinámicos según criticidad
            borderColor: coloresStock.map(c => c), // Mismo color para el borde
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Mínimo',
            data: stockMinimo,
            backgroundColor: '#e0e0e0', // Gris claro para referencia
            borderColor: '#bdbdbd',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: insumosMostrar.length > 5 ? 'y' : 'x', // Horizontal si hay muchos insumos
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 15,
              font: {
                size: 13,
                weight: 'normal'
              }
            }
          },
          title: {
            display: true,
            text: 'Nivel Stock vs Stock Mínimo',
            font: {
              size: 18,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y || context.parsed.x;
                const insumo = insumosMostrar[context.dataIndex];
                return `${label}: ${value} ${insumo.unidadMedida}`;
              },
              afterLabel: (context) => {
                const insumo = insumosMostrar[context.dataIndex];
                return `Criticidad: ${insumo.nivelCriticidad}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: insumosMostrar.length > 5 ? true : false
            },
            ticks: {
              font: {
                size: 11
              },
              maxRotation: insumosMostrar.length > 5 ? 0 : 45,
              minRotation: insumosMostrar.length > 5 ? 0 : 45
            },
            beginAtZero: true
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 12
              },
              precision: 0
            },
            title: {
              display: insumosMostrar.length <= 5,
              text: 'Cantidad',
              font: {
                size: 13,
                weight: 'bold'
              }
            }
          }
        },
        layout: {
          padding: {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10
          }
        }
      }
    };

    // Ajustar altura del canvas según cantidad de insumos
    const alturaBase = insumosMostrar.length > 5 ? insumosMostrar.length * 50 : 450;
    const alturaMaxima = 800;
    const alturaFinal = Math.min(alturaBase, alturaMaxima);
    
    this.chartStockVsMinimoRef.nativeElement.style.height = `${alturaFinal}px`;
    console.log(`📏 Altura del gráfico ajustada a: ${alturaFinal}px`);

    console.log('8. Creando instancia de Chart.js...');
    try {
      this.chartStockVsMinimo = new Chart(ctx, config);
      console.log('✅✅✅ GRÁFICO CREADO EXITOSAMENTE ✅✅✅');
      console.log('Dimensiones del canvas:', {
        width: this.chartStockVsMinimoRef.nativeElement.width,
        height: this.chartStockVsMinimoRef.nativeElement.height
      });
    } catch (error) {
      console.error('❌ Error al crear el gráfico:', error);
    }
  }

  /**
   * Limpiar recursos al destruir el componente
   */
  ngOnDestroy(): void {
    if (this.chartStockVsMinimo) {
      this.chartStockVsMinimo.destroy();
    }
  }

  /**
   * Obtener clase CSS según nivel de criticidad para el badge
   */
  getBadgeClass(nivelCriticidad: string): string {
    const clases: { [key: string]: string } = {
      'Agotado': 'badge badge-agotado',
      'Crítico': 'badge badge-critico',
      'Bajo': 'badge badge-bajo',
      'Alerta': 'badge badge-alerta',
      'Normal': 'badge badge-normal'
    };
    return clases[nivelCriticidad] || 'badge badge-default';
  }

  /**
   * Obtener clase CSS para la fila según nivel de criticidad
   */
  getFilaClass(nivelCriticidad: string): string {
    const clases: { [key: string]: string } = {
      'Agotado': 'fila-agotado',
      'Crítico': 'fila-critico',
      'Bajo': 'fila-bajo',
      'Alerta': 'fila-alerta',
      'Normal': 'fila-normal'
    };
    return clases[nivelCriticidad] || '';
  }

  /**
   * Verificar si algún insumo tiene días restantes
   */
  tieneDiasRestantes(): boolean {
    if (!this.datosReporte) return false;
    return this.datosReporte.insumos.some(i => 
      i.diasRestantes !== null && i.diasRestantes !== undefined
    );
  }
}

// Export default para lazy loading
export default ReporteInventarioCriticoComponent;