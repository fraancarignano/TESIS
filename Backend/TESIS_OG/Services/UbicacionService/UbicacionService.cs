using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;
using TESIS_OG.DTOs.Ubicacion;
using TESIS_OG.DTOs.Insumos;
using TESIS_OG.Models;

namespace TESIS_OG.Services.UbicacionService
{
    public class UbicacionService : IUbicacionService
    {
        private readonly TamarindoDbContext _context;

        public UbicacionService(TamarindoDbContext context)
        {
            _context = context;
        }

        public async Task<UbicacionDTO?> CrearUbicacionAsync(UbicacionCreateDTO dto)
        {
            var existeCodigo = await _context.Ubicacions.AnyAsync(u => u.Codigo == dto.Codigo);
            if (existeCodigo) return null;

            var ubicacion = new Ubicacion
            {
                Codigo = dto.Codigo,
                Rack = dto.Rack,
                Division = dto.Division,
                Espacio = dto.Espacio,
                Descripcion = dto.Descripcion
            };

            _context.Ubicacions.Add(ubicacion);
            await _context.SaveChangesAsync();

            return await ObtenerUbicacionPorIdAsync(ubicacion.IdUbicacion);
        }

        public async Task<List<UbicacionDTO>> ObtenerTodasLasUbicacionesAsync()
        {
            return await _context.Ubicacions
                .Select(u => new UbicacionDTO
                {
                    IdUbicacion = u.IdUbicacion,
                    Codigo = u.Codigo,
                    Rack = u.Rack,
                    Division = u.Division,
                    Espacio = u.Espacio,
                    Descripcion = u.Descripcion
                })
                .ToListAsync();
        }

        public async Task<UbicacionDTO?> ObtenerUbicacionPorIdAsync(int id)
        {
            return await _context.Ubicacions
                .Where(u => u.IdUbicacion == id)
                .Select(u => new UbicacionDTO
                {
                    IdUbicacion = u.IdUbicacion,
                    Codigo = u.Codigo,
                    Rack = u.Rack,
                    Division = u.Division,
                    Espacio = u.Espacio,
                    Descripcion = u.Descripcion
                })
                .FirstOrDefaultAsync();
        }

        public async Task<UbicacionDTO?> ActualizarUbicacionAsync(int id, UbicacionEditDTO dto)
        {
            var ubicacion = await _context.Ubicacions.FindAsync(id);
            if (ubicacion == null) return null;

            var existeCodigo = await _context.Ubicacions.AnyAsync(u => u.Codigo == dto.Codigo && u.IdUbicacion != id);
            if (existeCodigo) return null;

            ubicacion.Codigo = dto.Codigo;
            ubicacion.Rack = dto.Rack;
            ubicacion.Division = dto.Division;
            ubicacion.Espacio = dto.Espacio;
            ubicacion.Descripcion = dto.Descripcion;

            await _context.SaveChangesAsync();
            return await ObtenerUbicacionPorIdAsync(id);
        }

        public async Task<bool> EliminarUbicacionAsync(int id)
        {
            var ubicacion = await _context.Ubicacions.FindAsync(id);
            if (ubicacion == null) return false;

            var estaEnUso = await _context.Insumos.AnyAsync(i => i.IdUbicacion == id);
            if (estaEnUso) return false;

            _context.Ubicacions.Remove(ubicacion);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<InsumoIndexDTO>> ObtenerInsumosPorUbicacionAsync(int idUbicacion)
        {
            return await _context.Insumos
                .Where(i => i.IdUbicacion == idUbicacion)
                .Select(i => new InsumoIndexDTO
                {
                    IdInsumo = i.IdInsumo,
                    NombreInsumo = i.NombreInsumo,
                    IdTipoInsumo = i.IdTipoInsumo,
                    NombreTipoInsumo = i.IdTipoInsumoNavigation.NombreTipo,
                    UnidadMedida = i.UnidadMedida,
                    StockActual = i.StockActual,
                    StockMinimo = i.StockMinimo,
                    FechaActualizacion = i.FechaActualizacion,
                    IdProveedor = i.IdProveedor,
                    NombreProveedor = i.IdProveedorNavigation != null ? i.IdProveedorNavigation.NombreProveedor : null,
                    Estado = i.Estado,
                    IdUbicacion = i.IdUbicacion,
                    CodigoUbicacion = i.IdUbicacionNavigation != null ? i.IdUbicacionNavigation.Codigo : null
                })
                .ToListAsync();
        }
    }
}
