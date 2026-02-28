using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;

namespace TESIS_OG.Services.AuthorizationService
{
    public class AuthorizationService : IAuthorizationService
    {
        private readonly TamarindoDbContext _context;

        public AuthorizationService(TamarindoDbContext context)
        {
            _context = context;
        }

        public async Task<bool> TienePermiso(int idUsuario, string modulo, string accion)
        {
            var usuario = await _context.Usuarios
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);

            if (usuario == null) return false;
            if (!string.Equals(usuario.Estado, "Activo", StringComparison.OrdinalIgnoreCase)) return false;

            // Admin: acceso total.
            if (usuario.IdRol == 1) return true;

            var moduloNorm = Normalizar(modulo);
            var accionNorm = Normalizar(accion);

            // 1) Override por usuario.
            var permiso = await _context.Permisos
                .AsNoTracking()
                .FirstOrDefaultAsync(p =>
                    p.NombrePermiso != null &&
                    CoincidePermisoNombre(p.NombrePermiso, moduloNorm, accionNorm));

            if (permiso != null)
            {
                var overrideUsuario = await _context.UsuarioPermisos
                    .AsNoTracking()
                    .FirstOrDefaultAsync(up => up.IdUsuario == idUsuario && up.IdPermiso == permiso.IdPermiso);

                if (overrideUsuario != null)
                    return overrideUsuario.PuedeAcceder;

                // 2) Permiso por rol (si está configurado en tabla RolPermiso).
                var permisoRol = await _context.RolPermisos
                    .AsNoTracking()
                    .FirstOrDefaultAsync(rp => rp.IdRol == usuario.IdRol && rp.IdPermiso == permiso.IdPermiso);

                if (permisoRol != null)
                    return permisoRol.PuedeAcceder;
            }

            // 3) Fallback funcional por rol.
            return TienePermisoFallbackPorRol(usuario.IdRol, moduloNorm, accionNorm);
        }

        public async Task<bool> PuedeEditarArea(int idUsuario, string area)
        {
            var usuario = await _context.Usuarios
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);

            if (usuario == null) return false;
            if (usuario.IdRol == 1) return true; // Admin

            var areaNorm = Normalizar(area);

            return await _context.UsuarioAreas
                .AsNoTracking()
                .Include(ua => ua.IdAreaNavigation)
                .AnyAsync(ua =>
                    ua.IdUsuario == idUsuario &&
                    Normalizar(ua.IdAreaNavigation.NombreArea) == areaNorm);
        }

        public async Task<List<string>> ObtenerAreasUsuario(int idUsuario)
        {
            return await _context.UsuarioAreas
                .AsNoTracking()
                .Include(ua => ua.IdAreaNavigation)
                .Where(ua => ua.IdUsuario == idUsuario)
                .OrderBy(ua => ua.IdAreaNavigation.Orden)
                .Select(ua => ua.IdAreaNavigation.NombreArea)
                .ToListAsync();
        }

        private static string Normalizar(string? value)
        {
            return (value ?? string.Empty).Trim().ToLowerInvariant();
        }

        private static bool CoincidePermisoNombre(string nombrePermiso, string moduloNorm, string accionNorm)
        {
            var nombre = Normalizar(nombrePermiso)
                .Replace("-", " ")
                .Replace("_", " ")
                .Replace(".", " ")
                .Replace(":", " ");

            return nombre.Contains(moduloNorm) && nombre.Contains(accionNorm);
        }

        private static bool TienePermisoFallbackPorRol(int idRol, string modulo, string accion)
        {
            if (idRol == 2) // Supervisor
            {
                return (modulo, accion) switch
                {
                    ("proyectos", "ver") => true,
                    ("proyectos", "veravanceareas") => true,
                    ("clientes", "ver") => true,
                    ("inventario", "ver") => true,
                    ("dashboard", "ver") => true,
                    ("notificaciones", "ver") => true,
                    ("notificaciones", "crear") => true,
                    ("auditoria", "ver") => true,
                    ("usuarios", "asignararea") => true,
                    ("usuarios", "verareas") => true,
                    ("usuarios", "verpermisos") => true,
                    ("talleres", "gestionar") => true,
                    _ => false
                };
            }

            if (idRol == 3) // Operario
            {
                return (modulo, accion) switch
                {
                    ("proyectos", "ver") => true,
                    ("proyectos", "veravanceareas") => true,
                    ("proyectos", "completararea") => true,
                    ("proyectos", "agregarobservacion") => true,
                    _ => false
                };
            }

            if (idRol == 4) // Depósito
            {
                return (modulo, accion) switch
                {
                    ("inventario", "ver") => true,
                    ("inventario", "recepcionar") => true,
                    ("ubicaciones", "ver") => true,
                    ("ordenescompra", "recepcionar") => true,
                    ("notificaciones", "crear") => true,
                    ("notificaciones", "ver") => true,
                    _ => false
                };
            }

            return false;
        }
    }
}
