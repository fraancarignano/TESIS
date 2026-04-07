using System.ComponentModel.DataAnnotations;

namespace TESIS_OG.DTOs.Muestras
{
    public class MuestraComentarioDTO
    {
        [Required(ErrorMessage = "El comentario es obligatorio")]
        [StringLength(500)]
        public string Comentario { get; set; } = null!;
    }
}
