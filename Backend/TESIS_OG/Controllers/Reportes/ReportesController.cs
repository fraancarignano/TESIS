using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;
using TESIS_OG.DTOs.Reportes.Inventario;

namespace TESIS_OG.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class ReportesController : ControllerBase
  {
    private readonly TamarindoDbContext _context;

    public ReportesController(TamarindoDbContext context)
    {
      _context = context;
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
        // Ejecutar el stored procedure (ahora devuelve TODOS los insumos)
        var todosLosInsumos = await _context.Database
            .SqlQueryRaw<InventarioCriticoDTO>("EXEC sp_ReporteInventarioCritico")
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
                .Where(i => i.Estado == "Pulenta" || i.Estado == "En uso")
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
  }
}
