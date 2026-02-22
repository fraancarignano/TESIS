using Microsoft.AspNetCore.Mvc;
using TESIS_OG.DTOs.Ubicacion;
using TESIS_OG.Services.UbicacionService;

namespace TESIS_OG.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UbicacionController : ControllerBase
    {
        private readonly IUbicacionService _ubicacionService;

        public UbicacionController(IUbicacionService ubicacionService)
        {
            _ubicacionService = ubicacionService;
        }

        [HttpPost]
        public async Task<IActionResult> CrearUbicacion([FromBody] UbicacionCreateDTO dto)
        {
            var result = await _ubicacionService.CrearUbicacionAsync(dto);
            if (result == null)
                return BadRequest(new { message = "No se pudo crear la ubicación. El código puede estar duplicado." });

            return CreatedAtAction(nameof(ObtenerUbicacionPorId), new { id = result.IdUbicacion }, result);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerUbicaciones()
        {
            var result = await _ubicacionService.ObtenerTodasLasUbicacionesAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerUbicacionPorId(int id)
        {
            var result = await _ubicacionService.ObtenerUbicacionPorIdAsync(id);
            if (result == null)
                return NotFound(new { message = $"Ubicación con ID {id} no encontrada" });

            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarUbicacion(int id, [FromBody] UbicacionEditDTO dto)
        {
            var result = await _ubicacionService.ActualizarUbicacionAsync(id, dto);
            if (result == null)
                return BadRequest(new { message = "No se pudo actualizar la ubicación. Verifique si el código ya existe." });

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarUbicacion(int id)
        {
            var result = await _ubicacionService.EliminarUbicacionAsync(id);
            if (!result)
                return BadRequest(new { message = "No se pudo eliminar la ubicación. Verifique que no esté en uso por algún insumo." });

            return Ok(new { message = "Ubicación eliminada exitosamente" });
        }

        [HttpGet("{id}/insumos")]
        public async Task<IActionResult> ObtenerInsumosPorUbicacion(int id)
        {
            var result = await _ubicacionService.ObtenerInsumosPorUbicacionAsync(id);
            return Ok(result);
        }

        [HttpPost("transfer")]
        public async Task<IActionResult> TransferirDesdeOrden([FromBody] InsumoTransferDTO transferDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Datos inválidos", errors = ModelState });

            var result = await _ubicacionService.TransferirInsumosDesdeOrdenAsync(transferDto);

            if (!result)
                return BadRequest(new { message = "No se pudo realizar la transferencia. Verifique que la ubicación y la orden existan." });

            return Ok(new { message = "Transferencia realizada con éxito" });
        }
    }
}
