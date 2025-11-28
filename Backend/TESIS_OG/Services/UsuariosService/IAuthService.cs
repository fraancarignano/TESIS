using TESIS_OG.DTOs.Login;

namespace TESIS_OG.Services.UsuariosService
{
    public interface IAuthService
    {
        Task<LoginResponseDTO?> LoginAsync(LoginDTO loginDto);
        string GenerateJwtToken(int idUsuario, string nombreUsuario);
    }
}
