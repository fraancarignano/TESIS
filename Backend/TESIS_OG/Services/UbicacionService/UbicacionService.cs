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

        public async Task<bool> TransferirInsumosAsync(InsumoTransferDTO transferDto)
        {
            var ubicacionDestino = await _context.Ubicacions.FindAsync(transferDto.IdUbicacionDestino);
            if (ubicacionDestino == null) return false;

            // CASO 1: TRANSFERENCIA DESDE ORDEN DE COMPRA
            if (transferDto.IdOrdenCompra.HasValue)
            {
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

                    // Actualizar stock global del insumo
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
                        NombreInsumo = insumo.NombreInsumo,
                        IdOrdenCompra = orden.IdOrdenCompra,
                        TipoMovimiento = "Transferencia",
                        Cantidad = detalle.Cantidad,
                        FechaMovimiento = DateOnly.FromDateTime(DateTime.Now),
                        Origen = $"Orden de Compra #{orden.NroOrden}",
                        Destino = ubicacionDestino.Codigo,
                        Observacion = (transferDto.IdProyecto.HasValue ? $"Proyecto ID {transferDto.IdProyecto}" : "Stock General"),
                        IdUsuario = transferDto.IdUsuario
                    };
                    _context.InventarioMovimientos.Add(movimiento);
                }

                // Actualizar estado de la OC a "Ingresada" si se transfirieron items
                if (transferDto.IdsInsumos.Any())
                {
                    orden.Estado = "Ingresada";
                }
            }
            // CASO 2: TRANSFERENCIA DESDE OTRA UBICACIÓN
            else if (transferDto.IdUbicacionOrigen.HasValue)
            {
                var ubicacionOrigen = await _context.Ubicacions.FindAsync(transferDto.IdUbicacionOrigen);
                if (ubicacionOrigen == null) return false;

                foreach (var idInsumo in transferDto.IdsInsumos)
                {
                    // Buscar stock en el origen (agrupamos por proyecto si se especifica o general)
                    var stockOrigen = await _context.InsumoStocks
                        .Where(s => s.IdInsumo == idInsumo && s.IdUbicacion == transferDto.IdUbicacionOrigen)
                        .ToListAsync();

                    if (!stockOrigen.Any()) continue;

                    var insumo = await _context.Insumos.FindAsync(idInsumo);
                    if (insumo == null) continue;

                    decimal cantidadAMover = 0;
                    foreach (var sSource in stockOrigen)
                    {
                        cantidadAMover += sSource.Cantidad;

                        // Transferir a destino
                        var stockDestino = await _context.InsumoStocks
                            .FirstOrDefaultAsync(s => s.IdInsumo == idInsumo 
                                                   && s.IdUbicacion == transferDto.IdUbicacionDestino 
                                                   && s.IdProyecto == sSource.IdProyecto);

                        if (stockDestino == null)
                        {
                            stockDestino = new InsumoStock
                            {
                                IdInsumo = idInsumo,
                                IdUbicacion = transferDto.IdUbicacionDestino,
                                IdProyecto = sSource.IdProyecto,
                                IdOrdenCompra = sSource.IdOrdenCompra,
                                Cantidad = sSource.Cantidad,
                                FechaActualizacion = DateTime.Now
                            };
                            _context.InsumoStocks.Add(stockDestino);
                        }
                        else
                        {
                            stockDestino.Cantidad += sSource.Cantidad;
                            stockDestino.FechaActualizacion = DateTime.Now;
                        }

                        // Eliminar de origen
                        _context.InsumoStocks.Remove(sSource);
                    }

                    // Actualizar ubicación "principal" del insumo si estaba en origen
                    if (insumo.IdUbicacion == transferDto.IdUbicacionOrigen)
                    {
                        insumo.IdUbicacion = transferDto.IdUbicacionDestino;
                    }

                    var movimiento = new InventarioMovimiento
                    {
                        IdInsumo = insumo.IdInsumo,
                        NombreInsumo = insumo.NombreInsumo,
                        TipoMovimiento = "Transferencia",
                        Cantidad = cantidadAMover,
                        FechaMovimiento = DateOnly.FromDateTime(DateTime.Now),
                        Origen = ubicacionOrigen.Codigo,
                        Destino = ubicacionDestino.Codigo,
                        Observacion = "Transferencia entre ubicaciones",
                        IdUsuario = transferDto.IdUsuario
                    };
                    _context.InventarioMovimientos.Add(movimiento);
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
