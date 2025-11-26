using Microsoft.AspNetCore.Mvc;
using TESIS_OG.Data;
using TESIS_OG.Models;

namespace TESIS_OG.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClienteController : ControllerBase
    {
        private readonly TamarindoDbContext _context;

        public ClienteController(TamarindoDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public IActionResult CrearCliente([FromBody] Cliente cliente)
        {
            _context.Clientes.Add(cliente);
            _context.SaveChanges();

            return Ok(new { message = "Cliente creado correctamente", cliente });
        }
    }
}
