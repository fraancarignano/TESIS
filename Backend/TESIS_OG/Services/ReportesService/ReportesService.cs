using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;
using TESIS_OG.DTOs.Reportes;

namespace TESIS_OG.Services.ReportesService
{
    public class ReportesService : IReportesService
    {
        private readonly TamarindoDbContext _context;
        private readonly ILogger<ReportesService> _logger;

        public ReportesService(TamarindoDbContext context, ILogger<ReportesService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ReporteClientesTemporadaResponseDTO> ObtenerReporteClientesPorTemporada(ReporteClientesTemporadaRequestDTO request)
        {
            try
            {
                var query = _context.ProyectoPrenda
                    .Include(pp => pp.IdProyectoNavigation)
                        .ThenInclude(p => p.IdClienteNavigation)
                    .AsNoTracking()
                    .AsQueryable();

                if (request.FechaInicio.HasValue)
                    query = query.Where(pp => pp.IdProyectoNavigation.FechaInicio >= request.FechaInicio.Value);

                if (request.FechaFin.HasValue)
                    query = query.Where(pp => pp.IdProyectoNavigation.FechaInicio <= request.FechaFin.Value);

                if (request.IdCliente.HasValue)
                    query = query.Where(pp => pp.IdProyectoNavigation.IdCliente == request.IdCliente.Value);

                var filas = await query
                    .Select(pp => new
                    {
                        pp.IdProyecto,
                        pp.CantidadTotal,
                        pp.IdProyectoNavigation.IdCliente,
                        pp.IdProyectoNavigation.Estado,
                        Cliente = pp.IdProyectoNavigation.IdClienteNavigation.RazonSocial ??
                                  (pp.IdProyectoNavigation.IdClienteNavigation.Nombre + " " + pp.IdProyectoNavigation.IdClienteNavigation.Apellido).Trim(),
                        pp.IdProyectoNavigation.IdClienteNavigation.TipoCliente
                    })
                    .ToListAsync();

                var items = filas
                    .GroupBy(f => new { f.IdCliente, f.Cliente, f.TipoCliente })
                    .Select(g =>
                    {
                        var proyectos = g
                            .GroupBy(p => new { p.IdProyecto, p.Estado })
                            .Select(p => p.Key)
                            .ToList();

                        return new ReporteClientesTemporadaItemDTO
                        {
                            IdCliente = g.Key.IdCliente,
                            Cliente = string.IsNullOrWhiteSpace(g.Key.Cliente) ? "Sin cliente" : g.Key.Cliente,
                            TipoCliente = g.Key.TipoCliente,
                            TotalPrendas = g.Sum(p => p.CantidadTotal),
                            CantidadProyectos = proyectos.Count,
                            ProyectosFinalizados = proyectos.Count(p => p.Estado == "Finalizado"),
                            ProyectosCancelados = proyectos.Count(p => p.Estado == "Cancelado")
                        };
                    })
                    .OrderByDescending(i => i.TotalPrendas)
                    .ThenBy(i => i.Cliente)
                    .ToList();

                return new ReporteClientesTemporadaResponseDTO
                {
                    TotalRegistros = items.Count,
                    FechaGeneracion = DateTime.UtcNow,
                    FiltrosAplicados = request,
                    Items = items
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error al obtener reporte de demanda por cliente. Filtros: fechaInicio={FechaInicio}, fechaFin={FechaFin}, idCliente={IdCliente}",
                    request.FechaInicio,
                    request.FechaFin,
                    request.IdCliente
                );
                throw;
            }
        }
    }
}
