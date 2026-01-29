using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;

namespace TESIS_OG.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class ProveedorController : ControllerBase
  {
    private readonly TamarindoDbContext _context;

    public ProveedorController(TamarindoDbContext context)
    {
      _context = context;
    }

    /// <summary>
    /// Obtener todos los proveedores
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ObtenerProveedores()
    {
      var proveedores = await _context.Proveedors
          .Select(p => new
          {
            p.IdProveedor,
            p.NombreProveedor,
            p.Cuit
          })
          .ToListAsync();

      return Ok(proveedores);
    }

    /// <summary>
    /// Obtener proveedor por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerProveedorPorId(int id)
    {
      var proveedor = await _context.Proveedors
          .Where(p => p.IdProveedor == id)
          .Select(p => new
          {
            p.IdProveedor,
            p.NombreProveedor,
            p.Cuit
          })
          .FirstOrDefaultAsync();

      if (proveedor == null)
        return NotFound(new { message = $"Proveedor con ID {id} no encontrado" });

      return Ok(proveedor);
    }
  }
}
