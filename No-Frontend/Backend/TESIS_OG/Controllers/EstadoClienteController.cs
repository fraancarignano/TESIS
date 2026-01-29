using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;

namespace TESIS_OG.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EstadoClienteController : ControllerBase
    {
        private readonly TamarindoDbContext _context;

        public EstadoClienteController(TamarindoDbContext context)
        {
            _context = context;
        }

        // GET: api/EstadoCliente
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetEstadosCliente()
        {
            var estados = await _context.EstadoClientes
                .Select(e => new
                {
                    idEstadoCliente = e.IdEstadoCliente,
                    nombre = e.NombreEstado
                })
                .OrderBy(e => e.idEstadoCliente)
                .ToListAsync();

            return Ok(estados);
        }

        // GET: api/EstadoCliente/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetEstadoCliente(int id)
        {
            var estado = await _context.EstadoClientes
                .Where(e => e.IdEstadoCliente == id)
                .Select(e => new
                {
                    idEstadoCliente = e.IdEstadoCliente,
                    nombre = e.NombreEstado
                })
                .FirstOrDefaultAsync();

            if (estado == null)
            {
                return NotFound();
            }

            return Ok(estado);
        }
    }
}
