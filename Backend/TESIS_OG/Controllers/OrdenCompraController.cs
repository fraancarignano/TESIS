using Microsoft.AspNetCore.Mvc;
using TESIS_OG.DTOs.OrdenCompra;
using TESIS_OG.Services.OrdenCompraService;

namespace TESIS_OG.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdenCompraController : ControllerBase
    {
        private readonly IOrdenCompraService _ordenCompraService;

        public OrdenCompraController(IOrdenCompraService ordenCompraService)
        {
            _ordenCompraService = ordenCompraService;
        }

        /// <summary>
        /// Crear una nueva orden de compra
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CrearOrdenCompra([FromBody] OrdenCompraCreateDTO ordenDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Datos inválidos", errors = ModelState });

            var result = await _ordenCompraService.CrearOrdenCompraAsync(ordenDto);

            if (result == null)
                return BadRequest(new { message = "No se pudo crear la orden de compra. Verifique los datos." });

            return CreatedAtAction(nameof(ObtenerOrdenPorId), new { id = result.IdOrdenCompra }, result);
        }

        /// <summary>
        /// Obtener todas las órdenes de compra
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerOrdenes()
        {
            var ordenes = await _ordenCompraService.ObtenerTodasLasOrdenesAsync();
            return Ok(ordenes);
        }

        /// <summary>
        /// Obtener una orden de compra por ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerOrdenPorId(int id)
        {
            var orden = await _ordenCompraService.ObtenerOrdenPorIdAsync(id);

            if (orden == null)
                return NotFound(new { message = $"Orden de compra con ID {id} no encontrada" });

            return Ok(orden);
        }

        /// <summary>
        /// Actualizar una orden de compra existente
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarOrdenCompra(int id, [FromBody] OrdenCompraEditDTO ordenDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Datos inválidos", errors = ModelState });

            var result = await _ordenCompraService.ActualizarOrdenCompraAsync(id, ordenDto);

            if (result == null)
                return BadRequest(new { message = "No se pudo actualizar la orden de compra" });

            return Ok(result);
        }

        /// <summary>
        /// Eliminar una orden de compra
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarOrdenCompra(int id)
        {
            var result = await _ordenCompraService.EliminarOrdenCompraAsync(id);

            if (!result)
                return NotFound(new { message = $"Orden de compra con ID {id} no encontrada" });

            return Ok(new { message = "Orden de compra eliminada exitosamente" });
        }
    }
}