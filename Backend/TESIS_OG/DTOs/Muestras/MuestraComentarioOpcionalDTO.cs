using System.ComponentModel.DataAnnotations;

namespace TESIS_OG.DTOs.Muestras
{
    public class MuestraComentarioOpcionalDTO
    {
        [StringLength(500)]
        public string? Comentario { get; set; }
    }
}
