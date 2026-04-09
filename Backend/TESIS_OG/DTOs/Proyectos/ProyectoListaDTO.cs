using System;
using System.Collections.Generic;

namespace TESIS_OG.DTOs.Proyectos
{
    /// <summary>
    /// DTO liviano para listados de proyectos (sin materiales ni talles).
    /// </summary>
    public class ProyectoListaDTO
    {
        public int IdProyecto { get; set; }
        public int IdCliente { get; set; }
        public string? ClienteNombre { get; set; }
        public string NombreProyecto { get; set; } = null!;
        public string? TipoPrenda { get; set; }
        public string? Descripcion { get; set; }
        public string? Prioridad { get; set; }
        public string Estado { get; set; } = null!;
        public DateOnly FechaInicio { get; set; }
        public DateOnly? FechaFin { get; set; }
        public int? CantidadTotal { get; set; }
        public int? CantidadProducida { get; set; }
        public int? IdUsuarioEncargado { get; set; }
        public string? NombreEncargado { get; set; }
        public string? TipoEstacion { get; set; }
        public string? CodigoProyecto { get; set; }
        public string? AreaActual { get; set; }

        // Avances (0-100)
        public int? AvanceDiseno { get; set; }
        public int? AvanceCorte { get; set; }
        public int? AvanceConfeccion { get; set; }
        public int? AvanceCalidadPrenda { get; set; }
        public int? AvanceEtiquetadoEmpaquetado { get; set; }

        public decimal? CostoMaterialEstimado { get; set; }
        public decimal? ScrapTotal { get; set; }
        public decimal? ScrapPorcentaje { get; set; }

        public List<ProyectoPrendaResumenDTO> Prendas { get; set; } = new();
    }

    public class ProyectoPrendaResumenDTO
    {
        public int IdProyectoPrenda { get; set; }
        public int IdTipoPrenda { get; set; }
        public string? NombrePrenda { get; set; }
    }
}
