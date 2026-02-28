using Microsoft.Data.SqlClient;
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
                var anioInicioParam = new SqlParameter("@AnioInicio", (object?)request.AnioInicio ?? DBNull.Value);
                var anioFinParam = new SqlParameter("@AnioFin", (object?)request.AnioFin ?? DBNull.Value);
                var idClienteParam = new SqlParameter("@IdCliente", (object?)request.IdCliente ?? DBNull.Value);
                var temporadaParam = new SqlParameter("@Temporada", (object?)request.Temporada ?? DBNull.Value);

                var resultado = await _context.ReporteClientesTemporadaItems
                    .FromSqlRaw(
                        "EXEC sp_ReporteClientesPorTemporada @AnioInicio, @AnioFin, @IdCliente, @Temporada",
                        anioInicioParam,
                        anioFinParam,
                        idClienteParam,
                        temporadaParam
                    )
                    .AsNoTracking()
                    .ToListAsync();

                var items = resultado.Where(r =>
                    !string.IsNullOrEmpty(r.Cliente) &&
                    !string.IsNullOrEmpty(r.Temporada)
                ).ToList();

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
                    "Error al obtener reporte de clientes por temporada. Filtros: anioInicio={AnioInicio}, anioFin={AnioFin}, idCliente={IdCliente}, temporada={Temporada}",
                    request.AnioInicio,
                    request.AnioFin,
                    request.IdCliente,
                    request.Temporada
                );
                throw;
            }
        }
    }
}
