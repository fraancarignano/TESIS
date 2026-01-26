using TESIS_OG.DTOs.Clientes;

namespace TESIS_OG.Services.ClienteService
{
    public interface IClienteService
    {
        Task<ClienteIndexDTO?> CrearClienteAsync(ClienteCreateDTO clienteDto);
        Task<List<ClienteIndexDTO>> ObtenerTodosLosClientesAsync();
        Task<ClienteIndexDTO?> ObtenerClientePorIdAsync(int id);
        Task<ClienteIndexDTO?> ActualizarClienteAsync(int id, ClienteEditDTO clienteDto);
        Task<bool> EliminarClienteAsync(int id);
        Task<List<ClienteIndexDTO>> BuscarClientesAsync(ClienteSearchDTO filtros);
    }
}