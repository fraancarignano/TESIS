using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DbContextApp = TESIS_OG.Data.TamarindoDbContext;
using TESIS_OG.DTOs.Proveedores;

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

            if (!await UbicacionValidaAsync(proveedorDto.IdProvincia, proveedorDto.IdCiudad))
                return BadRequest(new { message = "La provincia/ciudad indicada no es valida o no corresponde entre si" });

            var proveedor = new Models.Proveedor
            {
                NombreProveedor = nombre,
                Cuit = cuit,
                Telefono = LimpiarTexto(proveedorDto.Telefono),
                Email = LimpiarTexto(proveedorDto.Email),
                Direccion = LimpiarTexto(proveedorDto.Direccion),
                IdProvincia = proveedorDto.IdProvincia,
                IdCiudad = proveedorDto.IdCiudad,
                Observaciones = LimpiarTexto(proveedorDto.Observaciones),
                FechaAlta = DateOnly.FromDateTime(DateTime.Today)
            };

            _context.Proveedors.Add(proveedor);
            await _context.SaveChangesAsync();

            var creado = await ObtenerProveedorIndexPorIdAsync(proveedor.IdProveedor);
            return CreatedAtAction(nameof(ObtenerProveedorPorId), new { id = proveedor.IdProveedor }, creado);
        }

        /// <summary>
        /// Obtener todos los proveedores
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerProveedores()
        {
            var proveedores = await _context.Proveedors
                .Include(p => p.IdProvinciaNavigation)
                .Include(p => p.IdCiudadNavigation)
                .Select(p => new ProveedorIndexDTO
                {
                    IdProveedor = p.IdProveedor,
                    NombreProveedor = p.NombreProveedor,
                    Cuit = p.Cuit,
                    Telefono = p.Telefono,
                    Email = p.Email,
                    Direccion = p.Direccion,
                    IdProvincia = p.IdProvincia,
                    IdCiudad = p.IdCiudad,
                    NombreProvincia = p.IdProvinciaNavigation != null ? p.IdProvinciaNavigation.NombreProvincia : null,
                    NombreCiudad = p.IdCiudadNavigation != null ? p.IdCiudadNavigation.NombreCiudad : null,
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
            var proveedor = await ObtenerProveedorIndexPorIdAsync(id);

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

            if (!await UbicacionValidaAsync(proveedorDto.IdProvincia, proveedorDto.IdCiudad))
                return BadRequest(new { message = "La provincia/ciudad indicada no es valida o no corresponde entre si" });

            proveedor.NombreProveedor = nombre;
            proveedor.Cuit = cuit;
            proveedor.Telefono = LimpiarTexto(proveedorDto.Telefono);
            proveedor.Email = LimpiarTexto(proveedorDto.Email);
            proveedor.Direccion = LimpiarTexto(proveedorDto.Direccion);
            proveedor.IdProvincia = proveedorDto.IdProvincia;
            proveedor.IdCiudad = proveedorDto.IdCiudad;
            proveedor.Observaciones = LimpiarTexto(proveedorDto.Observaciones);

            await _context.SaveChangesAsync();

            var actualizado = await ObtenerProveedorIndexPorIdAsync(id);
            return Ok(actualizado);
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

        private async Task<ProveedorIndexDTO?> ObtenerProveedorIndexPorIdAsync(int id)
        {
            return await _context.Proveedors
                .Include(p => p.IdProvinciaNavigation)
                .Include(p => p.IdCiudadNavigation)
                .Where(p => p.IdProveedor == id)
                .Select(p => new ProveedorIndexDTO
                {
                    IdProveedor = p.IdProveedor,
                    NombreProveedor = p.NombreProveedor,
                    Cuit = p.Cuit,
                    Telefono = p.Telefono,
                    Email = p.Email,
                    Direccion = p.Direccion,
                    IdProvincia = p.IdProvincia,
                    IdCiudad = p.IdCiudad,
                    NombreProvincia = p.IdProvinciaNavigation != null ? p.IdProvinciaNavigation.NombreProvincia : null,
                    NombreCiudad = p.IdCiudadNavigation != null ? p.IdCiudadNavigation.NombreCiudad : null,
                    Observaciones = p.Observaciones,
                    FechaAlta = p.FechaAlta
                })
                .FirstOrDefaultAsync();
        }

        private async Task<bool> UbicacionValidaAsync(int? idProvincia, int? idCiudad)
        {
            if (idProvincia.HasValue)
            {
                var provinciaExiste = await _context.Provincia.AnyAsync(p => p.IdProvincia == idProvincia.Value);
                if (!provinciaExiste)
                    return false;
            }

            if (idCiudad.HasValue)
            {
                var ciudad = await _context.Ciudads
                    .Where(c => c.IdCiudad == idCiudad.Value)
                    .Select(c => new { c.IdProvincia })
                    .FirstOrDefaultAsync();

                if (ciudad == null)
                    return false;

                if (idProvincia.HasValue && ciudad.IdProvincia != idProvincia.Value)
                    return false;
            }

            return true;
        }

        private static string? LimpiarTexto(string? valor)
        {
            if (string.IsNullOrWhiteSpace(valor))
                return null;

            return valor.Trim();
        }
    }
}
