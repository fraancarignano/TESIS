using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tesis.Models;

[Table("Proyecto")]
public class Proyecto
{
    [Key]
    [Column("id_Proyecto")]
    public int IdProyecto { get; set; }

    [Column("id_Cliente")]
    public int IdCliente { get; set; }

    [Column("nombre_Proyecto")]
    [MaxLength(200)]
    public string NombreProyecto { get; set; } = string.Empty;

    [Column("prioridad")]
    [MaxLength(50)]
    public string? Prioridad { get; set; }

    [Column("estado")]
    [MaxLength(50)]
    public string? Estado { get; set; }

    [Column("fecha_Inicio")]
    public DateTime? FechaInicio { get; set; }

    [Column("fecha_Fin")]
    public DateTime? FechaFin { get; set; }
}
