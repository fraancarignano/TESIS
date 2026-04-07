using System;
using System.ComponentModel.DataAnnotations;

namespace TESIS_OG.DTOs.Muestras
{
    public class MuestraActualizarDTO
    {
        [StringLength(80)]
        public string? NombreMuestra { get; set; }

        [StringLength(300)]
        public string? Descripcion { get; set; }

        [StringLength(10)]
        public string? Prioridad { get; set; }

        [StringLength(20)]
        public string? Estado { get; set; }

        public DateOnly? FechaEntrega { get; set; }

        public int? IdUsuarioEncargado { get; set; }

        [StringLength(500)]
        public string? MockupUrl { get; set; }

        public bool? BordadoRequerido { get; set; }

        [StringLength(400)]
        public string? BordadoDescripcion { get; set; }

        [StringLength(500)]
        public string? BordadoReferencia { get; set; }

        public bool? EstampadoRequerido { get; set; }

        [StringLength(400)]
        public string? EstampadoDescripcion { get; set; }

        [StringLength(500)]
        public string? EstampadoReferencia { get; set; }

        [StringLength(500)]
        public string? OtrosDetalle { get; set; }

        [StringLength(50)]
        public string? PaletaRgb { get; set; }

        public int? IdProyectoAsignado { get; set; }

        [StringLength(500)]
        public string? ComentarioActualizacion { get; set; }
    }
}
