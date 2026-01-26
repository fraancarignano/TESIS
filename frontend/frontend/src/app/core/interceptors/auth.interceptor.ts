// core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../modules/login/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Agregar el token a las peticiones (excepto login/registro)
  const token = authService.obtenerToken();
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
      // Si recibe 401 (no autorizado), cerrar sesión
      if (error.status === 401 && !esRutaPublica) {
        console.error('🚫 Error 401: Token inválido o expirado');
        authService.cerrarSesion();
      }
      
      return throwError(() => error);
    })
  );
};