using TESIS_OG.DTOs.Reportes;

namespace TESIS_OG.Services.ReportesService
{
    public interface IReportesService
    {
        Task<ReporteClientesTemporadaResponseDTO> ObtenerReporteClientesPorTemporada(ReporteClientesTemporadaRequestDTO request);
    }
}
