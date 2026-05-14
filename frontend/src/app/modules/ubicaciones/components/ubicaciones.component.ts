import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UbicacionesService, Ubicacion } from '../services/ubicaciones.service';
import { UbicacionDetalleModalComponent } from './ubicacion-detalle-modal/ubicacion-detalle-modal.component';
import { ProyectoDetalleModalComponent } from '../../proyectos/components/proyecto-detalle-modal/proyecto-detalle-modal.component';
import { ProyectosService } from '../../proyectos/services/proyecto.service';
import { ProyectoVista, proyectoToVista } from '../../proyectos/models/proyecto.model';
import { map } from 'rxjs/operators';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

@Component({
    selector: 'app-ubicaciones',
    standalone: true,
    imports: [CommonModule, FormsModule, UbicacionDetalleModalComponent, ProyectoDetalleModalComponent, NgIf, NgFor, HasPermissionDirective],
    templateUrl: './ubicaciones.component.html',
    styleUrls: ['./ubicaciones.component.css']
})
export class UbicacionesComponent implements OnInit {
    ubicaciones: Ubicacion[] = [];
    mostrarFormulario = false;
    mostrarDetalle = false;
    ubicacionSeleccionada: Ubicacion | null = null;
    ubicacionDetalle: Ubicacion | null = null;

    // Tabs y Scrap
    tabActiva: 'listado' | 'scrap' = 'listado';
    inventarioScrap: any[] = [];
    cargandoScrap = false;

    // Data for the form
    nuevaUbicacion: Partial<Ubicacion> = {
        nombre: '',
        tipo: 'Rack',
        codigo: '',
        rack: 1,
        division: 1,
        espacio: 1,
        descripcion: ''
    };

    // Detalle Proyecto
    mostrarProyecto = false;
    proyectoSeleccionado: ProyectoVista | null = null;

    // Menú de configuración de estado
    menuEstadoAbierto: number | null = null;

    readonly ESTADOS = [
        { valor: 'Activa',  label: 'Activa',       descripcion: 'Sin restricciones', clase: 'estado-activa' },
        { valor: 'Ocupado', label: 'Ocupado',       descripcion: 'No admite más ingreso', clase: 'estado-ocupado' },
        { valor: 'BloqIN',  label: 'Bloqueo IN',   descripcion: 'Bloqueado para ingreso', clase: 'estado-blin' },
        { valor: 'BloqOUT', label: 'Bloqueo OUT',  descripcion: 'Bloqueado para egreso', clase: 'estado-blout' },
    ];

    constructor(
        private ubicacionesService: UbicacionesService,
        private proyectosService: ProyectosService
    ) { }

    ngOnInit(): void {
        this.cargarUbicaciones();
        this.cargarInventarioScrap();
    }

    @HostListener('document:click')
    cerrarMenusGlobal(): void {
        this.menuEstadoAbierto = null;
    }

    setTab(tab: 'listado' | 'scrap'): void {
        this.tabActiva = tab;
        if (tab === 'scrap') {
            this.cargarInventarioScrap();
        } else {
            this.cargarUbicaciones();
        }
    }

    cargarInventarioScrap(): void {
        this.cargandoScrap = true;
        this.ubicacionesService.getInventarioScrapGeneral().subscribe({
            next: (res) => {
                this.inventarioScrap = res || [];
                this.cargandoScrap = false;
            },
            error: (err) => {
                console.error('Error al cargar inventario scrap:', err);
                this.cargandoScrap = false;
            }
        });
    }

    cargarUbicaciones(): void {
        this.ubicacionesService.getUbicaciones().subscribe(
            (res: Ubicacion[]) => this.ubicaciones = res
        );
    }

    abrirNuevo(): void {
        this.ubicacionSeleccionada = null;
        this.nuevaUbicacion = {
            nombre: '',
            tipo: 'Rack',
            codigo: '',
            rack: 1,
            division: 1,
            espacio: 1,
            descripcion: ''
        };
        this.mostrarFormulario = true;
    }

    abrirEditar(ubicacion: Ubicacion): void {
        this.ubicacionSeleccionada = { ...ubicacion };
        this.nuevaUbicacion = { ...ubicacion };
        this.mostrarFormulario = true;
        this.menuEstadoAbierto = null;
    }

    cerrarFormulario(): void {
        this.mostrarFormulario = false;
        this.ubicacionSeleccionada = null;
    }

    abrirDetalle(ubicacion: Ubicacion): void {
        this.ubicacionDetalle = { ...ubicacion };
        this.mostrarDetalle = true;
    }

    cerrarDetalle(): void {
        this.mostrarDetalle = false;
        this.ubicacionDetalle = null;
    }

