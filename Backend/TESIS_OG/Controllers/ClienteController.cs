using Microsoft.AspNetCore.Mvc;
using TESIS_OG.Data;
using TESIS_OG.Models;
using TESIS_OG.DTOs.Clientes;

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

        // GET: api/Cliente (INDEX - Listar todos)
        [HttpGet]
        public IActionResult Index()
        {
            var clientes = _context.Clientes
                .Select(c => new ClienteIndexDTO
                {
                    IdCliente = c.IdCliente,
                    NombreApellido = c.NombreApellido,
                    RazonSocial = c.RazonSocial,
                    TipoCliente = c.TipoCliente,
                    Cuit = c.Cuit,
                    Telefono = c.Telefono,
                    Email = c.Email,
                    FechaAlta = c.FechaAlta,
                    IdEstadoCliente = c.IdEstadoCliente
                })
                .ToList();

            return Ok(clientes);
        }

        // POST: api/Cliente/Buscar (Búsqueda dinámica)
        [HttpPost("Buscar")]
        public IActionResult BuscarClientes([FromBody] ClienteSearchDTO filtros)
        {
            var query = _context.Clientes.AsQueryable();

            // Filtro por NombreApellido (búsqueda parcial, insensible a mayúsculas)
            if (!string.IsNullOrWhiteSpace(filtros.NombreApellido))
            {
                query = query.Where(c => c.NombreApellido != null &&
                                         c.NombreApellido.ToLower().Contains(filtros.NombreApellido.ToLower()));
            }

            // Filtro por RazonSocial (búsqueda parcial, insensible a mayúsculas)
            if (!string.IsNullOrWhiteSpace(filtros.RazonSocial))
            {
                query = query.Where(c => c.RazonSocial != null &&
                                         c.RazonSocial.ToLower().Contains(filtros.RazonSocial.ToLower()));
            }

            // Filtro por TipoCliente (búsqueda exacta, insensible a mayúsculas)
            if (!string.IsNullOrWhiteSpace(filtros.TipoCliente))
            {
                query = query.Where(c => c.TipoCliente.ToLower() == filtros.TipoCliente.ToLower());
            }

            // Ejecutar la consulta y mapear a DTO
            var resultados = query
                .Select(c => new ClienteIndexDTO
                {
                    IdCliente = c.IdCliente,
                    NombreApellido = c.NombreApellido,
                    RazonSocial = c.RazonSocial,
                    TipoCliente = c.TipoCliente,
                    Cuit = c.Cuit,
                    Telefono = c.Telefono,
                    Email = c.Email,
                    FechaAlta = c.FechaAlta,
                    IdEstadoCliente = c.IdEstadoCliente
                })
                .ToList();

            return Ok(resultados);
        }

        // GET: api/Cliente/{id} (Obtener uno para editar)
        [HttpGet("{id}")]
        public IActionResult ObtenerCliente(int id)
        {
            var cliente = _context.Clientes.Find(id);

            if (cliente == null)
                return NotFound(new { message = "Cliente no encontrado" });

            return Ok(cliente);
        }

        // PUT: api/Cliente/{id} (EDIT - Editar)
        [HttpPut("{id}")]
        public IActionResult EditarCliente(int id, [FromBody] ClienteEditDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var cliente = _context.Clientes.Find(id);

            if (cliente == null)
                return NotFound(new { message = "Cliente no encontrado" });

            cliente.NombreApellido = dto.NombreApellido;
            cliente.RazonSocial = dto.RazonSocial;
            cliente.TipoCliente = dto.TipoCliente;
            cliente.Cuit = dto.Cuit;
            cliente.Telefono = dto.Telefono;
            cliente.Email = dto.Email;
            cliente.IdDireccion = dto.IdDireccion;
            cliente.IdEstadoCliente = dto.IdEstadoCliente;
            cliente.Observaciones = dto.Observaciones;

            _context.SaveChanges();

            return Ok(new
            {
                message = "Cliente actualizado correctamente",
                cliente
            });
        }

        // DELETE: api/Cliente/{id} (DELETE - Eliminar)
        [HttpDelete("{id}")]
        public IActionResult EliminarCliente(int id)
        {
            var cliente = _context.Clientes.Find(id);

            if (cliente == null)
                return NotFound(new { message = "Cliente no encontrado" });

            _context.Clientes.Remove(cliente);
            _context.SaveChanges();

            return Ok(new { message = "Cliente eliminado correctamente" });
        }
    }
}