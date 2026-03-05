using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;
using TESIS_OG.DTOs.Usuarios;
using TESIS_OG.Models;
using TESIS_OG.Security;
using TESIS_OG.Services.AuthorizationService;

namespace TESIS_OG.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly TamarindoDbContext _context;
        private readonly IAuthorizationService _authorizationService;
        private readonly ILogger<UsuariosController> _logger;

        public UsuariosController(
            TamarindoDbContext context,
            IAuthorizationService authorizationService,
            ILogger<UsuariosController> logger)
        {
            _context = context;
            _authorizationService = authorizationService;
            _logger = logger;
        }

        [HttpGet("{id}/areas")]
        [RequiresPermission("Usuarios", "VerAreas")]
        public async Task<ActionResult<UsuarioAreasDTO>> ObtenerAreasUsuario(int id)
        {
            var usuario = await _context.Usuarios
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.IdUsuario == id);

            if (usuario == null)
                return NotFound(new { message = "Usuario no encontrado." });

            var areas = await _context.UsuarioAreas
                .AsNoTracking()
                .Include(ua => ua.IdAreaNavigation)
                .Where(ua => ua.IdUsuario == id)
                .OrderBy(ua => ua.IdAreaNavigation.Orden)
                .Select(ua => new AreaAsignadaDTO
                {
                    IdArea = ua.IdArea,
                    NombreArea = ua.IdAreaNavigation.NombreArea
                })
                .ToListAsync();

            return Ok(new UsuarioAreasDTO
            {
                IdUsuario = usuario.IdUsuario,
                NombreUsuario = $"{usuario.NombreUsuario} {usuario.ApellidoUsuario}".Trim(),
                Areas = areas
            });
        }

        [HttpPost("{id}/areas")]
        [RequiresPermission("Usuarios", "AsignarArea")]
        public async Task<IActionResult> AsignarArea(int id, [FromBody] AsignarAreaRequestDTO request)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == id);
            if (usuario == null) return NotFound(new { message = "Usuario no encontrado." });

            var area = await _context.AreaProduccions.FirstOrDefaultAsync(a => a.IdArea == request.IdArea);
            if (area == null) return BadRequest(new { message = "Área inválida." });

            var existe = await _context.UsuarioAreas
                .AnyAsync(ua => ua.IdUsuario == id && ua.IdArea == request.IdArea);

            if (!existe)
            {
                _context.UsuarioAreas.Add(new UsuarioArea
                {
                    IdUsuario = id,
                    IdArea = request.IdArea
                });

                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Área asignada correctamente." });
        }

        [HttpDelete("{id}/areas/{idArea}")]
        [RequiresPermission("Usuarios", "AsignarArea")]
        public async Task<IActionResult> DesasignarArea(int id, int idArea)
        {
            var asignacion = await _context.UsuarioAreas
                .FirstOrDefaultAsync(ua => ua.IdUsuario == id && ua.IdArea == idArea);

            if (asignacion == null)
                return NotFound(new { message = "La asignación no existe." });

            _context.UsuarioAreas.Remove(asignacion);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Área desasignada correctamente." });
        }

        [HttpGet("{id}/permisos-efectivos")]
        public async Task<ActionResult<PermisosEfectivosDTO>> ObtenerPermisosEfectivos(int id)
        {
            var idUsuarioActual = ObtenerIdUsuarioActual();
            if (!idUsuarioActual.HasValue)
                return Unauthorized(new { message = "No autenticado." });

            // Permite consultar permisos propios; para terceros exige permiso explícito.
            if (idUsuarioActual.Value != id)
            {
                var puedeVerTercero = await _authorizationService.TienePermiso(
                    idUsuarioActual.Value,
                    "Usuarios",
                    "VerPermisos"
                );

                if (!puedeVerTercero)
                    return StatusCode(StatusCodes.Status403Forbidden, new
                    {
                        message = "No tiene permisos para consultar permisos de otro usuario."
                    });
            }

            var usuario = await _context.Usuarios
                .AsNoTracking()
                .Include(u => u.IdRolNavigation)
                .FirstOrDefaultAsync(u => u.IdUsuario == id);

            if (usuario == null)
                return NotFound(new { message = "Usuario no encontrado." });

            var areas = await _authorizationService.ObtenerAreasUsuario(id);

            var catalogoPermisos = await _context.Permisos
                .AsNoTracking()
                .OrderBy(p => p.NombrePermiso)
                .ToListAsync();

            var permisosEfectivos = new List<PermisoEfectivoItemDTO>();

            foreach (var permiso in catalogoPermisos)
            {
                var (modulo, accion) = MapearPermisoDesdeNombre(permiso.NombrePermiso ?? string.Empty);
                if (await _authorizationService.TienePermiso(id, modulo, accion))
                {
                    permisosEfectivos.Add(new PermisoEfectivoItemDTO
                    {
                        IdPermiso = permiso.IdPermiso,
                        NombrePermiso = permiso.NombrePermiso ?? string.Empty,
                        Modulo = modulo,
                        Accion = accion
                    });
                }
            }

            var response = new PermisosEfectivosDTO
            {
                IdUsuario = usuario.IdUsuario,
                IdRol = usuario.IdRol,
                NombreRol = usuario.IdRolNavigation?.NombreRol ?? string.Empty,
                EsAdmin = usuario.IdRol == 1,
                EsSupervisor = usuario.IdRol == 2,
                EsOperario = usuario.IdRol == 3,
                EsDeposito = usuario.IdRol == 4,
                AreasAsignadas = areas,
                Permisos = permisosEfectivos
            };

            return Ok(response);
        }

        // ─────────────────────────────────────────────────────────────────
        // Panel de permisos personalizados
        // ─────────────────────────────────────────────────────────────────

        /// <summary>
        /// Devuelve el catálogo completo de permisos agrupado por módulo,
        /// con el estado efectivo actual para el usuario indicado.
        /// </summary>
        [HttpGet("{id}/permisos-panel")]
        public async Task<ActionResult<PermisosPanelResponse>> ObtenerPermisosPanel(int id)
        {
            var idActual = ObtenerIdUsuarioActual();
            if (!idActual.HasValue)
                return Unauthorized(new { message = "No autenticado." });

            if (idActual.Value != id)
            {
                var puedeVer = await _authorizationService.TienePermiso(idActual.Value, "Usuarios", "VerPermisos");
                if (!puedeVer)
                    return StatusCode(403, new { message = "Sin permisos para consultar permisos de otro usuario." });
            }

            var usuario = await _context.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.IdUsuario == id);
            if (usuario == null) return NotFound(new { message = "Usuario no encontrado." });

            var catalogoPermisos = await _context.Permisos
                .AsNoTracking()
                .OrderBy(p => p.NombrePermiso)
                .ToListAsync();

            // Overrides explícitos del usuario
            var overridesUsuario = await _context.UsuarioPermisos
                .AsNoTracking()
                .Where(up => up.IdUsuario == id)
                .ToDictionaryAsync(up => up.IdPermiso, up => up.PuedeAcceder);

            var modulosDict = new Dictionary<string, List<PermisoItemDTO>>(StringComparer.OrdinalIgnoreCase);

            foreach (var permiso in catalogoPermisos)
            {
                var (modulo, accion) = ExtraerModuloAccion(permiso.NombrePermiso ?? string.Empty);

                bool tieneOverride = overridesUsuario.TryGetValue(permiso.IdPermiso, out var overrideValue);
                bool habilitado;

                if (tieneOverride)
                {
                    habilitado = overrideValue;
                }
                else
                {
                    habilitado = await _authorizationService.TienePermiso(id, modulo, accion);
                }

                if (!modulosDict.ContainsKey(modulo))
                    modulosDict[modulo] = new List<PermisoItemDTO>();

                modulosDict[modulo].Add(new PermisoItemDTO
                {
                    IdPermiso = permiso.IdPermiso,
                    Accion = accion,
                    Descripcion = permiso.Descripcion ?? string.Empty,
                    Habilitado = habilitado,
                    TieneOverride = tieneOverride
                });
            }

            var response = new PermisosPanelResponse
            {
                IdUsuario = id,
                Modulos = modulosDict
                    .OrderBy(kv => kv.Key)
                    .Select(kv => new ModuloPermisosDTO
                    {
                        Modulo = kv.Key,
                        Permisos = kv.Value.OrderBy(p => p.Accion).ToList()
                    })
                    .ToList()
            };

            return Ok(response);
        }

        /// <summary>
        /// Guarda permisos personalizados (overrides) para un usuario específico.
        /// </summary>
        [HttpPut("{id}/permisos")]
        public async Task<IActionResult> GuardarPermisos(int id, [FromBody] GuardarPermisosRequest request)
        {
            var idActual = ObtenerIdUsuarioActual();
            if (!idActual.HasValue)
                return Unauthorized(new { message = "No autenticado." });

            var puedeGestionar = await _authorizationService.TienePermiso(idActual.Value, "Usuarios", "Ver");
            if (!puedeGestionar)
                return StatusCode(403, new { message = "Sin permisos para gestionar permisos de usuarios." });

            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == id);
            if (usuario == null) return NotFound(new { message = "Usuario no encontrado." });

            if (request.Permisos == null || request.Permisos.Count == 0)
                return BadRequest(new { message = "No se enviaron permisos." });

            var idPermisos = request.Permisos.Select(p => p.IdPermiso).Distinct().ToList();

            // Validar que todos los idPermiso existen
            var permisosValidos = await _context.Permisos
                .AsNoTracking()
                .Where(p => idPermisos.Contains(p.IdPermiso))
                .Select(p => p.IdPermiso)
                .ToListAsync();

            var invalidos = idPermisos.Except(permisosValidos).ToList();
            if (invalidos.Any())
                return BadRequest(new { message = $"IDs de permiso inválidos: {string.Join(", ", invalidos)}." });

            // Obtener overrides actuales del usuario
            var existentes = await _context.UsuarioPermisos
                .Where(up => up.IdUsuario == id && idPermisos.Contains(up.IdPermiso))
                .ToListAsync();

            foreach (var item in request.Permisos)
            {
                var existente = existentes.FirstOrDefault(e => e.IdPermiso == item.IdPermiso);
                if (existente != null)
                {
                    existente.PuedeAcceder = item.PuedeAcceder;
                }
                else
                {
                    _context.UsuarioPermisos.Add(new UsuarioPermiso
                    {
                        IdUsuario = id,
                        IdPermiso = item.IdPermiso,
                        PuedeAcceder = item.PuedeAcceder
                    });
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Usuario {AdminId} actualizó {Count} permisos del usuario {TargetId}.",
                idActual.Value, request.Permisos.Count, id);

            return Ok(new { message = "Permisos actualizados correctamente." });
        }

        private static (string modulo, string accion) ExtraerModuloAccion(string nombrePermiso)
        {
            var partes = nombrePermiso.Split('.', 2, StringSplitOptions.RemoveEmptyEntries);
            if (partes.Length >= 2)
                return (partes[0].Trim(), partes[1].Trim());
            if (partes.Length == 1)
                return (partes[0].Trim(), "Ver");
            return ("General", "Ver");
        }

        private int? ObtenerIdUsuarioActual()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? User.FindFirstValue("sub");

            return int.TryParse(raw, out var idUsuario) ? idUsuario : null;
        }

        private static (string modulo, string accion) MapearPermisoDesdeNombre(string nombrePermiso)
        {
            var tokens = (nombrePermiso ?? string.Empty)
                .Replace("-", " ")
                .Replace("_", " ")
                .Replace(".", " ")
                .Replace(":", " ")
                .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Select(t => t.Trim())
                .ToList();

            if (tokens.Count >= 2)
                return (tokens[0], tokens[1]);

            if (tokens.Count == 1)
                return (tokens[0], "Ver");

            return ("General", "Ver");
        }
    }
}
