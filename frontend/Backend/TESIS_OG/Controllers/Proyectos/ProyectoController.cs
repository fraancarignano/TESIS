using Microsoft.AspNetCore.Mvc;
using TESIS_OG.DTOs.Proyectos;
using TESIS_OG.Services.ProyectoService;
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

    /// <summary>
    /// Crear un nuevo proyecto
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CrearProyecto([FromBody] ProyectoCrearDTO proyectoDto)
    {
      var result = await _proyectoService.CrearProyectoAsync(proyectoDto);
      if (result == null)
        return BadRequest(new { message = "No se pudo crear el proyecto" });

      return CreatedAtAction(nameof(ObtenerProyectoPorId), new { id = result.IdProyecto }, result);
    }

    /// <summary>
    /// Obtener todos los proyectos
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ObtenerProyectos()
    {
      var proyectos = await _proyectoService.ObtenerTodosLosProyectosAsync();
      return Ok(proyectos);
    }

    /// <summary>
    /// Obtener un proyecto por ID con todos sus detalles
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerProyectoPorId(int id)
    {
      var proyecto = await _proyectoService.ObtenerProyectoPorIdAsync(id);
      if (proyecto == null)
        return NotFound(new { message = $"Proyecto con ID {id} no encontrado" });

      return Ok(proyecto);
    }

    /// <summary>
    /// Actualizar un proyecto existente
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarProyecto(int id, [FromBody] ProyectoEditarDTO proyectoDto)
    {
      var result = await _proyectoService.ActualizarProyectoAsync(id, proyectoDto);
      if (result == null)
        return BadRequest(new { message = "No se pudo actualizar el proyecto" });

      return Ok(result);
    }

    /// <summary>
    /// Eliminar (archivar) un proyecto
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarProyecto(int id)
    {
      var result = await _proyectoService.EliminarProyectoAsync(id);
      if (!result)
        return NotFound(new { message = $"Proyecto con ID {id} no encontrado" });

      return Ok(new { message = "Proyecto archivado exitosamente" });
    }

    /// <summary>
    /// Buscar proyectos con filtros
    /// </summary>
    [HttpPost("buscar")]
    public async Task<IActionResult> BuscarProyectos([FromBody] ProyectoSearchDTO filtros)
    {
      var proyectos = await _proyectoService.BuscarProyectosAsync(filtros);
      return Ok(proyectos);
    }

    /// <summary>
    /// Agregar materiales a un proyecto existente
    /// </summary>
    [HttpPost("{id}/materiales")]
    public async Task<IActionResult> AgregarMateriales(int id, [FromBody] List<MaterialAsignadoDTO> materiales)
    {
      var result = await _proyectoService.AgregarMaterialesAsync(id, materiales);
      if (!result)
        return BadRequest(new { message = "No se pudieron agregar los materiales" });

      return Ok(new { message = "Materiales agregados exitosamente" });
    }

    /// <summary>
    /// Actualizar avance de un área específica
    /// </summary>
    [HttpPut("{id}/avance")]
    public async Task<IActionResult> ActualizarAvance(int id, [FromBody] ActualizarAvanceDTO avanceDto)
    {
      var result = await _proyectoService.ActualizarAvanceAsync(id, avanceDto);
      if (!result)
        return BadRequest(new { message = "No se pudo actualizar el avance" });

      return Ok(new { message = "Avance actualizado exitosamente" });
    }

    /// <summary>
    /// Registrar scrap en un proyecto
    /// </summary>
    [HttpPost("{id}/scrap")]
    public async Task<IActionResult> RegistrarScrap(int id, [FromBody] RegistrarScrapDTO scrapDto)
    {
      var result = await _proyectoService.RegistrarScrapAsync(id, scrapDto);
      if (!result)
        return BadRequest(new { message = "No se pudo registrar el scrap" });

      return Ok(new { message = "Scrap registrado exitosamente" });
    }

    /// <summary>
    /// Agregar observación a un proyecto
    /// </summary>
    [HttpPost("{id}/observaciones")]
    public async Task<IActionResult> AgregarObservacion(int id, [FromBody] AgregarObservacionDTO observacionDto)
    {
      var result = await _proyectoService.AgregarObservacionAsync(id, observacionDto);
      if (!result)
        return BadRequest(new { message = "No se pudo agregar la observación" });

      return Ok(new { message = "Observación agregada exitosamente" });
    }

    /// <summary>
    /// Obtener proyectos por estado
    /// </summary>
    [HttpGet("estado/{estado}")]
    public async Task<IActionResult> ObtenerProyectosPorEstado(string estado)
    {
      var proyectos = await _proyectoService.ObtenerProyectosPorEstadoAsync(estado);
      return Ok(proyectos);
    }

    /// <summary>
    /// Cambiar estado de un proyecto (para drag & drop en Kanban)
    /// </summary>
    [HttpPatch("{id}/estado")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoDTO estadoDto)
    {
      var result = await _proyectoService.CambiarEstadoAsync(id, estadoDto.Estado);
      if (!result)
        return BadRequest(new { message = "No se pudo cambiar el estado" });

      return Ok(new { message = "Estado actualizado exitosamente" });
    }
  }

  // DTO auxiliar para cambiar estado
  public class CambiarEstadoDTO
  {
    public string Estado { get; set; } = null!;
  }
}
