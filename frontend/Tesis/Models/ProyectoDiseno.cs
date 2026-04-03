using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tesis.Models;

[Table("ProyectoDiseño")]
public class ProyectoDiseno
{
    [Key]
    [Column("id_Diseño")]
    public int IdDiseno { get; set; }

    [Column("id_Proyecto")]
    public int IdProyecto { get; set; }

    [Column("id_Prenda")]
    public int IdPrenda { get; set; }

    [Column("imagen_Logo")]
    public string? ImagenLogo { get; set; }

    [Column("descripcion_Logo")]
    [MaxLength(500)]
    public string? DescripcionLogo { get; set; }

    [Column("imagen_Mockup")]
    public string? ImagenMockup { get; set; }

    [Column("descripcion_Mockup")]
    [MaxLength(500)]
    public string? DescripcionMockup { get; set; }

    [Column("id_Usuario_Creacion")]
    public int? IdUsuarioCreacion { get; set; }

    [Column("fecha_Creacion")]
    public DateTime? FechaCreacion { get; set; }

    [Column("id_Usuario_Modificacion")]
    public int? IdUsuarioModificacion { get; set; }

    [Column("fecha_Modificacion")]
    public DateTime? FechaModificacion { get; set; }
}
