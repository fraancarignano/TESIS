using System;

namespace TESIS_OG.DTOs.Ubicacion
{
    public class ProyectoUbicacionDTO
    {
        public int IdProyecto { get; set; }
        public string NombreProyecto { get; set; } = string.Empty;
        public string CodigoProyecto { get; set; } = string.Empty;
        public DateTime? FechaIngreso { get; set; }
    }
}
