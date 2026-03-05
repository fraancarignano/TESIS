import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertasService } from '../../../../core/services/alertas';
import { UsuariosService } from '../../services/usuarios.service';
import { GuardarPermisoItem, ModuloPermisos, PermisoItem } from '../../models/usuario.model';

interface ModuloConEstado extends ModuloPermisos {
    expandido: boolean;
    todosSeleccionados: boolean;
    algunoSeleccionado: boolean;
}

@Component({
    selector: 'app-permisos-usuario',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './permisos-usuario.component.html',
    styleUrls: ['./permisos-usuario.component.css']
})
export class PermisosUsuarioComponent implements OnChanges {
    @Input() idUsuario!: number;
    @Input() visible = false;
    @Output() cerrar = new EventEmitter<void>();

    modulos: ModuloConEstado[] = [];
    loading = false;
    guardando = false;
    error = false;
    cargado = false;

    constructor(
        private usuariosService: UsuariosService,
        private alertas: AlertasService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && this.visible && !this.cargado) {
            this.cargarPermisos();
        }
        if (changes['idUsuario']) {
            this.cargado = false;
            this.modulos = [];
            if (this.visible) this.cargarPermisos();
        }
    }

    cargarPermisos(): void {
        this.loading = true;
        this.error = false;

        this.usuariosService.obtenerPermisosPanel(this.idUsuario).subscribe({
            next: (response) => {
                this.modulos = response.modulos.map(m => ({
                    ...m,
                    expandido: true,
                    ...this.calcularEstadoModulo(m.permisos)
                }));
                this.loading = false;
                this.cargado = true;
            },
            error: () => {
                this.loading = false;
                this.error = true;
            }
        });
    }

    toggleModulo(modulo: ModuloConEstado): void {
        modulo.expandido = !modulo.expandido;
    }

    toggleTodosPermisos(modulo: ModuloConEstado): void {
        const nuevoEstado = !modulo.todosSeleccionados;
        modulo.permisos.forEach(p => (p.habilitado = nuevoEstado));
        this.actualizarEstadoModulo(modulo);
    }

    togglePermiso(modulo: ModuloConEstado, permiso: PermisoItem): void {
        permiso.habilitado = !permiso.habilitado;
        this.actualizarEstadoModulo(modulo);
    }

    private actualizarEstadoModulo(modulo: ModuloConEstado): void {
        const estado = this.calcularEstadoModulo(modulo.permisos);
        modulo.todosSeleccionados = estado.todosSeleccionados;
        modulo.algunoSeleccionado = estado.algunoSeleccionado;
    }

    private calcularEstadoModulo(permisos: PermisoItem[]): { todosSeleccionados: boolean; algunoSeleccionado: boolean } {
        const habilitados = permisos.filter(p => p.habilitado).length;
        return {
            todosSeleccionados: habilitados === permisos.length,
            algunoSeleccionado: habilitados > 0 && habilitados < permisos.length
        };
    }

    guardar(): void {
        this.guardando = true;

        const items: GuardarPermisoItem[] = this.modulos.flatMap(m =>
            m.permisos.map(p => ({ idPermiso: p.idPermiso, puedeAcceder: p.habilitado }))
        );

        this.usuariosService.guardarPermisos(this.idUsuario, items).subscribe({
            next: () => {
                this.guardando = false;
                this.alertas.success('Permisos guardados', 'Los permisos del usuario fueron actualizados.');
            },
            error: (err) => {
                this.guardando = false;
                this.alertas.error('Error', err?.error?.message || 'No se pudieron guardar los permisos.');
            }
        });
    }

    getCheckboxClass(modulo: ModuloConEstado): string {
        if (modulo.todosSeleccionados) return 'check-on';
        if (modulo.algunoSeleccionado) return 'check-partial';
        return 'check-off';
    }

    contarHabilitados(permisos: PermisoItem[]): number {
        return permisos.filter(p => p.habilitado).length;
    }

    getNombreModulo(key: string): string {
        const mapa: Record<string, string> = {
            Proyectos: 'Proyectos',
            Inventario: 'Inventario',
            Clientes: 'Clientes',
            Ubicaciones: 'Ubicaciones',
            Reportes: 'Reportes',
            Usuarios: 'Usuarios',
            OrdenesCompra: 'Órdenes de Compra',
        };
        return mapa[key] ?? key;
    }

    getNombreAccion(accion: string): string {
        const mapa: Record<string, string> = {
            Ver: 'Consultar / Ver',
            Crear: 'Crear',
            Editar: 'Editar',
            GestionInsumos: 'Gestión de insumos',
            Transferir: 'Transferir insumos',
            Historial: 'Historial de movimientos',
            Recepcionar: 'Control de recepción',
        };
        return mapa[accion] ?? accion;
    }
}
