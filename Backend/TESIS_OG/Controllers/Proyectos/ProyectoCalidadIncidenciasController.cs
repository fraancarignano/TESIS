using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using TESIS_OG.Data;
using TESIS_OG.DTOs.Proyectos;
using TESIS_OG.Models;
using TESIS_OG.Security;

namespace TESIS_OG.Controllers.Proyectos;

[ApiController]
[Route("api/proyectos/{idProyecto:int}/calidad-incidencias")]
public class ProyectoCalidadIncidenciasController : ControllerBase
{
    private readonly TamarindoDbContext _context;
    private readonly ILogger<ProyectoCalidadIncidenciasController> _logger;

    private static readonly HashSet<string> EstadosPermitidos = new(StringComparer.OrdinalIgnoreCase)
    {
        "PENDIENTE",
        "EN_TALLER",
        "REINGRESADA",
        "CERRADA"
    };

    public ProyectoCalidadIncidenciasController(TamarindoDbContext context, ILogger<ProyectoCalidadIncidenciasController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    [RequiresPermission("Proyectos", "VerAvanceAreas")]
    public async Task<ActionResult<List<CalidadIncidenciaDTO>>> Listar(int idProyecto, string? estado)
    {
        try
        {
            var query = _context.CalidadIncidencias
                .AsNoTracking()
                .Include(i => i.IdTallerNavigation)
                .Where(i => i.IdProyecto == idProyecto);

            if (!string.IsNullOrWhiteSpace(estado))
                query = query.Where(i => i.Estado == estado);

            var items = await query
                .OrderByDescending(i => i.FechaDeteccion)
                .ThenByDescending(i => i.IdCalidadIncidencia)
                .Select(i => new CalidadIncidenciaDTO
                {
                    IdCalidadIncidencia = i.IdCalidadIncidencia,
                    IdProyecto = i.IdProyecto,
                    IdTaller = i.IdTaller,
                    NombreTaller = i.IdTallerNavigation != null ? i.IdTallerNavigation.NombreTaller : null,
                    IdUsuarioRegistro = i.IdUsuarioRegistro,
                    FechaDeteccion = i.FechaDeteccion,
                    NombrePrenda = i.NombrePrenda,
                    Talle = i.Talle,
                    CriterioId = i.CriterioId,
                    CriterioNombre = i.CriterioNombre,
                    Cantidad = i.Cantidad,
                    DetalleFalla = i.DetalleFalla,
                    Estado = i.Estado,
                    FechaEnvioTaller = i.FechaEnvioTaller,
                    FechaReingreso = i.FechaReingreso,
                    FechaCierre = i.FechaCierre
                })
                .ToListAsync();

            return Ok(items);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al listar incidencias de calidad");
            return StatusCode(500, new { message = "Error al listar incidencias de calidad", error = ex.Message });
        }
    }

    [HttpGet("resumen-por-talle")]
    [RequiresPermission("Proyectos", "VerAvanceAreas")]
    public async Task<ActionResult<List<CalidadIncidenciaResumenDTO>>> ObtenerResumenPorTalle(int idProyecto, bool? soloAbiertas = true)
    {
        try
        {
            var query = _context.CalidadIncidencias
                .AsNoTracking()
                .Where(i => i.IdProyecto == idProyecto);

            // Filtrar solo las incidencias que no están cerradas (prendas que aún necesitan control)
            if (soloAbiertas == true)
                query = query.Where(i => i.Estado != "CERRADA");

            var incidencias = await query.ToListAsync();

            // Agrupar por prenda y talle
            var resumen = incidencias
                .GroupBy(i => new { i.NombrePrenda, i.Talle })
                .Select(g => new CalidadIncidenciaResumenDTO
                {
                    NombrePrenda = g.Key.NombrePrenda,
                    Talle = g.Key.Talle,
                    CantidadTotal = g.Sum(i => i.Cantidad),
                    CantidadPendiente = g.Where(i => i.Estado == "PENDIENTE").Sum(i => i.Cantidad),
                    CantidadEnTaller = g.Where(i => i.Estado == "EN_TALLER").Sum(i => i.Cantidad),
                    CantidadReingresada = g.Where(i => i.Estado == "REINGRESADA").Sum(i => i.Cantidad),
                    Incidencias = g.Select(i => new CalidadIncidenciaDetalleResumenDTO
                    {
                        IdCalidadIncidencia = i.IdCalidadIncidencia,
                        CriterioNombre = i.CriterioNombre,
                        Cantidad = i.Cantidad,
                        Estado = i.Estado,
                        FechaDeteccion = i.FechaDeteccion,
                        DetalleFalla = i.DetalleFalla
                    })
                    .OrderByDescending(i => i.FechaDeteccion)
                    .ToList()
                })
                .OrderBy(r => r.NombrePrenda)
                .ThenBy(r => r.Talle)
                .ToList();

            return Ok(resumen);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener resumen de incidencias por talle");
            return StatusCode(500, new { message = "Error al obtener resumen de incidencias por talle", error = ex.Message });
        }
    }

    [HttpPost]
    [RequiresPermission("Proyectos", "CompletarArea")]
    public async Task<ActionResult<CalidadIncidenciaDTO>> Crear(int idProyecto, [FromBody] CalidadIncidenciaCrearDTO dto)
    {
        try
        {
            var idUsuario = ObtenerIdUsuarioDesdeToken();
            if (!idUsuario.HasValue)
                return Unauthorized(new { message = "No se pudo identificar el usuario actual." });

            if (string.IsNullOrWhiteSpace(dto.NombrePrenda))
                return BadRequest(new { message = "NombrePrenda es requerido." });

            if (string.IsNullOrWhiteSpace(dto.Talle))
                return BadRequest(new { message = "Talle es requerido." });

            if (string.IsNullOrWhiteSpace(dto.CriterioId) || string.IsNullOrWhiteSpace(dto.CriterioNombre))
                return BadRequest(new { message = "CriterioId y CriterioNombre son requeridos." });

            if (dto.Cantidad <= 0)
                return BadRequest(new { message = "Cantidad debe ser mayor a 0." });

            var proyectoExiste = await _context.Proyectos.AnyAsync(p => p.IdProyecto == idProyecto);
            if (!proyectoExiste) return NotFound(new { message = "Proyecto no encontrado." });

            var entidad = new CalidadIncidencia
            {
                IdProyecto = idProyecto,
                IdTaller = dto.IdTaller,
                IdUsuarioRegistro = idUsuario.Value,
                FechaDeteccion = DateTime.Now,
                NombrePrenda = dto.NombrePrenda.Trim(),
                Talle = dto.Talle.Trim(),
                CriterioId = dto.CriterioId.Trim(),
                CriterioNombre = dto.CriterioNombre.Trim(),
                Cantidad = dto.Cantidad,
                DetalleFalla = string.IsNullOrWhiteSpace(dto.DetalleFalla) ? null : dto.DetalleFalla.Trim(),
                Estado = "PENDIENTE"
            };

            _context.CalidadIncidencias.Add(entidad);
            await _context.SaveChangesAsync();

            var tallerNombre = entidad.IdTaller.HasValue
                ? await _context.Tallers
                    .Where(t => t.IdTaller == entidad.IdTaller.Value)
                    .Select(t => t.NombreTaller)
                    .FirstOrDefaultAsync()
                : null;

            return Created(string.Empty, new CalidadIncidenciaDTO
            {
                IdCalidadIncidencia = entidad.IdCalidadIncidencia,
                IdProyecto = entidad.IdProyecto,
                IdTaller = entidad.IdTaller,
                NombreTaller = tallerNombre,
                IdUsuarioRegistro = entidad.IdUsuarioRegistro,
                FechaDeteccion = entidad.FechaDeteccion,
                NombrePrenda = entidad.NombrePrenda,
                Talle = entidad.Talle,
                CriterioId = entidad.CriterioId,
                CriterioNombre = entidad.CriterioNombre,
                Cantidad = entidad.Cantidad,
                DetalleFalla = entidad.DetalleFalla,
                Estado = entidad.Estado,
                FechaEnvioTaller = entidad.FechaEnvioTaller,
                FechaReingreso = entidad.FechaReingreso,
                FechaCierre = entidad.FechaCierre
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al crear incidencia de calidad");
            return StatusCode(500, new { message = "Error al crear incidencia de calidad", error = ex.Message });
        }
    }

    [HttpPut("{idCalidadIncidencia:int}/estado")]
    [RequiresPermission("Proyectos", "CompletarArea")]
    public async Task<IActionResult> CambiarEstado(
        int idProyecto,
        int idCalidadIncidencia,
        [FromBody] CalidadIncidenciaActualizarEstadoDTO dto)
    {
        try
        {
            var idUsuario = ObtenerIdUsuarioDesdeToken();
            if (!idUsuario.HasValue)
                return Unauthorized(new { message = "No se pudo identificar el usuario actual." });

            var estado = (dto.Estado ?? string.Empty).Trim().ToUpperInvariant();
            if (!EstadosPermitidos.Contains(estado))
                return BadRequest(new { message = $"Estado inválido. Permitidos: {string.Join(", ", EstadosPermitidos)}" });

            var entidad = await _context.CalidadIncidencias
                .FirstOrDefaultAsync(i => i.IdCalidadIncidencia == idCalidadIncidencia && i.IdProyecto == idProyecto);

            if (entidad == null) return NotFound(new { message = "Incidencia no encontrada." });

            entidad.Estado = estado;

            var ahora = DateTime.Now;
            if (estado.Equals("EN_TALLER", StringComparison.OrdinalIgnoreCase))
                entidad.FechaEnvioTaller ??= ahora;
            else if (estado.Equals("REINGRESADA", StringComparison.OrdinalIgnoreCase))
                entidad.FechaReingreso ??= ahora;
            else if (estado.Equals("CERRADA", StringComparison.OrdinalIgnoreCase))
                entidad.FechaCierre ??= ahora;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Estado actualizado.", estado = entidad.Estado });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar estado de incidencia de calidad");
            return StatusCode(500, new { message = "Error al actualizar estado", error = ex.Message });
        }
    }

    private int? ObtenerIdUsuarioDesdeToken()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub");

        return int.TryParse(raw, out var idUsuario) ? idUsuario : null;
    }
}