    guardar(): void {
        if (!this.nuevaUbicacion.nombre || !this.nuevaUbicacion.tipo || !this.nuevaUbicacion.codigo) {
            alert('Por favor complete los campos obligatorios (Nombre, Tipo, Código)');
            return;
        }

        if (this.nuevaUbicacion.tipo === 'Rack') {
            if (!this.nuevaUbicacion.rack || !this.nuevaUbicacion.division) {
                alert('Para tipo Rack, debe especificar Rack y División');
                return;
            }
        }

        if (this.ubicacionSeleccionada) {
            this.ubicacionesService.updateUbicacion(this.ubicacionSeleccionada.idUbicacion!, this.nuevaUbicacion).subscribe({
                next: () => {
                    this.cerrarFormulario();
                    this.cargarUbicaciones();
                },
                error: (err: any) => alert(err.error?.message || 'Error al actualizar')
            });
        } else {
            this.ubicacionesService.createUbicacion(this.nuevaUbicacion).subscribe({
                next: () => {
                    this.cerrarFormulario();
                    this.cargarUbicaciones();
                },
                error: (err: any) => alert(err.error?.message || 'Error al crear')
            });
        }
    }

    eliminar(id: number): void {
        if (confirm('¿Está seguro de eliminar esta ubicación?')) {
            this.ubicacionesService.deleteUbicacion(id).subscribe({
                next: () => this.cargarUbicaciones(),
                error: (err: any) => alert(err.error?.message || 'Error al eliminar. Verifique que no esté en uso.')
            });
        }
    }

    generarCodigo(): void {
        if (this.nuevaUbicacion.tipo !== 'Rack') return;
        
        const rackStr = this.nuevaUbicacion.rack?.toString().padStart(2, '0') || '01';
        const divStr = this.nuevaUbicacion.division?.toString().padStart(2, '0') || '01';
        const espStr = this.nuevaUbicacion.espacio?.toString().padStart(2, '0') || '01';
        this.nuevaUbicacion.codigo = `RCK-${divStr}-${espStr}`;
    }

    onTipoChange(): void {
        if (this.nuevaUbicacion.tipo === 'Scrap') {
            this.nuevaUbicacion.codigo = 'SCRP';
            this.nuevaUbicacion.nombre = 'Zona Scrap';
            this.nuevaUbicacion.rack = 0;
            this.nuevaUbicacion.division = 0;
            this.nuevaUbicacion.espacio = 0;
        } else if (this.nuevaUbicacion.tipo === 'Despacho') {
            this.nuevaUbicacion.codigo = 'DES-01';
            this.nuevaUbicacion.nombre = 'Zona Despacho';
            this.nuevaUbicacion.rack = 0;
            this.nuevaUbicacion.division = 0;
            this.nuevaUbicacion.espacio = 0;
        } else if (this.nuevaUbicacion.tipo === 'Rack') {
            this.generarCodigo();
        }
    }

    // ── GESTIÓN DE ESTADO ──────────────────────────────────────────

    toggleMenuEstado(event: Event, idUbicacion: number): void {
        event.stopPropagation();
        this.menuEstadoAbierto = this.menuEstadoAbierto === idUbicacion ? null : idUbicacion;
    }

    cambiarEstado(event: Event, ubicacion: Ubicacion, nuevoEstado: string): void {
        event.stopPropagation();
        this.menuEstadoAbierto = null;

        if (!ubicacion.idUbicacion) return;
        if (ubicacion.estadoUbicacion === nuevoEstado) return; // sin cambio

        this.ubicacionesService.cambiarEstadoUbicacion(ubicacion.idUbicacion, nuevoEstado).subscribe({
            next: (updated) => {
                const idx = this.ubicaciones.findIndex(u => u.idUbicacion === ubicacion.idUbicacion);
                if (idx !== -1) this.ubicaciones[idx] = updated;
            },
            error: (err: any) => alert(err.error?.message || 'Error al cambiar el estado')
        });
    }

    getEstadoInfo(estado?: string) {
        return this.ESTADOS.find(e => e.valor === estado) ?? this.ESTADOS[0];
    }

    // ── PROYECTOS ──────────────────────────────────────────────────

    abrirDetalleProyecto(idProyecto: number): void {
        this.proyectosService.obtenerProyectoPorId(idProyecto).pipe(
            map(p => proyectoToVista(p))
        ).subscribe({
            next: (proy: ProyectoVista) => {
                this.proyectoSeleccionado = proy;
                this.mostrarProyecto = true;
            },
            error: (err: any) => console.error('Error al cargar proyecto:', err)
        });
    }

    cerrarProyecto(): void {
        this.mostrarProyecto = false;
        this.proyectoSeleccionado = null;
    }
}
