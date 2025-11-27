using Microsoft.AspNetCore.Mvc;
using TESIS_OG.Data;
using TESIS_OG.Models;
using TESIS_OG.DTOs;

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
        public IActionResult CrearCliente([FromBody] ClienteCreateDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var cliente = new Cliente
            {
                NombreApellido = dto.NombreApellido,
                RazonSocial = dto.RazonSocial,
                TipoCliente = dto.TipoCliente,
                Cuit = dto.Cuit,
                Telefono = dto.Telefono,
                Email = dto.Email,
                IdDireccion = dto.IdDireccion,
                IdEstadoCliente = dto.IdEstadoCliente,
                Observaciones = dto.Observaciones,
                FechaAlta = DateOnly.FromDateTime(DateTime.Now)
            };

            _context.Clientes.Add(cliente);
            _context.SaveChanges();

            return Ok(new
            {
                message = "Cliente creado correctamente",
                cliente
            });
        }
    }
}