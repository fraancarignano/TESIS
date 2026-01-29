using Microsoft.AspNetCore.Mvc;
using TESIS_OG.DTOs.Clientes;
using TESIS_OG.Services.ClienteService;

namespace TESIS_OG.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClienteController : ControllerBase
    {
        private readonly IClienteService _clienteService;

        public ClienteController(IClienteService clienteService)
        {
            _clienteService = clienteService;
        }

        /// <summary>
        /// Crear un nuevo cliente
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CrearCliente([FromBody] ClienteCreateDTO clienteDto)
        {
            var result = await _clienteService.CrearClienteAsync(clienteDto);

            if (result == null)
                return BadRequest(new { message = "No se pudo crear el cliente" });

            return CreatedAtAction(nameof(ObtenerClientePorId), new { id = result.IdCliente }, result);
        }

        /// <summary>
        /// Obtener todos los clientes
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerClientes()
        {
            var clientes = await _clienteService.ObtenerTodosLosClientesAsync();
            return Ok(clientes);
        }

        /// <summary>
        /// Obtener un cliente por ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerClientePorId(int id)
        {
            var cliente = await _clienteService.ObtenerClientePorIdAsync(id);

            if (cliente == null)
                return NotFound(new { message = $"Cliente con ID {id} no encontrado" });

            return Ok(cliente);
        }

        /// <summary>
        /// Actualizar un cliente existente
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarCliente(int id, [FromBody] ClienteEditDTO clienteDto)
        {
            var result = await _clienteService.ActualizarClienteAsync(id, clienteDto);

            if (result == null)
                return BadRequest(new { message = "No se pudo actualizar el cliente" });

            return Ok(result);
        }

        /// <summary>
        /// Eliminar un cliente
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarCliente(int id)
        {
            var result = await _clienteService.EliminarClienteAsync(id);

            if (!result)
                return NotFound(new { message = $"Cliente con ID {id} no encontrado" });

            return Ok(new { message = "Cliente eliminado exitosamente" });
        }

        /// <summary>
        /// Buscar clientes con filtros
        /// </summary>
        [HttpPost("buscar")]
        public async Task<IActionResult> BuscarClientes([FromBody] ClienteSearchDTO filtros)
        {
            var clientes = await _clienteService.BuscarClientesAsync(filtros);
            return Ok(clientes);
        }
    }
}