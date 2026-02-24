using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using TESIS_OG.DTOs.Movimientos;
using TESIS_OG.Services.MovimientoService;

namespace TESIS_OG.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MovimientoController : ControllerBase
    {
        private readonly IMovimientoService _movimientoService;

        public MovimientoController(IMovimientoService movimientoService)
        {
            _movimientoService = movimientoService;
        }

        [HttpPost("buscar")]
        public async Task<IActionResult> ObtenerMovimientos([FromBody] MovimientoSearchDTO filtros)
        {
            var result = await _movimientoService.ObtenerMovimientosAsync(filtros);
            return Ok(result);
        }
    }
}
