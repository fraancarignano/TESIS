using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;
using TESIS_OG.DTOs.Proyectos;
using TESIS_OG.Models;
using TESIS_OG.Security;
using TESIS_OG.Services.AuthorizationService;

namespace TESIS_OG.Controllers
{
    [ApiController]
    [Route("api/Proyecto")]
    public class ProyectoAreasController : ControllerBase
    {
        private readonly TamarindoDbContext _context;
        private readonly IAuthorizationService _authorizationService;
        private readonly ILogger<ProyectoAreasController> _logger;

        public ProyectoAreasController(
            TamarindoDbContext context,
            IAuthorizationService authorizationService,
            ILogger<ProyectoAreasController> logger)
        {
            _context = context;
            _authorizationService = authorizationService;
            _logger = logger;
        }

        [HttpGet("{id}/avance-areas")]
        [RequiresPermission("Proyectos", "VerAvanceAreas")]
        [ProducesResponseType(typeof(List<ProyectoAvanceAreaDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObtenerAvanceAreas(int id)
        {
            var proyectoExiste = await _context.Proyectos.AnyAsync(p => p.IdProyecto == id);
            if (!proyectoExiste)
                return NotFound(new { message = $"Proyecto con ID {id} no encontrado" });

            var areas = await _context.AreaProduccions
                .AsNoTracking()
                .OrderBy(a => a.Orden)
                .ToListAsync();

            var avances = await _context.AvanceAreaProyectos
                .AsNoTracking()
                .Where(a => a.IdProyecto == id)
                .GroupBy(a => a.IdArea)
                .Select(g => g
                    .OrderByDescending(x => x.FechaActualizacion)
                    .ThenByDescending(x => x.IdAvanceArea)
                    .First())
                .ToListAsync();

            var avancePorArea = avances.ToDictionary(x => x.IdArea, x => x);

            var response = areas.Select(area =>
            {
                avancePorArea.TryGetValue(area.IdArea, out var ultimo);
                var porcentaje = ultimo?.PorcentajeAvance ?? 0;
                var estado = porcentaje >= 100
                    ? "Completado"
                    : porcentaje > 0 ? "EnProceso" : "Pendiente";

                return new ProyectoAvanceAreaDTO
                {
                    IdProyecto = id,
                    IdArea = area.IdArea,
                    Area = area.NombreArea,
                    Estado = estado,
                    PorcentajeAvance = porcentaje,
                    IdUsuarioCompleto = porcentaje >= 100 ? ultimo?.IdUsuarioRegistro : null,
                    FechaCompletado = porcentaje >= 100 ? ultimo?.FechaActualizacion : null,
                    Observaciones = ultimo?.Observaciones
                };
            }).ToList();

            return Ok(response);
        }

        [HttpPost("{id}/areas/{area}/completar")]
        [RequiresPermission("Proyectos", "CompletarArea")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CompletarArea(
            int id,
            string area,
            [FromBody] CompletarAreaRequestDTO request)
        {
            var idUsuario = ObtenerIdUsuarioDesdeToken();
            if (!idUsuario.HasValue)
                return Unauthorized(new { message = "No se pudo identificar al usuario autenticado." });

            var proyecto = await _context.Proyectos.FirstOrDefaultAsync(p => p.IdProyecto == id);
            if (proyecto == null)
                return NotFound(new { message = $"Proyecto con ID {id} no encontrado" });

            var areasOrdenadas = await _context.AreaProduccions
                .OrderBy(a => a.Orden)
                .ToListAsync();

            var areaObjetivo = areasOrdenadas
                .FirstOrDefault(a => Normalizar(a.NombreArea) == Normalizar(area));

            if (areaObjetivo == null)
                return BadRequest(new { message = $"Área '{area}' no válida." });

            var puedeEditar = await _authorizationService.PuedeEditarArea(idUsuario.Value, areaObjetivo.NombreArea);
            if (!puedeEditar)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = "No tiene asignada esta área para poder completarla."
                });
            }

            var avancesActuales = await _context.AvanceAreaProyectos
                .Where(a => a.IdProyecto == id)
                .GroupBy(a => a.IdArea)
                .Select(g => g
                    .OrderByDescending(x => x.FechaActualizacion)
                    .ThenByDescending(x => x.IdAvanceArea)
                    .First())
                .ToListAsync();

            var avancePorArea = avancesActuales.ToDictionary(x => x.IdArea, x => x.PorcentajeAvance);

            var indiceObjetivo = areasOrdenadas.FindIndex(a => a.IdArea == areaObjetivo.IdArea);
            if (indiceObjetivo > 0)
            {
                var areaAnterior = areasOrdenadas[indiceObjetivo - 1];
                var avanceAnterior = avancePorArea.GetValueOrDefault(areaAnterior.IdArea, 0);
                if (avanceAnterior < 100)
                {
                    return BadRequest(new
                    {
                        message = $"No puede completar '{areaObjetivo.NombreArea}' hasta completar '{areaAnterior.NombreArea}'."
                    });
                }
            }

            var avanceAreaActual = avancePorArea.GetValueOrDefault(areaObjetivo.IdArea, 0);
            if (avanceAreaActual >= 100)
            {
                return BadRequest(new
                {
                    message = $"El área '{areaObjetivo.NombreArea}' ya está completada."
                });
            }

            _context.AvanceAreaProyectos.Add(new AvanceAreaProyecto
            {
                IdProyecto = id,
                IdArea = areaObjetivo.IdArea,
                PorcentajeAvance = 100,
                FechaActualizacion = DateTime.Now,
                IdUsuarioRegistro = idUsuario.Value,
                Observaciones = request.Observaciones
            });

            if (!string.IsNullOrWhiteSpace(request.Observaciones))
            {
                _context.ObservacionProyectos.Add(new ObservacionProyecto
                {
                    IdProyecto = id,
                    IdUsuario = idUsuario.Value,
                    Fecha = DateTime.Now,
                    Descripcion = $"[AREA_COMPLETADA] area={areaObjetivo.NombreArea} obs={request.Observaciones.Trim()}"
                });
            }

            // Sincronización de campos resumen del proyecto según orden de áreas.
            var avancesConActual = areasOrdenadas.ToDictionary(
                a => a.IdArea,
                a => a.IdArea == areaObjetivo.IdArea ? 100 : avancePorArea.GetValueOrDefault(a.IdArea, 0)
            );

            var slots = areasOrdenadas.Select(a => avancesConActual[a.IdArea]).ToList();
            proyecto.AvanceGerenciaAdmin = slots.Count > 0 ? slots[0] : 0;
            proyecto.AvanceDisenoDesarrollo = slots.Count > 1 ? slots[1] : 0;
            proyecto.AvanceControlCalidad = slots.Count > 2 ? slots[2] : 0;
            proyecto.AvanceEtiquetadoEmpaquetado = slots.Count > 3 ? slots[3] : 0;
            proyecto.AvanceDepositoLogistica = slots.Count > 4 ? slots[4] : 0;

            var siguientePendiente = areasOrdenadas
                .FirstOrDefault(a => avancePorArea.GetValueOrDefault(a.IdArea, 0) < 100 && a.IdArea != areaObjetivo.IdArea);

            if (siguientePendiente == null && indiceObjetivo == areasOrdenadas.Count - 1)
            {
                proyecto.AreaActual = areaObjetivo.NombreArea;
                proyecto.Estado = "Finalizado";
            }
            else
            {
                var primeraPendiente = areasOrdenadas
                    .FirstOrDefault(a => avancesConActual[a.IdArea] < 100);

                if (primeraPendiente != null)
                    proyecto.AreaActual = primeraPendiente.NombreArea;

                if (string.Equals(proyecto.Estado, "Pendiente", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(proyecto.Estado, "Pausado", StringComparison.OrdinalIgnoreCase))
                {
                    proyecto.Estado = "En Proceso";
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Área completada. Proyecto={IdProyecto}, Area={Area}, Usuario={IdUsuario}",
                id,
                areaObjetivo.NombreArea,
                idUsuario.Value
            );

            return Ok(new { message = $"Área '{areaObjetivo.NombreArea}' completada correctamente." });
        }

        private static string Normalizar(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;

            var normalized = value.Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder();
            foreach (var c in normalized)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                    sb.Append(c);
            }
            return sb.ToString().Normalize(NormalizationForm.FormC).Trim().ToLowerInvariant();
        }

        private int? ObtenerIdUsuarioDesdeToken()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? User.FindFirstValue("sub");

            return int.TryParse(raw, out var idUsuario) ? idUsuario : null;
        }
    }
}
