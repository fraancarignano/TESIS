import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Proyecto, ObservacionProyecto, MaterialProyecto } from '../../proyectos/models/proyecto.model';
import { ProyectosService } from '../../proyectos/services/proyecto.service';

interface CortePlanData {
  telaAsignada: string;
  articuloTela: string;
}

interface CorteRealData {
  corteNumero: string;
  fechaCorte: string;
  partidaTela: string;
  telaUsadaKg: number;
  pesoRealKg: number;
  pesoTizaKg: number;
  capas: number;
  restoKg: number;
  fallaKg: number;
  utilizableKg: number;
  prendasCortadas: number;
  responsable: string;
  consumoTeoricoKg: number | null;
  referenciaExterna: string;
}

interface ScrapRegistro {
  idProyecto: number;
  codigoProyecto: string;
  nombreProyecto: string;
  cliente: string;
  fechaCorte: string;
  material: string;
  partida: string;
  telaUsadaKg: number;
  scrapKg: number;
  utilizableKg: number;
  scrapPorcentaje: number;
  prendasCortadas: number;
  kgPorPrenda: number | null;
  consumoTeoricoKg: number | null;
  desvioConsumoKg: number | null;
  desvioConsumoPorcentaje: number | null;
  referenciaExterna: string;
}

interface ScrapAgrupadoMaterial {
  material: string;
  cortes: number;
  proyectos: number;
  telaUsadaKg: number;
  scrapKg: number;
  utilizableKg: number;
  scrapPorcentaje: number;
  desvioConsumoKg: number;
}

@Component({
  selector: 'app-reporte-scrap-material',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-scrap-material.component.html',
  styleUrls: ['./reporte-scrap-material.component.css']
})
export class ReporteScrapMaterialComponent implements OnInit {
  loading = false;
  error = false;
  mensajeError = '';

  filtros = {
    fechaDesde: '',
    fechaHasta: '',
    cliente: '',
    material: ''
  };

  clientes: string[] = [];
  materiales: string[] = [];

  registros: ScrapRegistro[] = [];
  registrosFiltrados: ScrapRegistro[] = [];
  resumenPorMaterial: ScrapAgrupadoMaterial[] = [];

  ngOnInit(): void {
    this.cargarDatos();
  }

  constructor(private proyectosService: ProyectosService) {}

  get totalTelaUsadaKg(): number {
    return this.redondear(this.registrosFiltrados.reduce((acc, r) => acc + r.telaUsadaKg, 0));
  }

  get totalScrapKg(): number {
    return this.redondear(this.registrosFiltrados.reduce((acc, r) => acc + r.scrapKg, 0));
  }

  get totalUtilizableKg(): number {
    return this.redondear(this.registrosFiltrados.reduce((acc, r) => acc + r.utilizableKg, 0));
  }

  get scrapPorcentajeGeneral(): number {
    const totalTela = this.totalTelaUsadaKg;
    if (totalTela <= 0) return 0;
    return this.redondear((this.totalScrapKg / totalTela) * 100);
  }

  get totalCortes(): number {
    return this.registrosFiltrados.length;
  }

  get promedioKgPorPrenda(): number {
    const validos = this.registrosFiltrados.filter(r => r.kgPorPrenda !== null);
    if (!validos.length) return 0;
    const suma = validos.reduce((acc, r) => acc + (r.kgPorPrenda ?? 0), 0);
    return this.redondear(suma / validos.length, 3);
  }

  get promedioDesvioConsumoPorcentaje(): number {
    const validos = this.registrosFiltrados.filter(r => r.desvioConsumoPorcentaje !== null);
    if (!validos.length) return 0;
    const suma = validos.reduce((acc, r) => acc + (r.desvioConsumoPorcentaje ?? 0), 0);
    return this.redondear(suma / validos.length);
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = false;

    this.proyectosService.obtenerProyectosConCache().subscribe({
      next: (proyectos: Proyecto[]) => {
        const registros: ScrapRegistro[] = [];

        proyectos.forEach((proyecto: Proyecto) => {
          registros.push(...this.extraerRegistrosProyecto(proyecto));
        });

        this.registros = registros.sort((a, b) => b.fechaCorte.localeCompare(a.fechaCorte));
        this.cargarOpcionesFiltros(this.registros);
        this.aplicarFiltros();
        this.loading = false;
      },
      error: (err: { message?: string }) => {
        this.error = true;
        this.loading = false;
        this.mensajeError = err?.message || 'No se pudo cargar el reporte.';
      }
    });
  }

