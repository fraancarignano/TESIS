using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DbContextApp = TESIS_OG.Data.TamarindoDbContext;
using TESIS_OG.DTOs.Proveedores;
using TESIS_OG.Models;

namespace TESIS_OG.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProveedorController : ControllerBase
    {
        private readonly DbContextApp _context;

        public ProveedorController(DbContextApp context)
        {
            _context = context;
        }

        /// <summary>
        /// Crear un nuevo proveedor
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CrearProveedor([FromBody] ProveedorCreateDTO proveedorDto)
        {
            var cuit = proveedorDto.Cuit.Trim();
            var nombre = proveedorDto.NombreProveedor.Trim();

            var existeCuit = await _context.Proveedors
                .AnyAsync(p => p.Cuit == cuit);

            if (existeCuit)
                return BadRequest(new { message = "Ya existe un proveedor con ese CUIT" });

            var proveedor = new Proveedor
            {
                NombreProveedor = nombre,
                Cuit = cuit,
                Telefono = LimpiarTexto(proveedorDto.Telefono),
                Email = LimpiarTexto(proveedorDto.Email),
                Direccion = LimpiarTexto(proveedorDto.Direccion),
                Observaciones = LimpiarTexto(proveedorDto.Observaciones),
                FechaAlta = DateOnly.FromDateTime(DateTime.Today)
            };

            _context.Proveedors.Add(proveedor);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(ObtenerProveedorPorId), new { id = proveedor.IdProveedor }, MapearProveedor(proveedor));
        }

        /// <summary>
        /// Obtener todos los proveedores
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerProveedores()
        {
            var proveedores = await _context.Proveedors
                .Select(p => new ProveedorIndexDTO
                {
                    IdProveedor = p.IdProveedor,
                    NombreProveedor = p.NombreProveedor,
                    Cuit = p.Cuit,
                    Telefono = p.Telefono,
                    Email = p.Email,
                    Direccion = p.Direccion,
                    Observaciones = p.Observaciones,
                    FechaAlta = p.FechaAlta
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
                .Select(p => new ProveedorIndexDTO
                {
                    IdProveedor = p.IdProveedor,
                    NombreProveedor = p.NombreProveedor,
                    Cuit = p.Cuit,
                    Telefono = p.Telefono,
                    Email = p.Email,
                    Direccion = p.Direccion,
                    Observaciones = p.Observaciones,
                    FechaAlta = p.FechaAlta
                })
                .FirstOrDefaultAsync();

            if (proveedor == null)
                return NotFound(new { message = $"Proveedor con ID {id} no encontrado" });

            return Ok(proveedor);
        }

        /// <summary>
        /// Actualizar un proveedor existente
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarProveedor(int id, [FromBody] ProveedorEditDTO proveedorDto)
        {
            var proveedor = await _context.Proveedors
                .FirstOrDefaultAsync(p => p.IdProveedor == id);

            if (proveedor == null)
                return NotFound(new { message = $"Proveedor con ID {id} no encontrado" });

            var cuit = proveedorDto.Cuit.Trim();
            var nombre = proveedorDto.NombreProveedor.Trim();

            var existeCuitEnOtro = await _context.Proveedors
                .AnyAsync(p => p.IdProveedor != id && p.Cuit == cuit);

            if (existeCuitEnOtro)
                return BadRequest(new { message = "Ya existe otro proveedor con ese CUIT" });

            proveedor.NombreProveedor = nombre;
            proveedor.Cuit = cuit;
            proveedor.Telefono = LimpiarTexto(proveedorDto.Telefono);
            proveedor.Email = LimpiarTexto(proveedorDto.Email);
            proveedor.Direccion = LimpiarTexto(proveedorDto.Direccion);
            proveedor.Observaciones = LimpiarTexto(proveedorDto.Observaciones);

            await _context.SaveChangesAsync();

            return Ok(MapearProveedor(proveedor));
        }

        /// <summary>
        /// Eliminar un proveedor
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarProveedor(int id)
        {
            var proveedor = await _context.Proveedors
                .FirstOrDefaultAsync(p => p.IdProveedor == id);

            if (proveedor == null)
                return NotFound(new { message = $"Proveedor con ID {id} no encontrado" });

            var tieneInsumos = await _context.Insumos
                .AnyAsync(i => i.IdProveedor == id);

            var tieneOrdenes = await _context.OrdenCompras
                .AnyAsync(o => o.IdProveedor == id);

            if (tieneInsumos || tieneOrdenes)
                return BadRequest(new { message = "No se puede eliminar el proveedor porque tiene relaciones activas (insumos u ordenes de compra)" });

            _context.Proveedors.Remove(proveedor);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Proveedor eliminado exitosamente" });
        }

        private static ProveedorIndexDTO MapearProveedor(Proveedor proveedor)
        {
            return new ProveedorIndexDTO
            {
                IdProveedor = proveedor.IdProveedor,
                NombreProveedor = proveedor.NombreProveedor,
                Cuit = proveedor.Cuit,
                Telefono = proveedor.Telefono,
                Email = proveedor.Email,
                Direccion = proveedor.Direccion,
                Observaciones = proveedor.Observaciones,
                FechaAlta = proveedor.FechaAlta
            };
        }

        private static string? LimpiarTexto(string? valor)
        {
            if (string.IsNullOrWhiteSpace(valor))
                return null;

            return valor.Trim();
        }
    }
}
