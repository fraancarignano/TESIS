import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertasService {

  constructor() { }

  /**
   * Alerta de éxito
   */
  success(titulo: string, mensaje?: string) {
    return Swal.fire({
      icon: 'success',
      title: titulo,
      text: mensaje,
      confirmButtonColor: '#ff5722',
      timer: 2500,
      timerProgressBar: true
    });
  }

  /**
   * Alerta de error
   */
  error(titulo: string, mensaje?: string) {
    return Swal.fire({
      icon: 'error',
      title: titulo,
      text: mensaje,
      confirmButtonColor: '#ff5722'
    });
  }

  /**
   * Alerta de advertencia
   */
  warning(titulo: string, mensaje?: string) {
    return Swal.fire({
      icon: 'warning',
      title: titulo,
      text: mensaje,
      confirmButtonColor: '#ff5722'
    });
  }

  /**
   * Alerta de información
   */
  info(titulo: string, mensaje?: string) {
    return Swal.fire({
      icon: 'info',
      title: titulo,
      text: mensaje,
      confirmButtonColor: '#ff5722'
    });
  }

  /**
   * Confirmación con pregunta (Sí/No)
   */
  async confirmar(titulo: string, mensaje?: string, textoBoton: string = 'Sí, confirmar'): Promise<boolean> {
    const result = await Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ff5722',
      cancelButtonColor: '#666',
      confirmButtonText: textoBoton,
      cancelButtonText: 'Cancelar'
    });
    
    return result.isConfirmed;
  }

  /**
   * Toast (notificación pequeña en la esquina)
   */
  toast(mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info' = 'success') {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    Toast.fire({
      icon: tipo,
      title: mensaje
    });
  }
}