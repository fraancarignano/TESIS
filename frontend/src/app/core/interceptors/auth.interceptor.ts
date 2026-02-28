import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Agregar token a peticiones privadas.
  const token = localStorage.getItem('token');
  const esRutaPublica = req.url.includes('/login') || req.url.includes('/registrar');

  if (token && !esRutaPublica) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !esRutaPublica) {
        console.error('Error 401: token invalido o expirado');
        localStorage.removeItem('token');
        localStorage.removeItem('token_expiration');
        localStorage.removeItem('usuario');
        sessionStorage.removeItem('permisos_efectivos');
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
