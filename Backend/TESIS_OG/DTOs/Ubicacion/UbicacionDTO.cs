using System;

namespace TESIS_OG.DTOs.Ubicacion
{
    public class UbicacionDTO
    {
        public int IdUbicacion { get; set; }
        public string Codigo { get; set; } = null!;
        public int Rack { get; set; }
        public int Division { get; set; }
        public int Espacio { get; set; }
        public string? Descripcion { get; set; }
    }

    public class UbicacionCreateDTO
    {
        public string Codigo { get; set; } = null!;
        public int Rack { get; set; }
        public int Division { get; set; }
        public int Espacio { get; set; }
        public string? Descripcion { get; set; }
    }

    public class UbicacionEditDTO
    {
        public string Codigo { get; set; } = null!;
        public int Rack { get; set; }
        public int Division { get; set; }
        public int Espacio { get; set; }
        public string? Descripcion { get; set; }
    }
}
