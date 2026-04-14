using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TESIS_OG.DTOs.Muestras;
using TESIS_OG.Services.MuestrasService;

namespace TESIS_OG.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MuestraController : ControllerBase
    {
        private readonly IMuestrasService _muestrasService;
        private readonly ILogger<MuestraController> _logger;

        public MuestraController(IMuestrasService muestrasService, ILogger<MuestraController> logger)
        {
            _muestrasService = muestrasService;
            _logger = logger;
        }

        [HttpPost]
        [ProducesResponseType(typeof(MuestraDetalleDTO), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CrearMuestra([FromBody] MuestraCrearDTO dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var result = await _muestrasService.CrearMuestraAsync(dto);
                if (result == null) return BadRequest(new { message = "No se pudo crear la muestra" });

                return CreatedAtAction(nameof(ObtenerMuestraPorId), new { id = result.IdMuestra }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error de base de datos al crear muestra");
                var errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return BadRequest(new { message = $"Error de integridad en base de datos al crear la muestra: {errorMsg}" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear muestra");
                return StatusCode(500, new { message = "Error interno al crear la muestra" });
            }
        }

        [HttpGet]
        [ProducesResponseType(typeof(List<MuestraDetalleDTO>), StatusCodes.Status200OK)]
        public async Task<IActionResult> ObtenerMuestras()
        {
            try
            {
                var muestras = await _muestrasService.ObtenerMuestrasAsync();
                return Ok(muestras);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener muestras");
                return StatusCode(500, new { message = "Error al obtener muestras" });
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(MuestraDetalleDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObtenerMuestraPorId(int id)
        {
            try
            {
                var muestra = await _muestrasService.ObtenerMuestraPorIdAsync(id);
                if (muestra == null) return NotFound(new { message = $"Muestra con ID {id} no encontrada" });
                return Ok(muestra);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener muestra {IdMuestra}", id);
                return StatusCode(500, new { message = "Error al obtener la muestra" });
            }
        }

        [HttpPut("{id}")]
        [ProducesResponseType(typeof(MuestraDetalleDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ActualizarMuestra(int id, [FromBody] MuestraActualizarDTO dto)
        {
            try
            {
                var result = await _muestrasService.ActualizarMuestraAsync(id, dto);
                if (result == null) return NotFound(new { message = $"Muestra con ID {id} no encontrada" });
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar muestra {IdMuestra}", id);
                return StatusCode(500, new { message = "Error al actualizar la muestra" });
            }
        }

        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> EliminarMuestra(int id)
        {
            try
            {
                var ok = await _muestrasService.EliminarMuestraAsync(id);
                if (!ok) return NotFound(new { message = $"Muestra con ID {id} no encontrada" });
                return Ok(new { message = "Muestra eliminada correctamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar muestra {IdMuestra}", id);
                return StatusCode(500, new { message = "Error al eliminar la muestra" });
            }
        }

        [HttpPut("{id}/asignar-proyecto/{idProyecto}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> AsignarProyecto(int id, int idProyecto)
        {
            try
            {
                var ok = await _muestrasService.AsignarMuestraAProyectoAsync(id, idProyecto);
                if (!ok) return NotFound(new { message = "Muestra no encontrada" });
                return Ok(new { message = "Muestra asignada al proyecto" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al asignar muestra a proyecto");
                return StatusCode(500, new { message = "Error al asignar muestra a proyecto" });
            }
        }

        [HttpPut("{id}/aceptar")]
        public async Task<IActionResult> AceptarMuestra(int id, [FromBody] MuestraComentarioOpcionalDTO? dto)
        {
            try
            {
                var ok = await _muestrasService.AceptarMuestraAsync(id, dto?.Comentario);
                if (!ok) return NotFound(new { message = "Muestra no encontrada" });
                return Ok(new { message = "Muestra aprobada" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al aprobar muestra");
                return StatusCode(500, new { message = "Error al aprobar la muestra" });
            }
        }

        [HttpPut("{id}/rechazar")]
        public async Task<IActionResult> RechazarMuestra(int id, [FromBody] MuestraComentarioDTO dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);
                var ok = await _muestrasService.RechazarMuestraAsync(id, dto.Comentario);
                if (!ok) return NotFound(new { message = "Muestra no encontrada" });
                return Ok(new { message = "Muestra rechazada" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al rechazar muestra");
                return StatusCode(500, new { message = "Error al rechazar la muestra" });
            }
        }

        [HttpPost("{id}/sincronizar-diseno")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> SincronizarConDiseno(int id)
        {
            try
            {
                var (ok, mensaje) = await _muestrasService.SincronizarMuestraConDisenoAsync(id);
                if (!ok) return BadRequest(new { message = mensaje });
                return Ok(new { message = mensaje });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al sincronizar muestra con diseno");
                return StatusCode(500, new { message = "Error al sincronizar con diseño" });
            }
        }
    }
}
