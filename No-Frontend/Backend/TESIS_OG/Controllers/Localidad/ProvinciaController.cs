using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;

namespace TESIS_OG.Controllers.Localidad
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProvinciaController : ControllerBase
    {
        private readonly TamarindoDbContext _context;

        public ProvinciaController(TamarindoDbContext context)
        {
            _context = context;
        }

        // GET: api/Provincia
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetProvincias()
        {
            var provincias = await _context.Provincia
                .Select(p => new
                {
                    idProvincia = p.IdProvincia,
                    nombre = p.NombreProvincia
                })
                .OrderBy(p => p.nombre)
                .ToListAsync();

            return Ok(provincias);
        }

        // GET: api/Provincia/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetProvincia(int id)
        {
            var provincia = await _context.Provincia
                .Where(p => p.IdProvincia == id)
                .Select(p => new
                {
                    idProvincia = p.IdProvincia,
                    nombre = p.NombreProvincia
                })
                .FirstOrDefaultAsync();

            if (provincia == null)
            {
                return NotFound();
            }

            return Ok(provincia);
        }
    }
}
