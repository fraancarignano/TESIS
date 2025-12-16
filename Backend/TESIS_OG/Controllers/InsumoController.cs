using Microsoft.AspNetCore.Mvc;
using TESIS_OG.DTOs.Insumos;
using TESIS_OG.Services.InsumoService;

namespace TESIS_OG.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class InsumoController : ControllerBase
  {
    private readonly IInsumoService _insumoService;

    public InsumoController(IInsumoService insumoService)
    {
      _insumoService = insumoService;
    }

    /// <summary>
    /// Crear un nuevo insumo
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CrearInsumo([FromBody] InsumoCreateDTO insumoDto)
    {
      var result = await _insumoService.CrearInsumoAsync(insumoDto);
      if (result == null)
        return BadRequest(new { message = "No se pudo crear el insumo. Verifique que el tipo de insumo y proveedor existan, y que no haya un insumo con el mismo nombre." });

      return CreatedAtAction(nameof(ObtenerInsumoPorId), new { id = result.IdInsumo }, result);
    }

    /// <summary>
    /// Obtener todos los insumos
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ObtenerInsumos()
    {
      var insumos = await _insumoService.ObtenerTodosLosInsumosAsync();
      return Ok(insumos);
    }

    /// <summary>
    /// Obtener un insumo por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerInsumoPorId(int id)
    {
      var insumo = await _insumoService.ObtenerInsumoPorIdAsync(id);
      if (insumo == null)
        return NotFound(new { message = $"Insumo con ID {id} no encontrado" });

      return Ok(insumo);
    }

    /// <summary>
    /// Actualizar un insumo existente
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarInsumo(int id, [FromBody] InsumoEditDTO insumoDto)
    {
      var result = await _insumoService.ActualizarInsumoAsync(id, insumoDto);
      if (result == null)
        return BadRequest(new { message = "No se pudo actualizar el insumo. Verifique que el tipo de insumo y proveedor existan." });

      return Ok(result);
    }

    /// <summary>
    /// Eliminar un insumo
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarInsumo(int id)
    {
      var result = await _insumoService.EliminarInsumoAsync(id);
      if (!result)
        return NotFound(new { message = $"Insumo con ID {id} no encontrado" });

      return Ok(new { message = "Insumo eliminado exitosamente" });
    }

    /// <summary>
    /// Buscar insumos con filtros
    /// </summary>
    [HttpPost("buscar")]
    public async Task<IActionResult> BuscarInsumos([FromBody] InsumoSearchDTO filtros)
    {
      var insumos = await _insumoService.BuscarInsumosAsync(filtros);
      return Ok(insumos);
    }

    /// <summary>
    /// Cambiar el estado de un insumo
    /// </summary>
    [HttpPatch("{id}/estado")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoRequest request)
    {
      var result = await _insumoService.CambiarEstadoAsync(id, request.NuevoEstado);
      if (!result)
        return NotFound(new { message = $"Insumo con ID {id} no encontrado" });

      return Ok(new { message = "Estado actualizado exitosamente" });
    }
  }

  // Clase auxiliar para el request de cambio de estado
  public class CambiarEstadoRequest
  {
    public string NuevoEstado { get; set; } = null!;
  }
}
