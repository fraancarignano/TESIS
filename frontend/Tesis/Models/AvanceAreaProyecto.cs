using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tesis.Models;

[Table("AvanceAreaProyecto")]
public class AvanceAreaProyecto
{
    [Key]
    [Column("id_AvanceArea")]
    public int IdAvanceArea { get; set; }

    [Column("id_Proyecto")]
    public int IdProyecto { get; set; }

    [Column("id_AreaProduccion")]
    public int IdAreaProduccion { get; set; }

    [Column("estado")]
    [MaxLength(50)]
    public string Estado { get; set; } = "Pendiente";

    [Column("id_Usuario_Completo")]
    public int? IdUsuarioCompleto { get; set; }

    [Column("fecha_Completado")]
    public DateTime? FechaCompletado { get; set; }

    [Column("observaciones")]
    [MaxLength(1000)]
    public string? Observaciones { get; set; }
}
