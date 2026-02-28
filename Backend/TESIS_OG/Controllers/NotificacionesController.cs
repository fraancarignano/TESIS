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
