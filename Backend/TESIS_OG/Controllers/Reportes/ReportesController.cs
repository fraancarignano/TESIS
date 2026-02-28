using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.RegularExpressions;
using TESIS_OG.Data;
using TESIS_OG.DTOs.Reportes;
using TESIS_OG.DTOs.Reportes.Calidad;
using TESIS_OG.DTOs.Reportes.Inventario;
using TESIS_OG.Security;
using TESIS_OG.Services.ReportesService;

namespace TESIS_OG.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [RequiresPermission("Reportes", "Ver")]
  public class ReportesController : ControllerBase
  {
    private readonly TamarindoDbContext _context;
    private readonly IReportesService _reportesService;
    private readonly ILogger<ReportesController> _logger;

    public ReportesController(
      TamarindoDbContext context,
      IReportesService reportesService,
      ILogger<ReportesController> logger)
    {
      _context = context;
      _reportesService = reportesService;
      _logger = logger;
    }

    [HttpGet("calidad")]
    public async Task<ActionResult<ReporteCalidadDTO>> ReporteCalidad(
      int? idProyecto,
      DateOnly? fechaInicio,
      DateOnly? fechaFin)
    {
      try
      {
        var query = _context.ObservacionProyectos
          .Include(o => o.IdProyectoNavigation)
          .Where(o => o.Descripcion.Contains("[CONTROL_CALIDAD]"));

        if (idProyecto.HasValue)
          query = query.Where(o => o.IdProyecto == idProyecto.Value);

        if (fechaInicio.HasValue)
        {
          var inicio = fechaInicio.Value.ToDateTime(TimeOnly.MinValue);
          query = query.Where(o => o.Fecha >= inicio);
        }

        if (fechaFin.HasValue)
        {
          var fin = fechaFin.Value.ToDateTime(TimeOnly.MaxValue);
          query = query.Where(o => o.Fecha <= fin);
        }

        var observaciones = await query.ToListAsync();

        var resultadoCount = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var tallesCount = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var fallasCount = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var proyectosMap = new Dictionary<int, ProyectoCalidadDTO>();

        var totalUnidades = 0;
        var aprobadas = 0;
        var observadas = 0;
        var rechazadas = 0;

        foreach (var obs in observaciones)
        {
          var descripcion = obs.Descripcion ?? string.Empty;
          var resultado = ExtraerResultadoCalidad(descripcion);
          var lote = ExtraerLote(descripcion);
          var talles = ExtraerTalles(descripcion);
          var fallas = ExtraerFallas(descripcion);

          totalUnidades += lote;

          if (resultado.Equals("APROBADA", StringComparison.OrdinalIgnoreCase)) aprobadas++;
          else if (resultado.Equals("OBSERVADA", StringComparison.OrdinalIgnoreCase)) observadas++;
          else if (resultado.Equals("RECHAZADA", StringComparison.OrdinalIgnoreCase)) rechazadas++;

          if (!resultadoCount.ContainsKey(resultado)) resultadoCount[resultado] = 0;
          resultadoCount[resultado]++;

          foreach (var talle in talles)
          {
            if (!tallesCount.ContainsKey(talle.Key)) tallesCount[talle.Key] = 0;
            tallesCount[talle.Key] += talle.Value;
          }

          foreach (var falla in fallas)
          {
            if (!fallasCount.ContainsKey(falla)) fallasCount[falla] = 0;
            fallasCount[falla]++;
          }

          if (!proyectosMap.ContainsKey(obs.IdProyecto))
          {
            proyectosMap[obs.IdProyecto] = new ProyectoCalidadDTO
            {
              IdProyecto = obs.IdProyecto,
              NombreProyecto = obs.IdProyectoNavigation?.NombreProyecto ?? $"Proyecto {obs.IdProyecto}",
              TotalInspecciones = 0,
              UnidadesInspeccionadas = 0,
              Rechazadas = 0
            };
          }

          var proyectoDto = proyectosMap[obs.IdProyecto];
          proyectoDto.TotalInspecciones++;
          proyectoDto.UnidadesInspeccionadas += lote;
          if (resultado.Equals("RECHAZADA", StringComparison.OrdinalIgnoreCase))
            proyectoDto.Rechazadas++;
        }

        var totalInspecciones = observaciones.Count;
        var porcentajeAprobacion = totalInspecciones > 0
          ? Math.Round((decimal)aprobadas / totalInspecciones * 100m, 2)
          : 0m;

        var reporte = new ReporteCalidadDTO
        {
          TotalInspecciones = totalInspecciones,
          TotalUnidadesInspeccionadas = totalUnidades,
          InspeccionesAprobadas = aprobadas,
          InspeccionesObservadas = observadas,
          InspeccionesRechazadas = rechazadas,
          PorcentajeAprobacion = porcentajeAprobacion,
          DistribucionResultados = resultadoCount
            .Select(x => new ResultadoCalidadDTO { Resultado = x.Key, Cantidad = x.Value })
            .OrderByDescending(x => x.Cantidad)
            .ToList(),
          DistribucionPorTalle = tallesCount
            .Select(x => new TalleCalidadDTO { Talle = x.Key, Cantidad = x.Value })
            .OrderByDescending(x => x.Cantidad)
            .ToList(),
          FallasPorCriterio = fallasCount
            .Select(x => new CriterioFallaDTO { Criterio = x.Key, CantidadFallas = x.Value })
            .OrderByDescending(x => x.CantidadFallas)
            .ToList(),
          ResumenPorProyecto = proyectosMap.Values
            .OrderByDescending(p => p.Rechazadas)
            .ThenByDescending(p => p.TotalInspecciones)
            .ToList()
        };

        return Ok(reporte);
      }
      catch (Exception ex)
      {
        return StatusCode(500, new
        {
          message = "Error al generar el reporte de calidad",
          error = ex.Message
        });
      }
    }

    /// <summary>
    /// Obtener reporte de clientes por temporada (SP: sp_ReporteClientesPorTemporada)
    /// </summary>
    /// <param name="anioInicio">Año de inicio del filtro (opcional)</param>
    /// <param name="anioFin">Año de fin del filtro (opcional)</param>
    /// <param name="idCliente">ID de cliente específico (opcional)</param>
    /// <param name="temporada">Temporada específica (opcional)</param>
    /// <returns>Listado de clientes por temporada con métricas de proyectos y prendas</returns>
    [HttpGet("clientes-temporada")]
    [ProducesResponseType(typeof(ReporteClientesTemporadaResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ReporteClientesTemporadaResponseDTO>> ObtenerClientesPorTemporada(
      [FromQuery] int? anioInicio,
      [FromQuery] int? anioFin,
      [FromQuery] int? idCliente,
      [FromQuery] string? temporada)
    {
      try
      {
        if (anioInicio.HasValue && anioFin.HasValue && anioInicio > anioFin)
        {
          return BadRequest(new
          {
            message = "El parámetro anioInicio no puede ser mayor que anioFin."
          });
        }

        var request = new ReporteClientesTemporadaRequestDTO
        {
          AnioInicio = anioInicio,
          AnioFin = anioFin,
          IdCliente = idCliente,
          Temporada = temporada
        };

        var response = await _reportesService.ObtenerReporteClientesPorTemporada(request);
        return Ok(response);
      }
      catch (Exception ex)
      {
        _logger.LogError(
          ex,
          "Error en endpoint reporte clientes-temporada. anioInicio={AnioInicio}, anioFin={AnioFin}, idCliente={IdCliente}, temporada={Temporada}",
          anioInicio,
          anioFin,
          idCliente,
          temporada
        );

        return StatusCode(StatusCodes.Status500InternalServerError, new
        {
          message = "Error al generar el reporte de clientes por temporada",
          error = ex.Message
        });
      }
    }

    /// <summary>
    /// Obtener reporte de inventario crítico
    /// MODIFICADO: Ahora devuelve TODOS los insumos
    /// </summary>
    [HttpGet("inventario-critico")]
    public async Task<ActionResult<ResumenInventarioCriticoDTO>> ReporteInventarioCritico()
    {
      try
      {
        // Se calcula desde tabla de insumos para evitar inconsistencias de estados legacy.
        var todosLosInsumos = await _context.Insumos
            .Include(i => i.IdTipoInsumoNavigation)
            .Select(i => new InventarioCriticoDTO
            {
              IdInsumo = i.IdInsumo,
              NombreInsumo = i.NombreInsumo,
              TipoInsumo = i.IdTipoInsumoNavigation.NombreTipo,
              StockActual = i.StockActual,
              StockMinimo = i.StockMinimo ?? 0,
              UnidadMedida = i.UnidadMedida,
              UltimaActualizacion = i.FechaActualizacion.ToDateTime(TimeOnly.MinValue),
              NivelCriticidad =
                i.StockActual <= 0 ? "Agotado" :
                (!i.StockMinimo.HasValue || i.StockMinimo <= 0) ? "Normal" :
                (i.StockActual / i.StockMinimo <= 0.3m) ? "CrÃ­tico" :
                (i.StockActual / i.StockMinimo <= 0.8m) ? "Bajo" :
                (i.StockActual / i.StockMinimo <= 1m) ? "Alerta" :
                "Normal",
              DiasRestantes = null
            })
            .ToListAsync();

        // Obtener total de insumos monitoreados
        var totalMonitoreados = todosLosInsumos.Count;

        // Calcular estadísticas por nivel de criticidad
        var agotados = todosLosInsumos.Count(i => i.NivelCriticidad == "Agotado");
        var criticos = todosLosInsumos.Count(i => i.NivelCriticidad == "Crítico");
        var bajos = todosLosInsumos.Count(i => i.NivelCriticidad == "Bajo");
        var alerta = todosLosInsumos.Count(i => i.NivelCriticidad == "Alerta");
        var normales = todosLosInsumos.Count(i => i.NivelCriticidad == "Normal");

        // Calcular insumos con problemas (no normales)
        var insumosConProblemas = agotados + criticos + bajos + alerta;

        var porcentajeCriticidad = totalMonitoreados > 0
            ? (decimal)insumosConProblemas / totalMonitoreados * 100
            : 0;

        var resumen = new ResumenInventarioCriticoDTO
        {
          TotalInsumosMonitoreados = totalMonitoreados,
          InsumosCriticos = criticos,
          InsumosAgotados = agotados,
          InsumosBajos = bajos,
          InsumosAlerta = alerta,
          PorcentajeCriticidad = Math.Round(porcentajeCriticidad, 2),
          Insumos = todosLosInsumos  // ← Ahora incluye TODOS
        };

        return Ok(resumen);
      }
      catch (Exception ex)
      {
        return StatusCode(500, new
        {
          message = "Error al generar el reporte",
          error = ex.Message
        });
      }
    }

    /// <summary>
    /// Obtener estadísticas resumidas para el dashboard
    /// </summary>
    [HttpGet("dashboard-inventario")]
    public async Task<ActionResult<object>> DashboardInventario()
    {
      try
      {
        // Convertir DateTime a DateOnly para las comparaciones
        var fechaLimite6Meses = DateOnly.FromDateTime(DateTime.Now.AddMonths(-6));
        var fechaLimite3Meses = DateOnly.FromDateTime(DateTime.Now.AddMonths(-3));

        var estadisticas = new
        {
          // Stock crítico por tipo
          stockPorTipo = await _context.Insumos
                .Where(i =>
                  i.Estado == "Disponible" ||
                  i.Estado == "En uso" ||
                  (i.Estado != null && i.Estado.ToLower() == "pulenta"))
                .GroupBy(i => i.IdTipoInsumoNavigation.NombreTipo)
                .Select(g => new
                {
                  Tipo = g.Key,
                  Total = g.Count(),
                  Criticos = g.Count(i => i.StockActual < i.StockMinimo * 0.3m)
                })
                .ToListAsync(),

          // Evolución de stock en el tiempo (últimos 6 meses)
          movimientosRecientes = await _context.InventarioMovimientos
                .Where(m => m.FechaMovimiento >= fechaLimite6Meses)
                .GroupBy(m => new {
                  Año = m.FechaMovimiento.Year,
                  Mes = m.FechaMovimiento.Month
                })
                .Select(g => new
                {
                  Periodo = $"{g.Key.Año}-{g.Key.Mes:00}",
                  Entradas = g.Where(m => m.TipoMovimiento == "Entrada").Sum(m => m.Cantidad),
                  Salidas = g.Where(m => m.TipoMovimiento == "Salida").Sum(m => m.Cantidad)
                })
                .OrderBy(x => x.Periodo)
                .ToListAsync(),

          // Top 10 insumos más usados
          topInsumosUsados = await _context.InventarioMovimientos
                .Where(m => m.TipoMovimiento == "Salida" &&
                           m.FechaMovimiento >= fechaLimite3Meses)
                .GroupBy(m => new {
                  m.IdInsumo,
                  m.IdInsumoNavigation.NombreInsumo
                })
                .Select(g => new
                {
                  Insumo = g.Key.NombreInsumo,
                  CantidadUsada = g.Sum(m => m.Cantidad)
                })
                .OrderByDescending(x => x.CantidadUsada)
                .Take(10)
                .ToListAsync()
        };

        return Ok(estadisticas);
      }
      catch (Exception ex)
      {
        return StatusCode(500, new
        {
          message = "Error al obtener estadísticas",
          error = ex.Message
        });
      }
    }
    /// <summary>
    /// Obtener producción por tipo de prenda (con filtros opcionales)
    /// </summary>
    [HttpGet("produccion-por-prenda")]
    public async Task<ActionResult<List<DTOs.Reportes.ProduccionPorPrendaDTO>>> GetProduccionPorTipoPrenda(
        DateOnly? fechaInicio, DateOnly? fechaFin, int? idCliente, string? nombrePrenda)
    {
        try
        {
            var fin = fechaFin ?? DateOnly.FromDateTime(DateTime.Now);
            var inicio = fechaInicio ?? DateOnly.FromDateTime(DateTime.Now.AddYears(-1));

            var query = _context.ProyectoPrenda
                .Include(pp => pp.IdProyectoNavigation)
                    .ThenInclude(p => p.IdClienteNavigation)
                .Include(pp => pp.IdTipoPrendaNavigation)
                .Where(pp => pp.IdProyectoNavigation.FechaInicio >= inicio &&
                             pp.IdProyectoNavigation.FechaInicio <= fin &&
                             pp.IdProyectoNavigation.Estado != "Cancelado");

            if (idCliente.HasValue)
                query = query.Where(pp => pp.IdProyectoNavigation.IdCliente == idCliente.Value);

            if (!string.IsNullOrEmpty(nombrePrenda))
                query = query.Where(pp => pp.IdTipoPrendaNavigation.NombrePrenda == nombrePrenda);

            var produccion = await query
                .GroupBy(pp => pp.IdTipoPrendaNavigation.NombrePrenda)
                .Select(g => new DTOs.Reportes.ProduccionPorPrendaDTO
                {
                    NombrePrenda = g.Key,
                    CantidadProducida = g.Sum(pp => pp.CantidadTotal)
                })
                .OrderByDescending(x => x.CantidadProducida)
                .ToListAsync();

            return Ok(produccion);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener reporte de producción", error = ex.Message });
        }
    }

    /// <summary>
    /// Evolución temporal de una prenda específica (por mes)
    /// </summary>
    [HttpGet("evolucion-prenda")]
    public async Task<ActionResult<List<object>>> GetEvolucionPrenda(
        string nombrePrenda, DateOnly? fechaInicio, DateOnly? fechaFin, int? idCliente)
    {
        try
        {
            var fin = fechaFin ?? DateOnly.FromDateTime(DateTime.Now);
            var inicio = fechaInicio ?? DateOnly.FromDateTime(DateTime.Now.AddYears(-1));

            var query = _context.ProyectoPrenda
                .Include(pp => pp.IdProyectoNavigation)
                .Include(pp => pp.IdTipoPrendaNavigation)
                .Where(pp => pp.IdTipoPrendaNavigation.NombrePrenda == nombrePrenda &&
                             pp.IdProyectoNavigation.FechaInicio >= inicio &&
                             pp.IdProyectoNavigation.FechaInicio <= fin &&
                             pp.IdProyectoNavigation.Estado != "Cancelado");

            if (idCliente.HasValue)
                query = query.Where(pp => pp.IdProyectoNavigation.IdCliente == idCliente.Value);

            var evolucion = await query
                .GroupBy(pp => new { pp.IdProyectoNavigation.FechaInicio.Year, pp.IdProyectoNavigation.FechaInicio.Month })
                .Select(g => new
                {
                    Año = g.Key.Year,
                    Mes = g.Key.Month,
                    Cantidad = g.Sum(pp => pp.CantidadTotal)
                })
                .OrderBy(x => x.Año).ThenBy(x => x.Mes)
                .ToListAsync();

            return Ok(evolucion);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener evolución", error = ex.Message });
        }
    }

    /// <summary>
    /// Obtener clientes que tienen al menos un proyecto (para filtros)
    /// </summary>
    [HttpGet("clientes-con-proyectos")]
    public async Task<ActionResult<List<object>>> GetClientesConProyectos()
    {
        try
        {
            var clientes = await _context.Proyectos
                .Include(p => p.IdClienteNavigation)
                .Where(p => p.Estado != "Cancelado")
                .Select(p => new
                {
                    p.IdClienteNavigation.IdCliente,
                    Nombre = (p.IdClienteNavigation.RazonSocial != null)
                        ? p.IdClienteNavigation.RazonSocial
                        : (p.IdClienteNavigation.Nombre + " " + p.IdClienteNavigation.Apellido).Trim()
                })
                .Distinct()
                .OrderBy(c => c.Nombre)
                .ToListAsync();

            return Ok(clientes);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener clientes", error = ex.Message });
        }
    }

    /// <summary>
    /// Obtener tipos de prenda usados en proyectos (para filtros)
    /// </summary>
    [HttpGet("tipos-prenda")]
    public async Task<ActionResult<List<string>>> GetTiposPrenda()
    {
        try
        {
            var tipos = await _context.ProyectoPrenda
                .Include(pp => pp.IdTipoPrendaNavigation)
                .Select(pp => pp.IdTipoPrendaNavigation.NombrePrenda)
                .Distinct()
                .OrderBy(n => n)
                .ToListAsync();

            return Ok(tipos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener tipos de prenda", error = ex.Message });
        }
    }

    private static string ExtraerResultadoCalidad(string descripcion)
    {
      var matchCompacto = Regex.Match(descripcion, @"\bres=([A-Z]+)\b", RegexOptions.IgnoreCase);
      if (matchCompacto.Success) return matchCompacto.Groups[1].Value.ToUpperInvariant();

      var matchLegacy = Regex.Match(descripcion, @"Resultado:\s*([A-ZÁÉÍÓÚ]+)", RegexOptions.IgnoreCase);
      if (matchLegacy.Success) return matchLegacy.Groups[1].Value.ToUpperInvariant();

      return "SIN_DATO";
    }

    private static int ExtraerLote(string descripcion)
    {
      var matchCompacto = Regex.Match(descripcion, @"\blot=(\d+)\b", RegexOptions.IgnoreCase);
      if (matchCompacto.Success && int.TryParse(matchCompacto.Groups[1].Value, out var loteCompacto))
      {
        return loteCompacto;
      }

      var matchLegacy = Regex.Match(descripcion, @"Lote inspeccionado:\s*(\d+)", RegexOptions.IgnoreCase);
      if (matchLegacy.Success && int.TryParse(matchLegacy.Groups[1].Value, out var loteLegacy))
      {
        return loteLegacy;
      }

      return 0;
    }

    private static Dictionary<string, int> ExtraerTalles(string descripcion)
    {
      var payload = "";
      var matchCompacto = Regex.Match(descripcion, @"\btj=(\{.*\})", RegexOptions.IgnoreCase);
      if (matchCompacto.Success) payload = matchCompacto.Groups[1].Value;

      if (string.IsNullOrWhiteSpace(payload))
      {
        var matchLegacy = Regex.Match(descripcion, @"TALLES_JSON:\s*(\{.*\})", RegexOptions.IgnoreCase);
        if (matchLegacy.Success) payload = matchLegacy.Groups[1].Value;
      }

      if (string.IsNullOrWhiteSpace(payload))
      {
        return new Dictionary<string, int>();
      }

      try
      {
        var parsed = JsonSerializer.Deserialize<Dictionary<string, int>>(payload);
        return parsed ?? new Dictionary<string, int>();
      }
      catch
      {
        return new Dictionary<string, int>();
      }
    }

    private static List<string> ExtraerFallas(string descripcion)
    {
      var match = Regex.Match(descripcion, @"\bf=([^\s]+)", RegexOptions.IgnoreCase);
      if (!match.Success) return new List<string>();

      var raw = match.Groups[1].Value;
      if (raw == "-") return new List<string>();

      return raw
        .Split('|', StringSplitOptions.RemoveEmptyEntries)
        .Select(x => x.Trim().ToLowerInvariant())
        .Where(x => !string.IsNullOrWhiteSpace(x))
        .ToList();
    }

    /// <summary>
    /// Obtener rotación de un insumo (consumo vs reposición) por mes
    /// </summary>
    [HttpGet("rotacion-insumo")]
    public async Task<ActionResult<List<DTOs.Reportes.RotacionInsumoDTO>>> GetRotacionInsumo(
        int idInsumo, int? anio)
    {
        try
        {
            var anioFiltro = anio ?? DateTime.Now.Year;

            var query = _context.InventarioMovimientos
                .Where(m => m.IdInsumo == idInsumo && m.FechaMovimiento.Year == anioFiltro);

            var movimientos = await query
                .GroupBy(m => m.FechaMovimiento.Month)
                .Select(g => new DTOs.Reportes.RotacionInsumoDTO
                {
                    Año = anioFiltro,
                    Mes = g.Key,
                    Consumo = g.Where(m => m.TipoMovimiento == "Salida").Sum(m => m.Cantidad),
                    Reposicion = g.Where(m => m.TipoMovimiento == "Entrada").Sum(m => m.Cantidad)
                })
                .OrderBy(x => x.Mes)
                .ToListAsync();

            return Ok(movimientos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener rotación del insumo", error = ex.Message });
        }
    }
  }
}
