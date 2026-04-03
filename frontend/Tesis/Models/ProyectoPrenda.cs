using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tesis.Models;

[Table("ProyectoPrenda")]
public class ProyectoPrenda
{
    [Key]
    [Column("id_ProyectoPrenda")]
    public int IdProyectoPrenda { get; set; }

    [Column("id_Proyecto")]
    public int IdProyecto { get; set; }

    [Column("id_TipoPrenda")]
    public int IdTipoPrenda { get; set; }

    [Column("nombre_Prenda")]
    [MaxLength(150)]
    public string? NombrePrenda { get; set; }

    [Column("material_Base")]
    [MaxLength(150)]
    public string? MaterialBase { get; set; }

    [Column("cantidad_Total")]
    public int CantidadTotal { get; set; }

    [Column("tiene_Bordado")]
    public bool TieneBordado { get; set; }

    [Column("tiene_Estampado")]
    public bool TieneEstampado { get; set; }

    [Column("descripcion_Diseno")]
    [MaxLength(500)]
    public string? DescripcionDiseno { get; set; }
}
