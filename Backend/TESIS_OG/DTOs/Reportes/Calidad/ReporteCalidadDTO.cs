namespace TESIS_OG.DTOs.Reportes.Calidad
{
    public class ReporteCalidadDTO
    {
        public int TotalInspecciones { get; set; }
        public int TotalUnidadesInspeccionadas { get; set; }
        public int InspeccionesAprobadas { get; set; }
        public int InspeccionesObservadas { get; set; }
        public int InspeccionesRechazadas { get; set; }
        public decimal PorcentajeAprobacion { get; set; }
        public List<ResultadoCalidadDTO> DistribucionResultados { get; set; } = new();
        public List<TalleCalidadDTO> DistribucionPorTalle { get; set; } = new();
        public List<CriterioFallaDTO> FallasPorCriterio { get; set; } = new();
        public List<ProyectoCalidadDTO> ResumenPorProyecto { get; set; } = new();
    }

    public class ResultadoCalidadDTO
    {
        public string Resultado { get; set; } = string.Empty;
        public int Cantidad { get; set; }
    }

    public class TalleCalidadDTO
    {
        public string Talle { get; set; } = string.Empty;
        public int Cantidad { get; set; }
    }

    public class CriterioFallaDTO
    {
        public string Criterio { get; set; } = string.Empty;
        public int CantidadFallas { get; set; }
    }

    public class ProyectoCalidadDTO
    {
        public int IdProyecto { get; set; }
        public string NombreProyecto { get; set; } = string.Empty;
        public int TotalInspecciones { get; set; }
        public int UnidadesInspeccionadas { get; set; }
        public int Rechazadas { get; set; }
    }
}

