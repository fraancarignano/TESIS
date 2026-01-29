using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;

namespace TESIS_OG.Controllers.Localidad
{
    [Route("api/[controller]")]
    [ApiController]
    public class CiudadController : ControllerBase
    {
        private readonly TamarindoDbContext _context;

        public CiudadController(TamarindoDbContext context)
        {
            _context = context;
        }

        // GET: api/Ciudad
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCiudades()
        {
            var ciudades = await _context.Ciudads
                .Select(c => new
                {
                    idCiudad = c.IdCiudad,
                    nombre = c.NombreCiudad,
                    idProvincia = c.IdProvincia
                })
                .OrderBy(c => c.nombre)
                .ToListAsync();

            return Ok(ciudades);
        }

        // GET: api/Ciudad/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetCiudad(int id)
        {
            var ciudad = await _context.Ciudads
                .Where(c => c.IdCiudad == id)
                .Select(c => new
                {
                    idCiudad = c.IdCiudad,
                    nombre = c.NombreCiudad,
                    idProvincia = c.IdProvincia
                })
                .FirstOrDefaultAsync();

            if (ciudad == null)
            {
                return NotFound();
            }

            return Ok(ciudad);
        }

        // GET: api/Ciudad/provincia/{idProvincia}
        [HttpGet("provincia/{idProvincia}")]
        public async Task<ActionResult<IEnumerable<object>>> GetCiudadesByProvincia(int idProvincia)
        {
            var ciudades = await _context.Ciudads
                .Where(c => c.IdProvincia == idProvincia)
                .Select(c => new
                {
                    idCiudad = c.IdCiudad,
                    nombre = c.NombreCiudad,
                    idProvincia = c.IdProvincia
                })
                .OrderBy(c => c.nombre)
                .ToListAsync();

            return Ok(ciudades);
        }
    }
}
