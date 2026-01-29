import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Insumo, TipoInsumo, Proveedor } from '../models/insumo.model';
import { InsumosService } from '../services/insumos.service';

@Component({
  selector: 'app-insumo-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="cerrar.emit()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="header-content">
            <div class="icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
            </div>
            <div>
              <h2>{{ esEdicion ? 'Editar Insumo' : 'Nuevo Insumo' }}</h2>
              <p>{{ esEdicion ? 'Modifica los datos del insumo' : 'Ingresa los datos del nuevo insumo' }}</p>
            </div>
          </div>
          <button class="btn-cerrar" (click)="cerrar.emit()">✕</button>
        </div>

        <div class="modal-body">
          <!-- Información General -->
          <div class="seccion">
            <div class="seccion-titulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              <span>Información General</span>
            </div>
            
            <div class="form-grid">
              <div class="form-group">
                <label>Nombre del Insumo <span class="requerido">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="formulario.nombreInsumo"
                  placeholder="Ingrese el nombre"
                  required
                >
              </div>

              <div class="form-group">
                <label>Tipo de Insumo <span class="requerido">*</span></label>
                <select [(ngModel)]="formulario.idTipoInsumo" required>
                  <option [value]="0">Seleccione un tipo</option>
                  <option *ngFor="let tipo of tiposInsumo" [value]="tipo.idTipoInsumo">
                    {{ tipo.nombreTipo }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Unidad de Medida <span class="requerido">*</span></label>
                <select [(ngModel)]="formulario.unidadMedida" required>
                  <option value="">Seleccione una unidad</option>
                  <option value="Kg">Kilogramos (Kg)</option>
                  <option value="Mts">Metros (Mts)</option>
                  <option value="Un">Unidades (Un)</option>
                  <option value="Lts">Litros (Lts)</option>
                  <option value="M2">Metros cuadrados (M2)</option>
                </select>
              </div>

              <div class="form-group">
                <label>Estado <span class="requerido">*</span></label>
                <select [(ngModel)]="formulario.estado" required>
                  <option value="">Seleccione un estado</option>
                  <option value="Disponible">Disponible</option>
                  <option value="En uso">En uso</option>
                  <option value="A designar">A designar</option>
                  <option value="Agotado">Agotado</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Stock e Inventario -->
          <div class="seccion">
            <div class="seccion-titulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              <span>Stock e Inventario</span>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Stock Actual <span class="requerido">*</span></label>
                <input
                  type="number"
                  [(ngModel)]="formulario.stockActual"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                >
              </div>

              <div class="form-group">
                <label>Stock Mínimo</label>
                <input
                  type="number"
                  [(ngModel)]="formulario.stockMinimo"
                  placeholder="0"
                  min="0"
                  step="0.01"
                >
              </div>
            </div>

            <div class="alerta-info" *ngIf="stockBajo()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>El stock actual está por debajo del stock mínimo</span>
            </div>
          </div>

          <!-- Información del Proveedor -->
          <div class="seccion">
            <div class="seccion-titulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Información del Proveedor</span>
            </div>

            <div class="form-grid">
              <div class="form-group full-width">
                <label>Proveedor</label>
                <select [(ngModel)]="formulario.idProveedor">
                  <option [value]="undefined">Sin proveedor asignado</option>
                  <option *ngFor="let proveedor of proveedores" [value]="proveedor.idProveedor">
                    {{ proveedor.nombreProveedor }} {{ proveedor.cuit ? '(' + proveedor.cuit + ')' : '' }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancelar" (click)="cerrar.emit()">Cancelar</button>
          <button class="btn-guardar" (click)="guardar()" [disabled]="guardando">
            {{ guardando ? 'Guardando...' : (esEdicion ? 'Guardar cambios' : 'Crear insumo') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ... (mantén todos los estilos que ya tienes) ... */
    .btn-guardar:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class InsumoFormComponent implements OnInit {
  @Input() insumo: Insumo | null = null;
  @Output() cerrar = new EventEmitter<void>();

  formulario: Insumo = {
    nombreInsumo: '',
    idTipoInsumo: 0,
    unidadMedida: '',
    stockActual: 0,
    stockMinimo: 0,
    fechaActualizacion: new Date().toISOString().split('T')[0],
    estado: 'Disponible'
  };

  tiposInsumo: TipoInsumo[] = [];
  proveedores: Proveedor[] = [];
  esEdicion = false;
  guardando = false;

  constructor(private insumosService: InsumosService) {}

  ngOnInit(): void {
    // Cargar tipos de insumo y proveedores
    this.insumosService.getTiposInsumo().subscribe({
      next: (tipos) => this.tiposInsumo = tipos,
      error: (error) => console.error('Error al cargar tipos:', error)
    });

    this.insumosService.getProveedores().subscribe({
      next: (proveedores) => this.proveedores = proveedores,
      error: (error) => console.error('Error al cargar proveedores:', error)
    });

    if (this.insumo) {
      this.esEdicion = true;
      this.formulario = { ...this.insumo };
    }
  }

  stockBajo(): boolean {
    if (!this.formulario.stockMinimo) return false;
    return this.formulario.stockActual < this.formulario.stockMinimo;
  }

  guardar(): void {
    // Validaciones
    if (!this.formulario.nombreInsumo.trim()) {
      alert('El nombre del insumo es requerido');
      return;
    }

    if (this.formulario.idTipoInsumo === 0) {
      alert('Debe seleccionar un tipo de insumo');
      return;
    }

    if (!this.formulario.unidadMedida) {
      alert('Debe seleccionar una unidad de medida');
      return;
    }

    if (this.formulario.stockActual < 0) {
      alert('El stock actual no puede ser negativo');
      return;
    }

    this.guardando = true;

    const operacion = this.esEdicion
      ? this.insumosService.actualizarInsumo(this.formulario)
      : this.insumosService.agregarInsumo(this.formulario);

    operacion.subscribe({
      next: () => {
        alert(this.esEdicion ? 'Insumo actualizado correctamente' : 'Insumo creado correctamente');
        this.cerrar.emit();
      },
      error: (error) => {
        console.error('Error al guardar:', error);
        alert('Error al guardar el insumo. Verifique que no exista un insumo con el mismo nombre.');
        this.guardando = false;
      }
    });
  }
}