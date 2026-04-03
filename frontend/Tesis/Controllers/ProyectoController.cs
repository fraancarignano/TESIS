using System.Globalization;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tesis.Data;
using Tesis.DTOs.ProyectoDiseno;
using Tesis.Models;

namespace Tesis.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProyectoController : ControllerBase
{
    private const int DisenoAreaId = 1;
    private const string EstadoCompletado = "Completado";
    private readonly ApplicationDbContext _context;

    public ProyectoController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("{id:int}/resumen")]
    public async Task<ActionResult<ProyectoResumenDto>> ObtenerResumen(int id)
    {
        var proyecto = await _context.Proyectos
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.IdProyecto == id);

        if (proyecto is null)
        {
            return NotFound($"No se encontró el proyecto {id}.");
        }

        var cliente = await _context.Clientes
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.IdCliente == proyecto.IdCliente);

        var prendas = await _context.ProyectoPrendas
            .AsNoTracking()
            .Where(x => x.IdProyecto == id)
            .ToListAsync();

        var prendaIds = prendas.Select(x => x.IdProyectoPrenda).ToList();

        var talles = await _context.PrendaTalles
            .AsNoTracking()
            .Where(x => prendaIds.Contains(x.IdProyectoPrenda))
            .Join(
                _context.Talles.AsNoTracking(),
                pt => pt.IdTalle,
                t => t.IdTalle,
                (pt, t) => new
                {
                    pt.IdProyectoPrenda,
                    pt.IdTalle,
                    t.NombreTalle,
                    pt.Cantidad
                })
            .ToListAsync();

        var avance = await ObtenerAvanceDiseno(id);

        return Ok(new ProyectoResumenDto
        {
            IdProyecto = proyecto.IdProyecto,
            Cliente = FormatearNombreCliente(cliente),
            NombreProyecto = proyecto.NombreProyecto,
            Prioridad = proyecto.Prioridad,
            FechaInicio = proyecto.FechaInicio,
            FechaFin = proyecto.FechaFin,
            AreaCompletada = EsAreaCompletada(avance),
            EstadoArea = avance?.Estado ?? "Pendiente",
            Prendas = prendas.Select(prenda => new ProyectoResumenPrendaDto
            {
                IdProyectoPrenda = prenda.IdProyectoPrenda,
                TipoPrenda = prenda.NombrePrenda ?? $"Prenda #{prenda.IdTipoPrenda}",
                MaterialBase = prenda.MaterialBase,
                CantidadTotal = prenda.CantidadTotal,
                TieneBordado = prenda.TieneBordado,
                TieneEstampado = prenda.TieneEstampado,
                DescripcionDiseno = prenda.DescripcionDiseno,
                Talles = talles
                    .Where(t => t.IdProyectoPrenda == prenda.IdProyectoPrenda)
                    .Select(t => new ProyectoResumenTalleDto
                    {
                        IdTalle = t.IdTalle,
                        NombreTalle = t.NombreTalle,
                        Cantidad = t.Cantidad
                    })
                    .OrderBy(t => t.NombreTalle)
                    .ToList()
            }).ToList()
        });
    }

    [HttpGet("{id:int}/diseno")]
    public async Task<ActionResult<ProyectoDisenoDetalleDto>> ObtenerDiseno(int id)
    {
        var proyectoExiste = await _context.Proyectos
            .AsNoTracking()
            .AnyAsync(x => x.IdProyecto == id);

        if (!proyectoExiste)
        {
            return NotFound($"No se encontró el proyecto {id}.");
        }

        var disenos = await _context.ProyectoDisenos
            .AsNoTracking()
            .Where(x => x.IdProyecto == id)
            .OrderBy(x => x.IdPrenda)
            .ToListAsync();

        var avance = await ObtenerAvanceDiseno(id);

        return Ok(new ProyectoDisenoDetalleDto
        {
            IdProyecto = id,
            Completado = EsAreaCompletada(avance),
            EstadoArea = avance?.Estado ?? "Pendiente",
            FechaCompletado = avance?.FechaCompletado,
            ObservacionesGenerales = avance?.Observaciones,
            Prendas = disenos.Select(x => new ProyectoDisenoPrendaDetalleDto
            {
                IdDiseno = x.IdDiseno,
                IdPrenda = x.IdPrenda,
                ImagenLogo = x.ImagenLogo,
                DescripcionLogo = x.DescripcionLogo,
                ImagenMockup = x.ImagenMockup,
                DescripcionMockup = x.DescripcionMockup
            }).ToList()
        });
    }

    [HttpPost("{id:int}/diseno")]
    public async Task<ActionResult<ProyectoDisenoDetalleDto>> GuardarDiseno(int id, [FromBody] ProyectoDisenoDto request)
    {
        var proyectoExiste = await _context.Proyectos
            .AsNoTracking()
            .AnyAsync(x => x.IdProyecto == id);

        if (!proyectoExiste)
        {
            return NotFound($"No se encontró el proyecto {id}.");
        }

        var avance = await ObtenerAvanceDiseno(id);
        if (EsAreaCompletada(avance))
        {
            return BadRequest("El diseño ya fue completado y no se puede editar.");
        }

        var prendas = await _context.ProyectoPrendas
            .AsNoTracking()
            .Where(x => x.IdProyecto == id)
            .ToListAsync();

        var validacion = ValidarDiseno(request, prendas);
        if (!string.IsNullOrWhiteSpace(validacion))
        {
            return BadRequest(validacion);
        }

        var ahora = DateTime.UtcNow;
        var usuarioActual = ObtenerUsuarioActual();
        var existentes = await _context.ProyectoDisenos
            .Where(x => x.IdProyecto == id)
            .ToListAsync();

        var payloadIds = request.Prendas.Select(x => x.IdPrenda).ToHashSet();

        foreach (var sobrante in existentes.Where(x => !payloadIds.Contains(x.IdPrenda)).ToList())
        {
            _context.ProyectoDisenos.Remove(sobrante);
        }

        foreach (var item in request.Prendas)
        {
            var entidad = existentes.FirstOrDefault(x => x.IdPrenda == item.IdPrenda);
            if (entidad is null)
            {
                entidad = new ProyectoDiseno
                {
                    IdProyecto = id,
                    IdPrenda = item.IdPrenda,
                    FechaCreacion = ahora,
                    IdUsuarioCreacion = usuarioActual
                };
                _context.ProyectoDisenos.Add(entidad);
            }

            entidad.ImagenLogo = LimpiarTexto(item.ImagenLogo);
            entidad.DescripcionLogo = LimpiarTexto(item.DescripcionLogo);
            entidad.ImagenMockup = LimpiarTexto(item.ImagenMockup);
            entidad.DescripcionMockup = LimpiarTexto(item.DescripcionMockup);
            entidad.FechaModificacion = ahora;
            entidad.IdUsuarioModificacion = usuarioActual;
        }

        var registroAvance = avance ?? new AvanceAreaProyecto
        {
            IdProyecto = id,
            IdAreaProduccion = DisenoAreaId,
            Estado = "EnProceso"
        };

        registroAvance.Observaciones = LimpiarTexto(request.ObservacionesGenerales);
        if (avance is null)
        {
            _context.AvanceAreaProyectos.Add(registroAvance);
        }

        await _context.SaveChangesAsync();

        return await ObtenerDiseno(id);
    }

    [HttpPost("{id:int}/areas/{area}/completar")]
    public async Task<ActionResult<ProyectoDisenoDetalleDto>> CompletarAreaDiseno(int id, string area, [FromBody] CompletarAreaDisenoDto request)
    {
        if (!EsAreaDiseno(area))
        {
            return BadRequest("Este endpoint solo completa el área de Diseño.");
        }

        var proyectoExiste = await _context.Proyectos
            .AsNoTracking()
            .AnyAsync(x => x.IdProyecto == id);

        if (!proyectoExiste)
        {
            return NotFound($"No se encontró el proyecto {id}.");
        }

        var prendas = await _context.ProyectoPrendas
            .AsNoTracking()
            .Where(x => x.IdProyecto == id)
            .ToListAsync();

        var disenos = await _context.ProyectoDisenos
            .Where(x => x.IdProyecto == id)
            .ToListAsync();

        if (!disenos.Any())
        {
            return BadRequest("Debe cargar al menos un mockup antes de completar el área.");
        }

        foreach (var prenda in prendas)
        {
            var diseno = disenos.FirstOrDefault(x => x.IdPrenda == prenda.IdProyectoPrenda);
            if (diseno is null || string.IsNullOrWhiteSpace(diseno.ImagenMockup))
            {
                return BadRequest($"La prenda {prenda.IdProyectoPrenda} requiere un mockup obligatorio.");
            }

            if ((prenda.TieneBordado || prenda.TieneEstampado) && string.IsNullOrWhiteSpace(diseno.ImagenLogo))
            {
                return BadRequest($"La prenda {prenda.IdProyectoPrenda} requiere imagen de logo porque tiene bordado o estampado.");
            }
        }

        var avance = await ObtenerAvanceDiseno(id) ?? new AvanceAreaProyecto
        {
            IdProyecto = id,
            IdAreaProduccion = DisenoAreaId
        };

        if (EsAreaCompletada(avance))
        {
            return BadRequest("El área de Diseño ya fue completada.");
        }

        avance.Estado = EstadoCompletado;
        avance.FechaCompletado = DateTime.UtcNow;
        avance.IdUsuarioCompleto = ObtenerUsuarioActual();
        avance.Observaciones = LimpiarTexto(request.Observaciones);

        if (avance.IdAvanceArea == 0)
        {
            _context.AvanceAreaProyectos.Add(avance);
        }

        await _context.SaveChangesAsync();

        return await ObtenerDiseno(id);
    }

    private async Task<AvanceAreaProyecto?> ObtenerAvanceDiseno(int idProyecto)
    {
        return await _context.AvanceAreaProyectos
            .FirstOrDefaultAsync(x => x.IdProyecto == idProyecto && x.IdAreaProduccion == DisenoAreaId);
    }

    private static bool EsAreaCompletada(AvanceAreaProyecto? avance)
    {
        return string.Equals(avance?.Estado, EstadoCompletado, StringComparison.OrdinalIgnoreCase);
    }

    private static bool EsAreaDiseno(string area)
    {
        if (string.IsNullOrWhiteSpace(area))
        {
            return false;
        }

        var normalized = area.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }

        return sb.ToString().ToLowerInvariant().Contains("diseno");
    }

    private static string? ValidarDiseno(ProyectoDisenoDto request, List<ProyectoPrenda> prendas)
    {
        if (request.Prendas.Count == 0)
        {
            return "Debe enviar al menos una prenda con diseño.";
        }

        foreach (var item in request.Prendas)
        {
            var prenda = prendas.FirstOrDefault(x => x.IdProyectoPrenda == item.IdPrenda);
            if (prenda is null)
            {
                return $"La prenda {item.IdPrenda} no pertenece al proyecto.";
            }

            if (string.IsNullOrWhiteSpace(item.ImagenMockup))
            {
                return $"La prenda {item.IdPrenda} debe incluir un mockup.";
            }

            if ((prenda.TieneBordado || prenda.TieneEstampado) && string.IsNullOrWhiteSpace(item.ImagenLogo))
            {
                return $"La prenda {item.IdPrenda} debe incluir logo porque tiene bordado o estampado.";
            }
        }

        return null;
    }

    private static string FormatearNombreCliente(Cliente? cliente)
    {
        if (cliente is null)
        {
            return "Cliente sin definir";
        }

        if (!string.IsNullOrWhiteSpace(cliente.RazonSocial))
        {
            return cliente.RazonSocial.Trim();
        }

        return $"{cliente.Nombre} {cliente.Apellido}".Trim();
    }

    private int? ObtenerUsuarioActual()
    {
        var claim = User?.Claims?.FirstOrDefault(x =>
            x.Type.EndsWith("nameidentifier", StringComparison.OrdinalIgnoreCase) ||
            x.Type.EndsWith("userid", StringComparison.OrdinalIgnoreCase));

        return int.TryParse(claim?.Value, out var idUsuario) ? idUsuario : null;
    }

    private static string? LimpiarTexto(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