  aplicarFiltros(): void {
    const desde = this.filtros.fechaDesde || '';
    const hasta = this.filtros.fechaHasta || '';
    const cliente = this.filtros.cliente.trim().toLowerCase();
    const material = this.filtros.material.trim().toLowerCase();

    this.registrosFiltrados = this.registros.filter(r => {
      if (desde && r.fechaCorte < desde) return false;
      if (hasta && r.fechaCorte > hasta) return false;
      if (cliente && r.cliente.toLowerCase() !== cliente) return false;
      if (material && r.material.toLowerCase() !== material) return false;
      return true;
    });

    this.resumenPorMaterial = this.agruparPorMaterial(this.registrosFiltrados);
  }

  limpiarFiltros(): void {
    this.filtros = {
      fechaDesde: '',
      fechaHasta: '',
      cliente: '',
      material: ''
    };
    this.aplicarFiltros();
  }

  getClassScrap(porcentaje: number): string {
    if (porcentaje >= 10) return 'alto';
    if (porcentaje >= 5) return 'medio';
    return 'bajo';
  }

  private extraerRegistrosProyecto(proyecto: Proyecto): ScrapRegistro[] {
    const idProyecto = Number(proyecto.idProyecto ?? 0);
    if (!idProyecto) return [];

    const observaciones: ObservacionProyecto[] = proyecto.observaciones ?? [];
    const plan = this.extraerUltimoPlanCorte(observaciones.map((o: ObservacionProyecto) => o.descripcion ?? ''));
    const material = this.resolverMaterial(proyecto, plan);

    return observaciones
      .filter((o: ObservacionProyecto) => (o.descripcion ?? '').includes('[CORTE_REAL]'))
      .map((o: ObservacionProyecto) => {
        const data = this.extraerCorteRealDeObservacion(o.descripcion ?? '');
        if (!data) return null;

        const fecha = data.fechaCorte || this.obtenerFechaISO(o.fecha);
        const telaUsada = Math.max(0, data.telaUsadaKg);
        const scrapKg = Math.max(0, data.restoKg) + Math.max(0, data.fallaKg);
        const utilizableKg = Math.max(0, data.utilizableKg);
        const scrapPorcentaje = telaUsada > 0 ? (scrapKg / telaUsada) * 100 : 0;
        const kgPorPrenda = data.prendasCortadas > 0 && telaUsada > 0
          ? telaUsada / data.prendasCortadas
          : null;

        let desvioKg: number | null = null;
        let desvioPct: number | null = null;

        if (data.consumoTeoricoKg !== null && data.consumoTeoricoKg > 0) {
          desvioKg = telaUsada - data.consumoTeoricoKg;
          desvioPct = (desvioKg / data.consumoTeoricoKg) * 100;
        }

        return {
          idProyecto,
          codigoProyecto: (proyecto.codigoProyecto ?? '').trim() || `P-${idProyecto}`,
          nombreProyecto: (proyecto.nombreProyecto ?? '').trim() || `Proyecto ${idProyecto}`,
          cliente: (proyecto.clienteNombre ?? '').trim() || 'Sin cliente',
          fechaCorte: fecha,
          material,
          partida: data.partidaTela,
          telaUsadaKg: this.redondear(telaUsada),
          scrapKg: this.redondear(scrapKg),
          utilizableKg: this.redondear(utilizableKg),
          scrapPorcentaje: this.redondear(scrapPorcentaje),
          prendasCortadas: Math.max(0, data.prendasCortadas),
          kgPorPrenda: kgPorPrenda !== null ? this.redondear(kgPorPrenda, 3) : null,
          consumoTeoricoKg: data.consumoTeoricoKg !== null ? this.redondear(data.consumoTeoricoKg) : null,
          desvioConsumoKg: desvioKg !== null ? this.redondear(desvioKg) : null,
          desvioConsumoPorcentaje: desvioPct !== null ? this.redondear(desvioPct) : null,
          referenciaExterna: data.referenciaExterna
        } as ScrapRegistro;
      })
      .filter((x: ScrapRegistro | null): x is ScrapRegistro => x !== null);
  }

