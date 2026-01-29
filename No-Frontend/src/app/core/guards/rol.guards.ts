import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { AuthService } from '../../modules/login/services/auth.service';

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => { 
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as string[]; 
  
  // Obtener el usuario actual del localStorage (síncrono)
  const usuario = authService.obtenerUsuarioActual();
  
  // Verificar si hay usuario y tiene rol
  if (!usuario || !usuario.idRol) {
    console.warn('Usuario sin autenticar o sin rol');
    router.navigate(['/login']);
    return of(false);
  }
  
  // Si no hay roles requeridos, permitir acceso
  if (!requiredRoles || requiredRoles.length === 0) {
    return of(true);
  }
  
  // Mapear idRol a nombreRol
  const userRoleName = getRoleName(usuario.idRol);
  
  // Verificar si el rol del usuario está en los roles permitidos
  const hasPermission = requiredRoles.includes(userRoleName);
  
  if (!hasPermission) {
    console.warn(`Acceso denegado. Rol requerido: ${requiredRoles}, Rol usuario: ${userRoleName}`);
    router.navigate(['/proyectos']);
  }
  
  return of(hasPermission);
};

// Helper para mapear idRol a nombreRol
function getRoleName(idRol: number): string {
  const roleMap: { [key: number]: string } = {
    1: 'Administrador',
    2: 'Operador',
    3: 'Supervisor'
  };
  return roleMap[idRol] || '';
}