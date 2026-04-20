using System;
using System.Collections.Generic;

namespace TESIS_OG.DTOs.Proyectos
{
    public class ProyectoResumenDisenoDTO
    {
        public int IdProyecto { get; set; }
        public string Cliente { get; set; } = null!;
        public string NombreProyecto { get; set; } = null!;
        public string? Prioridad { get; set; }
        public DateOnly? FechaInicio { get; set; }
        public DateOnly? FechaFin { get; set; }
        public bool AreaCompletada { get; set; }
        public string EstadoArea { get; set; } = null!;
        public int? IdMuestra { get; set; }
        public string? NombreMuestra { get; set; }
        public List<ProyectoResumenDisenoPrendaDTO> Prendas { get; set; } = new();
    }

    public class ProyectoResumenDisenoPrendaDTO
    {
        public int IdProyectoPrenda { get; set; }
        public string TipoPrenda { get; set; } = null!;
        public string? MaterialBase { get; set; }
        public int CantidadTotal { get; set; }
        public bool TieneBordado { get; set; }
        public bool TieneEstampado { get; set; }
        public string? DescripcionDiseno { get; set; }
        public List<ProyectoResumenDisenoTalleDTO> Talles { get; set; } = new();
    }

    public class ProyectoResumenDisenoTalleDTO
    {
        public int IdTalle { get; set; }
        public string NombreTalle { get; set; } = null!;
        public int Cantidad { get; set; }
    }

    public class ProyectoDisenoDetalleDTO
    {
        public int IdProyecto { get; set; }
        public bool Completado { get; set; }
        public string EstadoArea { get; set; } = null!;
        public DateTime? FechaCompletado { get; set; }
        public string? ObservacionesGenerales { get; set; }
        public List<ProyectoDisenoDetallePrendaDTO> Prendas { get; set; } = new();
    }

    public class ProyectoDisenoDetallePrendaDTO
    {
        public int IdDiseno { get; set; }
        public int IdPrenda { get; set; }
        public string? ImagenLogo { get; set; }
        public string? DescripcionLogo { get; set; }
        public string? ImagenMockup { get; set; }
        public string? DescripcionMockup { get; set; }
        public string? ImagenBordado { get; set; }
        public string? DescripcionBordado { get; set; }
        public string? ImagenEstampado { get; set; }
        public string? DescripcionEstampado { get; set; }
    }

    public class ProyectoDisenoPayloadDTO
    {
        public List<ProyectoDisenoPayloadPrendaDTO> Prendas { get; set; } = new();
        public string? ObservacionesGenerales { get; set; }
    }

    public class ProyectoDisenoPayloadPrendaDTO
    {
        public int IdPrenda { get; set; }
        public string? ImagenLogo { get; set; }
        public string? DescripcionLogo { get; set; }
        public string? ImagenMockup { get; set; }
        public string? DescripcionMockup { get; set; }
        public string? ImagenBordado { get; set; }
        public string? DescripcionBordado { get; set; }
        public string? ImagenEstampado { get; set; }
        public string? DescripcionEstampado { get; set; }
    }
}
