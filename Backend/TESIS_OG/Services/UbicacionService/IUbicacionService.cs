using TESIS_OG.DTOs.Ubicacion;
using TESIS_OG.DTOs.Insumos;

namespace TESIS_OG.Services.UbicacionService
{
    public interface IUbicacionService
    {
        Task<UbicacionDTO?> CrearUbicacionAsync(UbicacionCreateDTO ubicacionDto);
        Task<List<UbicacionDTO>> ObtenerTodasLasUbicacionesAsync();
        Task<UbicacionDTO?> ObtenerUbicacionPorIdAsync(int id);
        Task<UbicacionDTO?> ActualizarUbicacionAsync(int id, UbicacionEditDTO ubicacionDto);
        Task<bool> EliminarUbicacionAsync(int id);
        Task<List<InsumoIndexDTO>> ObtenerInsumosPorUbicacionAsync(int idUbicacion);
        Task<bool> TransferirInsumosDesdeOrdenAsync(InsumoTransferDTO transferDto);
    }
}
