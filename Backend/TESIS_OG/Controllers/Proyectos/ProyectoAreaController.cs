using Microsoft.AspNetCore.Mvc;
using TESIS_OG.Services.ProyectosService;

namespace TESIS_OG.Controllers
{
    [ApiController]
    [Route("api/Proyecto")]
    public class ProyectoAreaController : ControllerBase
    {
        private readonly IProyectosService _proyectoService;
        private readonly ILogger<ProyectoAreaController> _logger;

        public ProyectoAreaController(
            IProyectosService proyectoService,
            ILogger<ProyectoAreaController> logger)
        {
            _proyectoService = proyectoService;
            _logger = logger;
        }

        /// <summary>
        /// Retrocede el proyecto al área anterior
        /// </summary>
        [HttpPut("{id}/retroceder-area")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RetrocederArea(int id)
        {
            try
            {
                var ok = await _proyectoService.RetrocederAreaAsync(id);

                if (!ok)
                    return BadRequest(new { message = "No se pudo retroceder el área" });

                return Ok(new { message = "Área retrocedida correctamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al retroceder área del proyecto {IdProyecto}", id);
                return StatusCode(500, new { message = "Error al retroceder área" });
            }
        }
    }
}
