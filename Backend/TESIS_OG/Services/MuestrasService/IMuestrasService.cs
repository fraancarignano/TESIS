using TESIS_OG.DTOs.Muestras;

namespace TESIS_OG.Services.MuestrasService
{
    public interface IMuestrasService
    {
        Task<MuestraDetalleDTO?> CrearMuestraAsync(MuestraCrearDTO dto);
        Task<List<MuestraDetalleDTO>> ObtenerMuestrasAsync();
        Task<MuestraDetalleDTO?> ObtenerMuestraPorIdAsync(int id);
        Task<MuestraDetalleDTO?> ActualizarMuestraAsync(int id, MuestraActualizarDTO dto);
        Task<bool> EliminarMuestraAsync(int id);
        Task<bool> AsignarMuestraAProyectoAsync(int idMuestra, int idProyecto);
        Task<bool> AceptarMuestraAsync(int idMuestra, string? comentario);
        Task<bool> RechazarMuestraAsync(int idMuestra, string comentario);
        Task<(bool ok, string mensaje)> SincronizarMuestraConDisenoAsync(int idMuestra);
    }
}