  private cargarOpcionesFiltros(registros: ScrapRegistro[]): void {
    this.clientes = [...new Set(registros.map(r => r.cliente).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    this.materiales = [...new Set(registros.map(r => r.material).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }

  private agruparPorMaterial(registros: ScrapRegistro[]): ScrapAgrupadoMaterial[] {
    const map = new Map<string, ScrapAgrupadoMaterial>();

    registros.forEach(r => {
      const key = r.material || 'Sin material';
      const actual = map.get(key) ?? {
        material: key,
        cortes: 0,
        proyectos: 0,
        telaUsadaKg: 0,
        scrapKg: 0,
        utilizableKg: 0,
        scrapPorcentaje: 0,
        desvioConsumoKg: 0
      };

      actual.cortes += 1;
      actual.telaUsadaKg += r.telaUsadaKg;
      actual.scrapKg += r.scrapKg;
      actual.utilizableKg += r.utilizableKg;
      if (r.desvioConsumoKg !== null) {
        actual.desvioConsumoKg += r.desvioConsumoKg;
      }
      map.set(key, actual);
    });

    const proyectosPorMaterial = new Map<string, Set<number>>();
    registros.forEach(r => {
      const key = r.material || 'Sin material';
      if (!proyectosPorMaterial.has(key)) {
        proyectosPorMaterial.set(key, new Set<number>());
      }
      proyectosPorMaterial.get(key)!.add(r.idProyecto);
    });

    return Array.from(map.values())
      .map(item => {
        const proyectos = proyectosPorMaterial.get(item.material)?.size ?? 0;
        const scrapPct = item.telaUsadaKg > 0 ? (item.scrapKg / item.telaUsadaKg) * 100 : 0;

        return {
          ...item,
          proyectos,
          telaUsadaKg: this.redondear(item.telaUsadaKg),
          scrapKg: this.redondear(item.scrapKg),
          utilizableKg: this.redondear(item.utilizableKg),
          desvioConsumoKg: this.redondear(item.desvioConsumoKg),
          scrapPorcentaje: this.redondear(scrapPct)
        };
      })
      .sort((a, b) => b.scrapKg - a.scrapKg);
  }

  private resolverMaterial(proyecto: Proyecto, plan: CortePlanData | null): string {
    if (plan?.articuloTela) return plan.articuloTela;
    if (plan?.telaAsignada) return plan.telaAsignada;

    const telas = (proyecto.materiales ?? [])
      .filter((m: MaterialProyecto) => (m.nombreInsumo ?? '').toLowerCase().includes('tela'))
      .map((m: MaterialProyecto) => (m.nombreInsumo ?? '').trim())
      .filter(Boolean);

    if (telas.length > 0) return telas[0];
    return 'Sin material';
  }

  private extraerUltimoPlanCorte(textos: string[]): CortePlanData | null {
    const planText = textos.find(t => (t ?? '').includes('[CORTE_PLAN]'));
    if (!planText) return null;

    const map = this.extraerMapaTokens(planText);
    return {
      telaAsignada: this.decodificarToken(map.get('tel') ?? ''),
      articuloTela: this.decodificarToken(map.get('atl') ?? '')
    };
  }

  private extraerCorteRealDeObservacion(texto: string): CorteRealData | null {
    if (!texto.includes('[CORTE_REAL]')) return null;

    const map = this.extraerMapaTokens(texto);

    return {
      corteNumero: this.decodificarToken(map.get('cn') ?? ''),
      fechaCorte: (map.get('fc') ?? '-') === '-' ? '' : (map.get('fc') ?? ''),
      partidaTela: this.decodificarToken(map.get('pt') ?? ''),
      telaUsadaKg: Number(map.get('tu') ?? 0) || 0,
      pesoRealKg: Number(map.get('pr') ?? 0) || 0,
      pesoTizaKg: Number(map.get('pz') ?? 0) || 0,
      capas: Number(map.get('ca') ?? 0) || 0,
      restoKg: Number(map.get('re') ?? 0) || 0,
      fallaKg: Number(map.get('fa') ?? 0) || 0,
      utilizableKg: Number(map.get('ut') ?? 0) || 0,
      prendasCortadas: Number(map.get('pc') ?? 0) || 0,
      responsable: this.decodificarToken(map.get('rs') ?? ''),
      consumoTeoricoKg: (map.get('ct') ?? '-') === '-' ? null : Number(map.get('ct') ?? 0),
      referenciaExterna: this.decodificarToken(map.get('rf') ?? '')
    };
  }

  private extraerMapaTokens(texto: string): Map<string, string> {
    const tokens = texto.split(' ').slice(1);
    const map = new Map<string, string>();

    tokens.forEach(token => {
      const idx = token.indexOf('=');
      if (idx <= 0) return;
      map.set(token.substring(0, idx), token.substring(idx + 1));
    });

    return map;
  }

  private decodificarToken(value: string): string {
    if (!value || value === '-') return '';
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  private obtenerFechaISO(fecha: string): string {
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return '';

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    const date = new Date(`${fecha}T00:00:00`);
    if (Number.isNaN(date.getTime())) return fecha;
    return date.toLocaleDateString('es-AR');
  }

  private redondear(value: number, precision = 2): number {
    const factor = Math.pow(10, precision);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}
