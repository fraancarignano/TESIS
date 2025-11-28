namespace TESIS_OG.DTOs.Login
{
    public class LoginResponseDTO
    {
        public string Token { get; set; } = null!;
        public int IdUsuario { get; set; }
        public string NombreCompleto { get; set; } = null!;
        public string Email { get; set; } = null!;
        //public string Rol { get; set; } = null!;
       // public int IdRol { get; set; }
    }
}
