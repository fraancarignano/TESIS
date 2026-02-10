using Microsoft.AspNetCore.Mvc;
using TESIS_OG.DTOs.Proyectos;
using TESIS_OG.DTOs.Configuracion;
using TESIS_OG.Services.ProyectosService;

namespace TESIS_OG.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProyectoController : ControllerBase
    {
        private readonly IProyectosService _proyectoService;

        public ProyectoController(IProyectosService proyectoService)
        {
            _proyectoService = proyectoService;
        }

        // ========================================
        // CRUD
        // ========================================

        [HttpPost]
        public async Task<IActionResult> CrearProyecto([FromBody] ProyectoCrearDTO proyectoDto)
        {
            var result = await _proyectoService.CrearProyectoAsync(proyectoDto);
            if (result == null)
                return BadRequest("No se pudo crear el proyecto");

            return CreatedAtAction(nameof(ObtenerProyectoPorId), new { id = result.IdProyecto }, result);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerProyectos()
        {
            return Ok(await _proyectoService.ObtenerTodosLosProyectosAsync());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerProyectoPorId(int id)
        {
            var proyecto = await _proyectoService.ObtenerProyectoPorIdAsync(id);
            if (proyecto == null)
                return NotFound();

            return Ok(proyecto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarProyecto(int id, [FromBody] ProyectoEditarDTO proyectoDto)
        {
            await _proyectoService.ActualizarProyectoAsync(id, proyectoDto);
            return Ok(new { message = "Proyecto actualizado correctamente" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarProyecto(int id)
        {
            var eliminado = await _proyectoService.EliminarProyectoAsync(id);
            if (!eliminado)
                return NotFound();

            return Ok(new { message = "Proyecto archivado" });
        }

        // ========================================
        // FILTROS
        // ========================================

        [HttpGet("estado/{estado}")]
        public async Task<IActionResult> ObtenerPorEstado(string estado)
        {
            return Ok(await _proyectoService.ObtenerProyectosPorEstadoAsync(estado));
        }

        [HttpGet("cliente/{idCliente}")]
        public async Task<IActionResult> ObtenerPorCliente(int idCliente)
        {
            return Ok(await _proyectoService.ObtenerProyectosPorClienteAsync(idCliente));
        }

        // ========================================
        // MATERIALES
        // ========================================

        [HttpPost("calcular-materiales")]
        public async Task<IActionResult> CalcularMateriales([FromBody] CalculoMaterialesRequestDTO request)
        {
            return Ok(await _proyectoService.CalcularMaterialesAsync(request));
        }

        [HttpPost("validar-stock")]
        public async Task<IActionResult> ValidarStock([FromBody] ValidarStockRequestWrapper request)
        {
            var result = await _proyectoService.ValidarStockAsync(
                request.Prendas,
                request.MaterialesManuales
            );

            return Ok(result);
        }

        [HttpPost("{id}/recalcular-materiales")]
        public async Task<IActionResult> RecalcularMateriales(int id)
        {
            var ok = await _proyectoService.RecalcularMaterialesProyectoAsync(id);
            if (!ok)
                return BadRequest();

            return Ok(new { message = "Materiales recalculados" });
        }

        // ========================================
        // PRENDAS Y TALLES
        // ========================================

        [HttpGet("{id}/prendas")]
        public async Task<IActionResult> ObtenerPrendas(int id)
        {
            return Ok(await _proyectoService.ObtenerPrendasProyectoAsync(id));
        }

        [HttpPost("validar-talles")]
        public async Task<IActionResult> ValidarTalles([FromBody] ValidarTallesRequestDTO request)
        {
            return Ok(await _proyectoService.ValidarDistribucionTallesAsync(request));
        }

        // ========================================
        // FORMULARIO
        // ========================================

        [HttpGet("formulario")]
        public async Task<IActionResult> ObtenerDatosFormulario()
        {
            return Ok(await _proyectoService.ObtenerDatosFormularioAsync());
        }

        // ========================================
        // AVANCE / SCRAP / OBSERVACIONES
        // ========================================

        [HttpPut("{id}/avance")]
        public async Task<IActionResult> ActualizarAvance(int id, [FromBody] ActualizarAvanceDTO dto)
        {
            var ok = await _proyectoService.ActualizarAvanceAsync(id, dto);
            if (!ok)
                return BadRequest();

            return Ok();
        }

        [HttpPost("{id}/scrap")]
        public async Task<IActionResult> RegistrarScrap(int id, [FromBody] RegistrarScrapDTO dto)
        {
            var ok = await _proyectoService.RegistrarScrapAsync(id, dto);
            if (!ok)
                return BadRequest();

            return Ok();
        }

        [HttpPost("{id}/observaciones")]
        public async Task<IActionResult> AgregarObservacion(int id, [FromBody] AgregarObservacionDTO dto)
        {
            var ok = await _proyectoService.AgregarObservacionAsync(id, dto);
            if (!ok)
                return BadRequest();

            return Ok();
        }

        // ========================================
        // ESTADO
        // ========================================

        [HttpPatch("{id}/estado")]
        public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoDTO dto)
        {
            var ok = await _proyectoService.CambiarEstadoAsync(id, dto.Estado);
            if (!ok)
                return BadRequest();

            return Ok();
        }
    }

    // Wrapper para validar stock
    public class ValidarStockRequestWrapper
    {
        public List<ProyectoPrendaCrearDTO> Prendas { get; set; } = new();
        public List<MaterialManualDTO>? MaterialesManuales { get; set; }
    }

    public class CambiarEstadoDTO
    {
        public string Estado { get; set; } = null!;
    }
}
