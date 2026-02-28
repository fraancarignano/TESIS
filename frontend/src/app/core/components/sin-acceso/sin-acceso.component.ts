import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sin-acceso',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="sin-acceso">
      <h1>Sin acceso</h1>
      <p>No tenés permisos para ingresar a esta sección.</p>
      <a routerLink="/proyectos">Volver</a>
    </section>
  `,
  styles: [`
    .sin-acceso {
      min-height: 60vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 10px;
      color: #2f2f2f;
    }
    h1 {
      margin: 0;
      font-size: 1.5rem;
      color: #ff5722;
    }
    p {
      margin: 0;
      color: #616161;
    }
    a {
      color: #1f3b6b;
      font-weight: 600;
      text-decoration: none;
    }
  `]
})
export class SinAccesoComponent {}

export default SinAccesoComponent;
