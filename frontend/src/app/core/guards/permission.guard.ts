import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { PermissionService } from '../services/permission.service';

interface PermissionRouteData {
  modulo: string;
  accion: string;
}

export const permissionGuard: CanActivateFn = (route) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  const permission = route.data?.['permission'] as PermissionRouteData | undefined;
  if (!permission) return true;

  const usuarioRaw = localStorage.getItem('usuario');
  if (!usuarioRaw) {
    return router.createUrlTree(['/sin-acceso']);
  }

  let idUsuario: number | null = null;
  try {
    const usuario = JSON.parse(usuarioRaw);
    idUsuario = Number(usuario?.idUsuario) || null;
  } catch {
    return router.createUrlTree(['/sin-acceso']);
  }

  if (!idUsuario) {
    return router.createUrlTree(['/sin-acceso']);
  }

  return permissionService.asegurarPermisosCargados(idUsuario).pipe(
    map((ok) => {
      if (!ok) return router.createUrlTree(['/sin-acceso']);
      return permissionService.tienePermiso(permission.modulo, permission.accion)
        ? true
        : router.createUrlTree(['/sin-acceso']);
    })
  );
};
