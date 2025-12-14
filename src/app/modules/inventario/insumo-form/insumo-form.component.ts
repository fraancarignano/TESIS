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
          <button class="btn-guardar" (click)="guardar()">
            {{ esEdicion ? 'Guardar cambios' : 'Crear insumo' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-container {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 900px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      background: linear-gradient(135deg, #ff5722 0%, #f4511e 100%);
      padding: 24px;
      border-radius: 12px 12px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .icon-wrapper {
      background: rgba(255, 255, 255, 0.2);
      padding: 12px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
    }

    .modal-header p {
      margin: 4px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }

    .btn-cerrar {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .btn-cerrar:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    .modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .seccion {
      margin-bottom: 28px;
    }

    .seccion:last-child {
      margin-bottom: 0;
    }

    .seccion-titulo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      color: #ff5722;
      font-weight: 600;
      font-size: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f5f5f5;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-size: 13px;
      font-weight: 600;
      color: #555;
      margin-bottom: 6px;
    }

    .requerido {
      color: #f44336;
    }

    .form-group input,
    .form-group select {
      padding: 10px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #ff5722;
      box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.1);
    }

    .form-group input::placeholder {
      color: #999;
    }

    .alerta-info {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      background: #fff3e0;
      border-left: 3px solid #ff9800;
      border-radius: 6px;
      color: #e65100;
      font-size: 13px;
      margin-top: 16px;
    }

    .alerta-info svg {
      flex-shrink: 0;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #f0f0f0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn-cancelar {
      background: #f5f5f5;
      color: #333;
      border: none;
      padding: 10px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .btn-cancelar:hover {
      background: #e0e0e0;
      transform: translateY(-1px);
    }

    .btn-guardar {
      background: #ff5722;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .btn-guardar:hover {
      background: #e64a19;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 87, 34, 0.3);
    }

    @media (max-width: 768px) {
      .modal-container {
        width: 95%;
        max-height: 95vh;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .modal-header {
        padding: 20px;
      }

      .modal-header h2 {
        font-size: 18px;
      }

      .modal-body {
        padding: 20px;
      }
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

  constructor(private insumosService: InsumosService) {}

  ngOnInit(): void {
    this.tiposInsumo = this.insumosService.getTiposInsumo();
    this.proveedores = this.insumosService.getProveedores();

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

    if (this.esEdicion) {
      this.insumosService.actualizarInsumo(this.formulario);
    } else {
      this.insumosService.agregarInsumo(this.formulario);
    }

    this.cerrar.emit();
  }
}