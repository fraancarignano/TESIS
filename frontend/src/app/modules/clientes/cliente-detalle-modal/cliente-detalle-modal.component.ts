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
          <!-- Información Personal -->
          <div class="seccion">
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
                <div class="valor">{{ cliente.nombre }}</div>
              </div>
              <div class="campo">
                <label>Apellido</label>
                <div class="valor">{{ cliente.apellido }}</div>
              </div>
              <div class="campo">
                <label>Teléfono</label>
                <div class="valor">{{ cliente.telefono }}</div>
              </div>
              <div class="campo">
                <label>Email Corporativo</label>
                <div class="valor">{{ cliente.email }}</div>
              </div>
            </div>
          </div>

          <!-- Información Corporativa -->
          <div class="seccion">
            <div class="seccion-titulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              <span>Información Corporativa</span>
            </div>
            <div class="campos-grid">
              <div class="campo">
                <label>Empresa</label>
                <div class="valor">{{ cliente.empresa }}</div>
              </div>
              <div class="campo">
                <label>Razón Social</label>
                <div class="valor">{{ cliente.razonSocial || '-' }}</div>
              </div>
              <div class="campo">
                <label>CUIT</label>
                <div class="valor">{{ cliente.cuit }}</div>
              </div>
              <div class="campo">
                <label>Tipo de Cliente</label>
                <div class="valor">
                  <span class="badge" [ngClass]="getTipoClienteClass()">
                    {{ cliente.tipoCliente }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Observaciones -->
          <div class="seccion" *ngIf="cliente.observaciones">
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
              {{ cliente.observaciones }}
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

    .badge.mayorista {
      background: #e3f2fd;
      color: #1976d2;
    }

    .badge.minorista {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .badge.corporativo {
      background: #fff3e0;
      color: #e65100;
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

  getTipoClienteClass(): string {
    const tipo = this.cliente.tipoCliente.toLowerCase();
    if (tipo.includes('mayorista')) return 'mayorista';
    if (tipo.includes('minorista')) return 'minorista';
    if (tipo.includes('corporativo')) return 'corporativo';
    return '';
  }
}