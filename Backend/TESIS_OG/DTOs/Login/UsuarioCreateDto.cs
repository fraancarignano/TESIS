using System.ComponentModel.DataAnnotations;

namespace TESIS_OG.DTOs.Login
{
    public class UsuarioCreateDto
    {
        [Required(ErrorMessage = "El nombre de usuario es obligatorio")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "El nombre debe tener entre 3 y 50 caracteres")]
        public string NombreUsuario { get; set; } = null!;

        [Required(ErrorMessage = "El apellido es obligatorio")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "El apellido debe tener entre 3 y 50 caracteres")]
        public string ApellidoUsuario { get; set; } = null!;

        [Required(ErrorMessage = "El usuario de ingreso es obligatorio")]
        [StringLength(80, MinimumLength = 3, ErrorMessage = "El usuario de ingreso debe tener entre 3 y 80 caracteres")]
        public string UsuarioIngreso { get; set; } = null!;

        [Required(ErrorMessage = "La contrasena es obligatoria")]
        [StringLength(100, MinimumLength = 4, ErrorMessage = "La contrasena debe tener al menos 4 caracteres")]
        public string Contrasena { get; set; } = null!;

        [Required(ErrorMessage = "El rol es obligatorio")]
        public string NombreRol { get; set; } = null!; 
    }
}
