import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '../models/cliente.model';

@Component({
  selector: 'app-cliente-detalle-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="cerrar.emit()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="header-content">
            <div class="icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div>
              <h2>Detalle del Cliente</h2>
              <p>Información completa del cliente</p>
            </div>
          </div>
          <button class="btn-cerrar" (click)="cerrar.emit()">✕</button>
        </div>

        <div class="modal-body">
          <!-- Tipo de Cliente -->
          <div class="seccion">
            <div class="seccion-titulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Tipo de Cliente</span>
            </div>
            <div class="campos-grid">
              <div class="campo">
                <label>Tipo</label>
                <div class="valor">
                  <span class="badge" [ngClass]="getTipoClienteClass()">
                    {{ cliente?.tipoCliente }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Información Personal (si es Persona Física) -->
          <div class="seccion" *ngIf="esPersonaFisica()">
            <div class="seccion-titulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Información Personal</span>
            </div>
            <div class="campos-grid">
              <div class="campo">
                <label>Nombre</label>
                <div class="valor">{{ cliente?.nombre || '-' }}</div>
              </div>
              <div class="campo">
                <label>Apellido</label>
                <div class="valor">{{ cliente?.apellido || '-' }}</div>
              </div>
              <div class="campo">
                <label>Tipo de Documento</label>
                <div class="valor">{{ cliente?.tipoDocumento || '-' }}</div>
              </div>
              <div class="campo">
                <label>Número de Documento</label>
                <div class="valor">{{ cliente?.numeroDocumento || '-' }}</div>
              </div>
            </div>
          </div>

          <!-- Información Fiscal (si es Persona Jurídica) -->
          <div class="seccion" *ngIf="esPersonaJuridica()">
            <div class="seccion-titulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              <span>Información Fiscal</span>
            </div>
            <div class="campos-grid">
              <div class="campo">
                <label>Razón Social</label>
                <div class="valor">{{ cliente?.razonSocial || '-' }}</div>
              </div>
              <div class="campo">
                <label>CUIT / CUIL</label>
                <div class="valor">{{ cliente?.cuitCuil || '-' }}</div>
              </div>
            </div>
          </div>

          <!-- Información de Contacto -->
          <div class="seccion">
            <div class="seccion-titulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>Información de Contacto</span>
            </div>
            <div class="campos-grid">
              <div class="campo">
                <label>Teléfono</label>
                <div class="valor">{{ cliente?.telefono || '-' }}</div>
              </div>
              <div class="campo">
                <label>Email</label>
                <div class="valor">{{ cliente?.email || '-' }}</div>
              </div>
            </div>
          </div>

          <!-- Ubicación -->
          <div class="seccion" *ngIf="cliente?.direccion || cliente?.codigoPostal">
            <div class="seccion-titulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>Ubicación</span>
            </div>
            <div class="campos-grid">
              <div class="campo" *ngIf="cliente?.direccion">
                <label>Dirección</label>
                <div class="valor">{{ cliente?.direccion }}</div>
              </div>
              <div class="campo" *ngIf="cliente?.codigoPostal">
                <label>Código Postal</label>
                <div class="valor">{{ cliente?.codigoPostal }}</div>
              </div>
            </div>
          </div>

          <!-- Estado y Fecha -->
          <div class="seccion">
            <div class="seccion-titulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
              <span>Estado y Registro</span>
            </div>
            <div class="campos-grid">
              <div class="campo">
                <label>Estado</label>
                <div class="valor">
                  <span class="badge" [ngClass]="getEstadoClass()">
                    {{ getEstadoTexto() }}
                  </span>
                </div>
              </div>
              <div class="campo">
                <label>Fecha de Alta</label>
                <div class="valor">{{ formatearFecha(cliente?.fechaAlta) }}</div>
              </div>
            </div>
          </div>

          <!-- Observaciones -->
          <div class="seccion" *ngIf="cliente?.observaciones">
            <div class="seccion-titulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>Observaciones</span>
            </div>
            <div class="observaciones-texto">
              {{ cliente?.observaciones }}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secundario" (click)="cerrar.emit()">Cerrar</button>
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
      max-width: 800px;
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

    .seccion-titulo svg {
      flex-shrink: 0;
    }

    .campos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .campo label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .campo .valor {
      font-size: 15px;
      color: #333;
      padding: 10px 12px;
      background: #f8f8f8;
      border-radius: 6px;
      border: 1px solid #e8e8e8;
    }

    .badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
    }

    /* Tipos de cliente */
    .badge.tipo-fisica {
      background: #e3f2fd;
      color: #1565c0;
    }

    .badge.tipo-juridica {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    /* Estados */
    .badge.badge-activo {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .badge.badge-inactivo {
      background: #ffebee;
      color: #c62828;
    }

    .badge.badge-suspendido {
      background: #fff3e0;
      color: #ef6c00;
    }

    .observaciones-texto {
      padding: 14px;
      background: #f8f8f8;
      border-radius: 8px;
      border-left: 3px solid #ff5722;
      color: #555;
      font-size: 14px;
      line-height: 1.6;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #f0f0f0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn-secundario {
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

    .btn-secundario:hover {
      background: #e0e0e0;
      transform: translateY(-1px);
    }

    @media (max-width: 768px) {
      .modal-container {
        width: 95%;
        max-height: 95vh;
      }

      .modal-header {
        padding: 20px;
      }

      .modal-header h2 {
        font-size: 18px;
      }

      .campos-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .modal-body {
        padding: 20px;
      }
    }
  `]
})
export class ClienteDetalleModalComponent {
  @Input() cliente!: Cliente;
  @Output() cerrar = new EventEmitter<void>();

  /**
   * Verificar si es Persona Física
   */
  esPersonaFisica(): boolean {
    return this.cliente?.tipoCliente === 'Persona Física';
  }

  /**
   * Verificar si es Persona Jurídica
   */
  esPersonaJuridica(): boolean {
    return this.cliente?.tipoCliente === 'Persona Jurídica';
  }

  /**
   * Obtener clase CSS según tipo de cliente
   */
  getTipoClienteClass(): string {
    if (!this.cliente || !this.cliente.tipoCliente) {
      return '';
    }

    const tipos: { [key: string]: string } = {
      'Persona Física': 'tipo-fisica',
      'Persona Jurídica': 'tipo-juridica'
    };

    return tipos[this.cliente.tipoCliente] || '';
  }

  /**
   * Obtener clase CSS según estado
   */
  getEstadoClass(): string {
    const estados: { [key: number]: string } = {
      1: 'badge-activo',
      2: 'badge-inactivo',
      3: 'badge-suspendido'
    };
    return estados[this.cliente?.idEstadoCliente || 1] || '';
  }

  /**
   * Obtener texto del estado
   */
  getEstadoTexto(): string {
    const estados: { [key: number]: string } = {
      1: 'Activo',
      2: 'Inactivo',
      3: 'Suspendido'
    };
    return estados[this.cliente?.idEstadoCliente || 1] || 'Desconocido';
  }

  /**
   * Formatear fecha
   */
  formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}