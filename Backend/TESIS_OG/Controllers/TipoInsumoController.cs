using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;

namespace TESIS_OG.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class TipoInsumoController : ControllerBase
  {
    private readonly TamarindoDbContext _context;

    public TipoInsumoController(TamarindoDbContext context)
    {
      _context = context;
    }

    /// <summary>
    /// Obtener todos los tipos de insumo
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ObtenerTiposInsumo()
    {
      var tipos = await _context.TipoInsumos
          .Select(t => new
          {
            t.IdTipoInsumo,
            t.NombreTipo,
            t.Descripcion
          })
          .ToListAsync();

      return Ok(tipos);
    }

    /// <summary>
    /// Obtener tipo de insumo por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerTipoInsumoPorId(int id)
    {
      var tipo = await _context.TipoInsumos
          .Where(t => t.IdTipoInsumo == id)
          .Select(t => new
          {
            t.IdTipoInsumo,
            t.NombreTipo,
            t.Descripcion
          })
          .FirstOrDefaultAsync();

      if (tipo == null)
        return NotFound(new { message = $"Tipo de insumo con ID {id} no encontrado" });

      return Ok(tipo);
    }
  }
}
