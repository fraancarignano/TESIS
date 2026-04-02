import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DespachoService } from '../../services/despacho.service';

@Component({
  selector: 'app-despacho-qr-visor',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './despacho-qr-visor.component.html',
  styleUrls: ['./despacho-qr-visor.component.css']
})
export class DespachoQrVisorComponent implements OnInit {
  codigoRecibido: string | null = null;
  datos: any = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private despachoService: DespachoService
  ) {}

  ngOnInit(): void {
    this.codigoRecibido = this.route.snapshot.paramMap.get('codigo');
    if (this.codigoRecibido) {
      this.cargarDatos(this.codigoRecibido);
    } else {
      this.error = 'Código de despacho no proporcionado.';
      this.loading = false;
    }
  }

  cargarDatos(codigo: string): void {
    this.despachoService.obtenerPorCodigoQR(codigo).subscribe({
      next: (res) => {
        this.datos = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'No se encontró información para este despacho o código inválido.';
        this.loading = false;
      }
    });
  }
}
