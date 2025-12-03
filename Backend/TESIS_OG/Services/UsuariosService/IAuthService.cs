using TESIS_OG.DTOs.Login;

namespace TESIS_OG.Services.UsuariosService
{
    public interface IAuthService
    {
        Task<LoginResponseDTO?> LoginAsync(LoginDTO loginDto);
        Task<LoginResponseDTO?> RegistrarUsuarioAsync(UsuarioCreateDto usuarioDto);
        Task<List<UsuarioListDTO>> ObtenerTodosLosUsuariosAsync();  
        Task<LoginResponseDTO?> ObtenerUsuarioPorIdAsync(int id);
        string GenerateJwtToken(int idUsuario, string nombreUsuario);
    }
}
