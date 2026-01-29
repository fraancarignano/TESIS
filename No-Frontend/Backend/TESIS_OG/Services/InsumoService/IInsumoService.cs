using TESIS_OG.DTOs.Insumos;

namespace TESIS_OG.Services.InsumoService
{
  public interface IInsumoService
  {
    Task<InsumoIndexDTO?> CrearInsumoAsync(InsumoCreateDTO insumoDto);
    Task<List<InsumoIndexDTO>> ObtenerTodosLosInsumosAsync();
    Task<InsumoIndexDTO?> ObtenerInsumoPorIdAsync(int id);
    Task<InsumoIndexDTO?> ActualizarInsumoAsync(int id, InsumoEditDTO insumoDto);
    Task<bool> EliminarInsumoAsync(int id);
    Task<List<InsumoIndexDTO>> BuscarInsumosAsync(InsumoSearchDTO filtros);
    Task<bool> CambiarEstadoAsync(int id, string nuevoEstado);
  }
}
