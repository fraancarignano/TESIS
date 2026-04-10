using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TESIS_OG.Models
{
    [Table("SolicitudMaterialProyecto")]
    public class SolicitudMaterialProyecto
    {
        [Key]
        [Column("id_Solicitud")]
        public int IdSolicitud { get; set; }

        [Column("id_Proyecto")]
        public int IdProyecto { get; set; }

        [Column("nombre_Proyecto")]
        public string NombreProyecto { get; set; } = null!;

        [Column("id_TipoInsumo")]
        public int? IdTipoInsumo { get; set; }

        [Column("nombre_TipoInsumo")]
        public string? NombreTipoInsumo { get; set; }

        [Column("color_Solicitado")]
        public string? ColorSolicitado { get; set; }

        [Column("cantidad_Estimada")]
        public decimal? CantidadEstimada { get; set; }

        [Column("unidad_Medida")]
        public string? UnidadMedida { get; set; }

        [Column("mensaje")]
        public string? Mensaje { get; set; }

        [Column("estado")]
        public string Estado { get; set; } = "Pendiente";

        [Column("id_Usuario_Emisor")]
        public int IdUsuarioEmisor { get; set; }

        [Column("fecha_Solicitud")]
        public DateOnly FechaSolicitud { get; set; }

        [Column("fecha_Atendida")]
        public DateOnly? FechaAtendida { get; set; }

        [Column("id_Usuario_Atiende")]
        public int? IdUsuarioAtiende { get; set; }

        [ForeignKey("IdProyecto")]
        public virtual Proyecto? IdProyectoNavigation { get; set; }

        [ForeignKey("IdUsuarioEmisor")]
        public virtual Usuario? IdUsuarioEmisorNavigation { get; set; }
    }
}
