namespace TESIS_OG.DTOs.Login
{
    public class UsuarioListDTO
    {
        public int IdUsuario { get; set; }
        public string NombreUsuario { get; set; } = null!;
        public string ApellidoUsuario { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string NombreRol { get; set; } = null!;  
        public string Estado { get; set; } = null!;
        public DateOnly FechaCreacion { get; set; }
        public DateOnly? UltimoAcceso { get; set; }
    }
}