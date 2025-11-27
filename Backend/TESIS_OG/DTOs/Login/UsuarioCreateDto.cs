namespace TESIS_OG.DTOs.Login
{
    public class UsuarioCreateDto
    {
        public string NombreUsuario { get; set; } = null!;
        public string ApellidoUsuario { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Contraseña { get; set; } = null!;
        //public int IdRol { get; set; }
    }
}
