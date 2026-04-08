using System;
using System.Collections.Generic;

namespace TESIS_OG.DTOs.Muestras
{
    public class MuestraDetalleDTO
    {
        public int IdMuestra { get; set; }
        public int IdCliente { get; set; }
        public string? NombreCliente { get; set; }
        public string NombreMuestra { get; set; } = null!;
        public string? Descripcion { get; set; }
        public string? Prioridad { get; set; }
        public string Estado { get; set; } = null!;
        public DateOnly FechaCreacion { get; set; }
        public DateOnly? FechaEntrega { get; set; }
        public int? IdUsuarioEncargado { get; set; }
        public string? CodigoMuestra { get; set; }
        public int? IdProyectoAsignado { get; set; }

        public string? MockupUrl { get; set; }
        public bool BordadoRequerido { get; set; }
        public string? BordadoDescripcion { get; set; }
        public string? BordadoReferencia { get; set; }
        public bool EstampadoRequerido { get; set; }
        public string? EstampadoDescripcion { get; set; }
        public string? EstampadoReferencia { get; set; }
        public string? OtrosDetalle { get; set; }
        public string? PaletaRgb { get; set; }

        public List<MuestraPrendaDTO> Prendas { get; set; } = new();
        public List<MuestraHistorialDTO> Historial { get; set; } = new();
    }

    public class MuestraPrendaDTO
    {
        public int IdMuestraPrenda { get; set; }
        public int IdTipoPrenda { get; set; }
        public string? NombrePrenda { get; set; }
        public int IdTipoInsumoMaterial { get; set; }
        public string? NombreMaterial { get; set; }
        public string? ColorTela { get; set; }
        public bool TieneBordado { get; set; }
        public bool TieneEstampado { get; set; }
        public string? DescripcionDiseno { get; set; }
    }

    public class MuestraHistorialDTO
    {
        public int IdHistorial { get; set; }
        public DateTime Fecha { get; set; }
        public string Tipo { get; set; } = null!;
        public string Comentario { get; set; } = null!;
        public int? IdUsuario { get; set; }
        public string? NombreUsuario { get; set; }
    }
}
