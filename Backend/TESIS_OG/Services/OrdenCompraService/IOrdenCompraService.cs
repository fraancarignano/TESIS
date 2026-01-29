using TESIS_OG.DTOs.OrdenCompra;

namespace TESIS_OG.Services.OrdenCompraService
{
    public interface IOrdenCompraService
    {
        Task<OrdenCompraIndexDTO?> CrearOrdenCompraAsync(OrdenCompraCreateDTO ordenDto);
        Task<List<OrdenCompraIndexDTO>> ObtenerTodasLasOrdenesAsync();
        Task<OrdenCompraIndexDTO?> ObtenerOrdenPorIdAsync(int id);
        Task<OrdenCompraIndexDTO?> ActualizarOrdenCompraAsync(int id, OrdenCompraEditDTO ordenDto);
        Task<bool> EliminarOrdenCompraAsync(int id);
    }
}