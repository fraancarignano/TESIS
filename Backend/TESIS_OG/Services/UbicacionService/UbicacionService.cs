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
            return await _context.InsumoStocks
                .Include(s => s.IdInsumoNavigation)
                    .ThenInclude(i => i.IdTipoInsumoNavigation)
                .Include(s => s.IdProyectoNavigation)
                .Where(s => s.IdUbicacion == idUbicacion)
                .Select(s => new InsumoIndexDTO
                {
                    IdInsumo = s.IdInsumo,
                    NombreInsumo = s.IdInsumoNavigation.NombreInsumo,
                    IdTipoInsumo = s.IdInsumoNavigation.IdTipoInsumo,
                    NombreTipoInsumo = s.IdInsumoNavigation.IdTipoInsumoNavigation.NombreTipo,
                    UnidadMedida = s.IdInsumoNavigation.UnidadMedida,
                    StockActual = s.Cantidad,
                    StockMinimo = s.IdInsumoNavigation.StockMinimo,
                    FechaActualizacion = DateOnly.FromDateTime(s.FechaActualizacion),
                    IdProveedor = s.IdInsumoNavigation.IdProveedor,
                    Estado = s.IdInsumoNavigation.Estado,
                    IdUbicacion = s.IdUbicacion,
                    CodigoUbicacion = s.IdUbicacionNavigation != null ? s.IdUbicacionNavigation.Codigo : null,
                    DetalleStock = new List<InsumoStockDTO>
                    {
                        new InsumoStockDTO
                        {
                            IdInsumoStock = s.IdInsumoStock,
                            IdInsumo = s.IdInsumo,
                            IdProyecto = s.IdProyecto,
                            NombreProyecto = s.IdProyectoNavigation != null ? s.IdProyectoNavigation.NombreProyecto : "General",
                            CodigoProyecto = s.IdProyectoNavigation != null ? s.IdProyectoNavigation.CodigoProyecto : null,
                            IdUbicacion = s.IdUbicacion,
                            CodigoUbicacion = s.IdUbicacionNavigation != null ? s.IdUbicacionNavigation.Codigo : null,
                            IdOrdenCompra = s.IdOrdenCompra,
                            Cantidad = s.Cantidad,
                            FechaActualizacion = s.FechaActualizacion
                        }
                    }
                })
                .ToListAsync();
        }

        public async Task<bool> TransferirInsumosDesdeOrdenAsync(InsumoTransferDTO transferDto)
        {
            var ubicacionDestino = await _context.Ubicacions.FindAsync(transferDto.IdUbicacionDestino);
            if (ubicacionDestino == null) return false;

            var orden = await _context.OrdenCompras
                .Include(o => o.DetalleOrdenCompras)
                .FirstOrDefaultAsync(o => o.IdOrdenCompra == transferDto.IdOrdenCompra);
            if (orden == null) return false;

            foreach (var idInsumo in transferDto.IdsInsumos)
            {
                var detalle = orden.DetalleOrdenCompras.FirstOrDefault(d => d.IdInsumo == idInsumo);
                if (detalle == null) continue;

                var insumo = await _context.Insumos.FindAsync(idInsumo);
                if (insumo == null) continue;

                // Actualizar stock global del insumo (cache)
                insumo.StockActual += detalle.Cantidad;
                insumo.IdUbicacion = transferDto.IdUbicacionDestino;
                insumo.FechaActualizacion = DateOnly.FromDateTime(DateTime.Now);

                // Crear o actualizar entrada granular en InsumoStock
                var stockEntry = await _context.InsumoStocks
                    .FirstOrDefaultAsync(s => s.IdInsumo == idInsumo 
                                           && s.IdUbicacion == transferDto.IdUbicacionDestino 
                                           && s.IdProyecto == transferDto.IdProyecto);

                if (stockEntry == null)
                {
                    stockEntry = new InsumoStock
                    {
                        IdInsumo = idInsumo,
                        IdUbicacion = transferDto.IdUbicacionDestino,
                        IdProyecto = transferDto.IdProyecto,
                        IdOrdenCompra = orden.IdOrdenCompra,
                        Cantidad = detalle.Cantidad,
                        FechaActualizacion = DateTime.Now
                    };
                    _context.InsumoStocks.Add(stockEntry);
                }
                else
                {
                    stockEntry.Cantidad += detalle.Cantidad;
                    stockEntry.FechaActualizacion = DateTime.Now;
                    stockEntry.IdOrdenCompra = orden.IdOrdenCompra;
                }

                var movimiento = new InventarioMovimiento
                {
                    IdInsumo = insumo.IdInsumo,
                    IdOrdenCompra = orden.IdOrdenCompra,
                    TipoMovimiento = "Transferencia",
                    Cantidad = detalle.Cantidad,
                    FechaMovimiento = DateOnly.FromDateTime(DateTime.Now),
                    Origen = $"Orden de Compra #{orden.NroOrden}",
                    Observacion = $"Transferido a {ubicacionDestino.Codigo}" + (transferDto.IdProyecto.HasValue ? $" para Proyecto ID {transferDto.IdProyecto}" : ""),
                    IdUsuario = transferDto.IdUsuario
                };
                _context.InventarioMovimientos.Add(movimiento);
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
