using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;
using TESIS_OG.DTOs.Notificaciones;
using TESIS_OG.Models;
using TESIS_OG.Security;

namespace TESIS_OG.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificacionesController : ControllerBase
    {
        private readonly TamarindoDbContext _context;
        private readonly ILogger<NotificacionesController> _logger;

        public NotificacionesController(TamarindoDbContext context, ILogger<NotificacionesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Crea una notificación de stock para supervisor (faltante/sobrante).
        /// </summary>
        [HttpPost("stock")]
        [RequiresPermission("Notificaciones", "Crear")]
        public async Task<IActionResult> CrearNotificacionStock([FromBody] CrearNotificacionStockDTO dto)
        {
            var idUsuario = ObtenerIdUsuarioDesdeToken();
            if (!idUsuario.HasValue)
                return Unauthorized(new { message = "No autenticado." });

            var insumo = await _context.Insumos
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.IdInsumo == dto.IdInsumo);

            if (insumo == null)
                return BadRequest(new { message = "El insumo indicado no existe." });

            var tipo = NormalizarTipo(dto.Tipo);
            var stockActual = dto.StockActual ?? insumo.StockActual;
            var stockMinimo = dto.StockMinimo ?? insumo.StockMinimo;
            var mensajeLibre = (dto.Mensaje ?? string.Empty).Trim();

            var accion = $"STOCK|{tipo}|I:{insumo.IdInsumo}|A:{stockActual}|M:{stockMinimo}";
            if (!string.IsNullOrWhiteSpace(mensajeLibre))
            {
                accion += $"|MSG:{mensajeLibre}";
            }

            if (accion.Length > 100)
            {
                accion = accion.Substring(0, 100);
            }

            _context.HistorialUsuarios.Add(new HistorialUsuario
            {
                IdUsuario = idUsuario.Value,
                Modulo = "NotificacionesStock",
                Accion = accion,
                FechaAccion = DateOnly.FromDateTime(DateTime.Now)
            });

            await _context.SaveChangesAsync();

            return Ok(new { message = "Notificación enviada al supervisor." });
        }

        /// <summary>
        /// Lista notificaciones de stock para supervisor.
        /// </summary>
        [HttpGet("stock")]
        [RequiresPermission("Notificaciones", "Ver")]
        public async Task<ActionResult<List<NotificacionStockItemDTO>>> ObtenerNotificacionesStock()
        {
            var idUsuario = ObtenerIdUsuarioDesdeToken();
            if (!idUsuario.HasValue)
                return Unauthorized(new { message = "No autenticado." });

            var items = await _context.HistorialUsuarios
                .AsNoTracking()
                .Include(h => h.IdUsuarioNavigation)
                .Where(h => h.Modulo == "NotificacionesStock")
                .OrderByDescending(h => h.FechaAccion)
                .Take(200)
                .ToListAsync();

            var idsLeidos = await ObtenerIdsLeidos(idUsuario.Value);

            var response = items.Select(h =>
            {
                var parsed = ParseAccion(h.Accion ?? string.Empty);
                return new NotificacionStockItemDTO
                {
                    IdHistorial = h.IdHistorial,
                    IdUsuarioEmisor = h.IdUsuario,
                    UsuarioEmisor = $"{h.IdUsuarioNavigation.NombreUsuario} {h.IdUsuarioNavigation.ApellidoUsuario}".Trim(),
                    Fecha = h.FechaAccion,
                    IdInsumo = parsed.idInsumo,
                    Tipo = parsed.tipo,
                    Mensaje = parsed.mensaje,
                    Leida = idsLeidos.Contains(h.IdHistorial)
                };
            }).ToList();

            return Ok(response);
        }

        /// <summary>
        /// Devuelve cantidad de notificaciones de los últimos 7 días.
        /// </summary>
        [HttpGet("stock/count")]
        [RequiresPermission("Notificaciones", "Ver")]
        public async Task<ActionResult<object>> ContarNotificacionesStock()
        {
            var idUsuario = ObtenerIdUsuarioDesdeToken();
            if (!idUsuario.HasValue)
                return Unauthorized(new { message = "No autenticado." });

            var fechaDesde = DateOnly.FromDateTime(DateTime.Now.AddDays(-7));
            var idsLeidos = await ObtenerIdsLeidos(idUsuario.Value);

            var idsNotificaciones = await _context.HistorialUsuarios
                .AsNoTracking()
                .Where(h => h.Modulo == "NotificacionesStock" && h.FechaAccion >= fechaDesde)
                .Select(h => h.IdHistorial)
                .ToListAsync();

            var count = idsNotificaciones.Count(id => !idsLeidos.Contains(id));

            return Ok(new { total = count });
        }

        /// <summary>
        /// Marca una notificación como leída para el usuario autenticado.
        /// </summary>
        [HttpPost("stock/{idHistorial:int}/leer")]
        [RequiresPermission("Notificaciones", "Ver")]
        public async Task<IActionResult> MarcarNotificacionLeida([FromRoute] int idHistorial)
        {
            var idUsuario = ObtenerIdUsuarioDesdeToken();
            if (!idUsuario.HasValue)
                return Unauthorized(new { message = "No autenticado." });

            var existeNotificacion = await _context.HistorialUsuarios
                .AsNoTracking()
                .AnyAsync(h => h.IdHistorial == idHistorial && h.Modulo == "NotificacionesStock");

            if (!existeNotificacion)
                return NotFound(new { message = "Notificación no encontrada." });

            var accion = $"READ|N:{idHistorial}";
            var yaLeida = await _context.HistorialUsuarios
                .AsNoTracking()
                .AnyAsync(h =>
                    h.IdUsuario == idUsuario.Value &&
                    h.Modulo == "NotificacionesStockLeidas" &&
                    h.Accion == accion);

            if (!yaLeida)
            {
                _context.HistorialUsuarios.Add(new HistorialUsuario
                {
                    IdUsuario = idUsuario.Value,
                    Modulo = "NotificacionesStockLeidas",
                    Accion = accion,
                    FechaAccion = DateOnly.FromDateTime(DateTime.Now)
                });

                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Notificación marcada como leída." });
        }

        // ============================================================
        // SOLICITUDES DE MATERIAL POR PROYECTO
        // ============================================================

        [HttpPost("solicitudes-material")]
        [RequiresPermission("Proyectos", "Crear")]
        public async Task<IActionResult> CrearSolicitudMaterial([FromBody] CrearSolicitudMaterialDTO dto)
        {
            var idUsuario = ObtenerIdUsuarioDesdeToken();
            if (!idUsuario.HasValue)
                return Unauthorized(new { message = "No autenticado." });

            if (dto.Materiales == null || dto.Materiales.Count == 0)
                return BadRequest(new { message = "Debe incluir al menos un material." });

            var hoy = DateOnly.FromDateTime(DateTime.Now);
            var creadas = new List<SolicitudMaterialResponseDTO>();

            foreach (var item in dto.Materiales)
            {
                var solicitud = new TESIS_OG.Models.SolicitudMaterialProyecto
                {
                    IdProyecto = dto.IdProyecto,
                    NombreProyecto = dto.NombreProyecto,
                    IdTipoInsumo = item.IdTipoInsumo,
                    NombreTipoInsumo = item.NombreTipoInsumo,
                    ColorSolicitado = item.ColorSolicitado,
                    CantidadEstimada = item.CantidadEstimada,
                    UnidadMedida = item.UnidadMedida,
                    Mensaje = item.Mensaje,
                    Estado = "Pendiente",
                    IdUsuarioEmisor = idUsuario.Value,
                    FechaSolicitud = hoy
                };

                _context.SolicitudMaterialProyectos.Add(solicitud);
                await _context.SaveChangesAsync();

                var emisor = await _context.Usuarios.AsNoTracking()
                    .FirstOrDefaultAsync(u => u.IdUsuario == idUsuario.Value);

                creadas.Add(new SolicitudMaterialResponseDTO
                {
                    IdSolicitud = solicitud.IdSolicitud,
                    IdProyecto = solicitud.IdProyecto,
                    NombreProyecto = solicitud.NombreProyecto,
                    NombreTipoInsumo = solicitud.NombreTipoInsumo,
                    ColorSolicitado = solicitud.ColorSolicitado,
                    CantidadEstimada = solicitud.CantidadEstimada,
                    UnidadMedida = solicitud.UnidadMedida,
                    Mensaje = solicitud.Mensaje,
                    Estado = solicitud.Estado,
                    UsuarioEmisor = emisor != null ? $"{emisor.NombreUsuario} {emisor.ApellidoUsuario}".Trim() : "",
                    FechaSolicitud = solicitud.FechaSolicitud
                });
            }

            return Ok(new { message = $"{creadas.Count} solicitud(es) creada(s).", solicitudes = creadas });
        }

        [HttpGet("solicitudes-material")]
        [RequiresPermission("Notificaciones", "Ver")]
        public async Task<ActionResult<List<SolicitudMaterialResponseDTO>>> ObtenerSolicitudesMaterial(
            [FromQuery] string? estado = null)
        {
            var query = _context.SolicitudMaterialProyectos
                .AsNoTracking()
                .Include(s => s.IdUsuarioEmisorNavigation)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(estado))
                query = query.Where(s => s.Estado == estado);

            var items = await query
                .OrderByDescending(s => s.FechaSolicitud)
                .ThenByDescending(s => s.IdSolicitud)
                .ToListAsync();

            var result = items.Select(s => new SolicitudMaterialResponseDTO
            {
                IdSolicitud = s.IdSolicitud,
                IdProyecto = s.IdProyecto,
                NombreProyecto = s.NombreProyecto,
                NombreTipoInsumo = s.NombreTipoInsumo,
                ColorSolicitado = s.ColorSolicitado,
                CantidadEstimada = s.CantidadEstimada,
                UnidadMedida = s.UnidadMedida,
                Mensaje = s.Mensaje,
                Estado = s.Estado,
                UsuarioEmisor = s.IdUsuarioEmisorNavigation != null
                    ? $"{s.IdUsuarioEmisorNavigation.NombreUsuario} {s.IdUsuarioEmisorNavigation.ApellidoUsuario}".Trim()
                    : "",
                FechaSolicitud = s.FechaSolicitud,
                FechaAtendida = s.FechaAtendida
            }).ToList();

            return Ok(result);
        }

        [HttpGet("solicitudes-material/count")]
        [RequiresPermission("Notificaciones", "Ver")]
        public async Task<ActionResult<object>> ContarSolicitudesPendientes()
        {
            var count = await _context.SolicitudMaterialProyectos
                .AsNoTracking()
                .CountAsync(s => s.Estado == "Pendiente");

            return Ok(new { total = count });
        }

        [HttpPost("solicitudes-material/{id:int}/atender")]
        [RequiresPermission("Notificaciones", "Ver")]
        public async Task<IActionResult> AtenderSolicitud(int id)
        {
            var idUsuario = ObtenerIdUsuarioDesdeToken();
            if (!idUsuario.HasValue)
                return Unauthorized(new { message = "No autenticado." });

            var solicitud = await _context.SolicitudMaterialProyectos.FindAsync(id);
            if (solicitud == null)
                return NotFound(new { message = "Solicitud no encontrada." });

            solicitud.Estado = "Atendida";
            solicitud.FechaAtendida = DateOnly.FromDateTime(DateTime.Now);
            solicitud.IdUsuarioAtiende = idUsuario.Value;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Solicitud marcada como atendida." });
        }

        private static string NormalizarTipo(string? tipo)
        {
            var raw = (tipo ?? string.Empty).Trim().ToLowerInvariant();
            return raw switch
            {
                "sobrante" => "Sobrante",
                _ => "Faltante"
            };
        }

        private static (int idInsumo, string tipo, string mensaje) ParseAccion(string accion)
        {
            // Formato: STOCK|Tipo|I:ID|A:stockActual|M:stockMinimo|MSG:...
            var partes = (accion ?? string.Empty).Split('|', StringSplitOptions.RemoveEmptyEntries);
            var tipo = partes.Length > 1 ? partes[1] : "Faltante";
            var idInsumo = 0;
            string? msg = null;

            foreach (var parte in partes)
            {
                if (parte.StartsWith("I:", StringComparison.OrdinalIgnoreCase))
                {
                    _ = int.TryParse(parte.Substring(2), out idInsumo);
                }
                else if (parte.StartsWith("MSG:", StringComparison.OrdinalIgnoreCase))
                {
                    msg = parte.Substring(4);
                }
            }

            var mensaje = !string.IsNullOrWhiteSpace(msg)
                ? msg
                : $"Alerta de stock ({tipo}) para insumo #{idInsumo}";

            return (idInsumo, tipo, mensaje);
        }

        private int? ObtenerIdUsuarioDesdeToken()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? User.FindFirstValue("sub");

            return int.TryParse(raw, out var idUsuario) ? idUsuario : null;
        }

        private async Task<HashSet<int>> ObtenerIdsLeidos(int idUsuario)
        {
            var leidasRaw = await _context.HistorialUsuarios
                .AsNoTracking()
                .Where(h => h.IdUsuario == idUsuario && h.Modulo == "NotificacionesStockLeidas")
                .Select(h => h.Accion)
                .ToListAsync();

            var idsLeidos = new HashSet<int>();
            foreach (var accion in leidasRaw)
            {
                if (string.IsNullOrWhiteSpace(accion))
                    continue;

                var partes = accion.Split('|', StringSplitOptions.RemoveEmptyEntries);
                var token = partes.FirstOrDefault(p => p.StartsWith("N:", StringComparison.OrdinalIgnoreCase));
                if (token == null)
                    continue;

                if (int.TryParse(token.Substring(2), out var id))
                {
                    idsLeidos.Add(id);
                }
            }

            return idsLeidos;
        }
    }
}
