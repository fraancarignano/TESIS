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
        Task<List<ProyectoUbicacionDTO>> ObtenerProyectosPorUbicacionAsync(int idUbicacion);
        Task<List<ScrapUbicacionDTO>> ObtenerScrapsPorUbicacionAsync(int idUbicacion);
        Task<List<InventarioScrapDTO>> ObtenerInventarioScrapGeneralAsync();
        Task<List<ScrapProyectoInsumoDTO>> ObtenerInsumosProyectoParaScrapAsync(int idProyecto);
        Task<List<ScrapProyectoInsumoDTO>> ObtenerScrapsProyectoParaTransferenciaAsync(int idProyecto);
        Task<(bool ok, string? error)> TransferirProyectoAScrapAsync(ScrapTransferDTO transferDto);
        Task<(bool ok, string? error)> TransferirScrapAProyectoAsync(ScrapTransferDTO transferDto);
        Task<(bool ok, string? error)> TransferirInsumosAsync(InsumoTransferDTO transferDto);
        Task<UbicacionDTO?> CambiarEstadoAsync(int id, string nuevoEstado);
    }
}

