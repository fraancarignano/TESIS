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

        [Required(ErrorMessage = "El email es obligatorio")]
        [EmailAddress(ErrorMessage = "El formato del email no es válido")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "La contraseña es obligatoria")]
        [StringLength(100, MinimumLength = 4, ErrorMessage = "La contraseña debe tener al menos 4 caracteres")]
        public string Contraseña { get; set; } = null!;

        [Required(ErrorMessage = "El rol es obligatorio")]
        public string NombreRol { get; set; } = null!; 
    }
}