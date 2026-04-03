using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tesis.Models;

[Table("Talle")]
public class Talle
{
    [Key]
    [Column("id_Talle")]
    public int IdTalle { get; set; }

    [Column("nombre_Talle")]
    [MaxLength(50)]
    public string NombreTalle { get; set; } = string.Empty;
}
