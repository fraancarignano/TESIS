using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tesis.Models;

[Table("Cliente")]
public class Cliente
{
    [Key]
    [Column("id_Cliente")]
    public int IdCliente { get; set; }

    [Column("nombre")]
    [MaxLength(150)]
    public string? Nombre { get; set; }

    [Column("apellido")]
    [MaxLength(150)]
    public string? Apellido { get; set; }

    [Column("razon_Social")]
    [MaxLength(250)]
    public string? RazonSocial { get; set; }
}
