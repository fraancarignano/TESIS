using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TESIS_OG.Models
{
    [Table("ProyectoAuditoria")]
    public class ProyectoAuditoria
    {
        [Key]
        [Column("id_Auditoria")]
        public int IdAuditoria { get; set; }

        [Column("id_Proyecto")]
        public int IdProyecto { get; set; }

        [Column("id_Usuario")]
        public int? IdUsuario { get; set; }

        [Column("fecha_Hora_Cambio")]
        public DateTime FechaHoraCambio { get; set; }

        [Column("tipo_Operacion")]
        [MaxLength(50)]
        public string TipoOperacion { get; set; } = null!;

        [Column("estado_Anterior")]
        [MaxLength(50)]
        public string? EstadoAnterior { get; set; }

        [Column("estado_Nuevo")]
        [MaxLength(50)]
        public string? EstadoNuevo { get; set; }

        [Column("campo_Modificado")]
        [MaxLength(100)]
        public string? CampoModificado { get; set; }

        [Column("valor_Anterior")]
        [MaxLength(500)]
        public string? ValorAnterior { get; set; }

        [Column("valor_Nuevo")]
        [MaxLength(500)]
        public string? ValorNuevo { get; set; }

        [Column("descripcion")]
        [MaxLength(1000)]
        public string? Descripcion { get; set; }

        [Column("direccion_IP")]
        [MaxLength(50)]
        public string? DireccionIP { get; set; }

        // Navegación
        [ForeignKey("IdProyecto")]
        public virtual Proyecto? Proyecto { get; set; }

        [ForeignKey("IdUsuario")]
        public virtual Usuario? Usuario { get; set; }
    }
}