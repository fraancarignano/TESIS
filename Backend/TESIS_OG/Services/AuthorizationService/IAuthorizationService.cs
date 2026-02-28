namespace TESIS_OG.Services.AuthorizationService
{
    public interface IAuthorizationService
    {
        Task<bool> TienePermiso(int idUsuario, string modulo, string accion);
        Task<bool> PuedeEditarArea(int idUsuario, string area);
        Task<List<string>> ObtenerAreasUsuario(int idUsuario);
    }
}
