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
      timerProgressBar: true,
      customClass: {
        container: 'swal-high-zindex'
      }
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
      confirmButtonColor: '#ff5722',
      customClass: {
        container: 'swal-high-zindex'
      }
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
  async confirmar(titulo: string, mensaje?: string, textoBoton: string = 'S�, confirmar'): Promise<boolean> {
    const result = await Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ff5722',
      cancelButtonColor: '#666',
      confirmButtonText: textoBoton,
      cancelButtonText: 'Cancelar',
      customClass: {
        container: 'swal-high-zindex'
      }
    });

    return result.isConfirmed;
  }

  async pedirTexto(titulo: string, placeholder: string, textoBoton: string = 'Confirmar'): Promise<string | null> {
    const result = await Swal.fire({
      title: titulo,
      input: 'textarea',
      inputPlaceholder: placeholder,
      inputAttributes: {
        'aria-label': placeholder
      },
      showCancelButton: true,
      confirmButtonColor: '#ff5722',
      cancelButtonColor: '#666',
      confirmButtonText: textoBoton,
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'El motivo es obligatorio';
        }
        return null;
      },
      customClass: {
        container: 'swal-high-zindex'
      }
    });

    if (!result.isConfirmed) return null;
    return (result.value || '').trim();
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
