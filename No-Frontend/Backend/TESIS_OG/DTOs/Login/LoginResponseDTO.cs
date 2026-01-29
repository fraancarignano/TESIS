namespace TESIS_OG.DTOs.Login
{
    public class LoginResponseDTO
    {
        public int IdUsuario { get; set; }
        public string NombreUsuario { get; set; } = null!;
        public string ApellidoUsuario { get; set; } = null!;
        public string Email { get; set; } = null!;
        public int IdRol { get; set; }
        public string NombreRol { get; set; }
        public string Estado { get; set; } = null!;
        public DateOnly FechaCreacion { get; set; }
        public DateOnly? UltimoAcceso { get; set; }
        public string Token { get; set; }
    }
}