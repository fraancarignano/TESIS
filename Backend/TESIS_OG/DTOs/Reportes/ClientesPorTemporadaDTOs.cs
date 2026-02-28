namespace TESIS_OG.DTOs.Reportes
{
    public class ReporteClientesTemporadaRequestDTO
    {
        public int? AnioInicio { get; set; }
        public int? AnioFin { get; set; }
        public int? IdCliente { get; set; }
        public string? Temporada { get; set; }
    }

    public class ReporteClientesTemporadaItemDTO
    {
        public int IdCliente { get; set; }
        public string? Cliente { get; set; }
        public string? TipoCliente { get; set; }
        public int Anio { get; set; }
        public string? Temporada { get; set; }
        public int CantidadProyectos { get; set; }
        public int TotalPrendas { get; set; }
        public int ProyectosFinalizados { get; set; }
        public int ProyectosCancelados { get; set; }
    }

    public class ReporteClientesTemporadaResponseDTO
    {
        public int TotalRegistros { get; set; }
        public DateTime FechaGeneracion { get; set; }
        public ReporteClientesTemporadaRequestDTO FiltrosAplicados { get; set; } = new();
        public List<ReporteClientesTemporadaItemDTO> Items { get; set; } = new();
    }
}
