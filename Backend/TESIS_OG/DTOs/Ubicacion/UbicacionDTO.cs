using System;

namespace TESIS_OG.DTOs.Ubicacion
{
    public class UbicacionDTO
    {
        public int IdUbicacion { get; set; }
        public string Codigo { get; set; } = null!;
        public string? Nombre { get; set; }
        public string? Tipo { get; set; }
        public int Rack { get; set; }
        public int Division { get; set; }
        public int Espacio { get; set; }
        public string? Descripcion { get; set; }
        /// <summary>Estado operativo: 'Activa' | 'Ocupado' | 'BloqIN' | 'BloqOUT'</summary>
        public string EstadoUbicacion { get; set; } = "Activa";
    }

    public class UbicacionCreateDTO
    {
        public string Codigo { get; set; } = null!;
        public string? Nombre { get; set; }
        public string? Tipo { get; set; }
        public int Rack { get; set; }
        public int Division { get; set; }
        public int Espacio { get; set; }
        public string? Descripcion { get; set; }
        // Al crear siempre arranca en Activa — no se expone al usuario
    }

    public class UbicacionEditDTO
    {
        public string Codigo { get; set; } = null!;
        public string? Nombre { get; set; }
        public string? Tipo { get; set; }
        public int Rack { get; set; }
        public int Division { get; set; }
        public int Espacio { get; set; }
        public string? Descripcion { get; set; }
    }

    /// <summary>DTO mínimo para el endpoint PATCH /{id}/estado</summary>
    public class UbicacionEstadoDTO
    {
        /// <summary>Valores válidos: 'Activa' | 'Ocupado' | 'BloqIN' | 'BloqOUT'</summary>
        public string EstadoUbicacion { get; set; } = "Activa";
    }
}

