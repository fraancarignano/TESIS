using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tesis.Models;

[Table("PrendaTalle")]
public class PrendaTalle
{
    [Key]
    [Column("id_PrendaTalle")]
    public int IdPrendaTalle { get; set; }

    [Column("id_ProyectoPrenda")]
    public int IdProyectoPrenda { get; set; }

    [Column("id_Talle")]
    public int IdTalle { get; set; }

    [Column("cantidad")]
    public int Cantidad { get; set; }
}
