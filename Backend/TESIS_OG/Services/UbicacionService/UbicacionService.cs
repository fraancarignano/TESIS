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

        private static readonly HashSet<string> EstadosValidos =
            new(StringComparer.OrdinalIgnoreCase) { "Activa", "Ocupado", "BloqIN", "BloqOUT" };

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
                Nombre = dto.Nombre,
                Tipo = dto.Tipo ?? "Rack",
                Rack = dto.Rack,
                Division = dto.Division,
                Espacio = dto.Espacio,
                Descripcion = dto.Descripcion,
                EstadoUbicacion = "Activa"
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
                    Nombre = u.Nombre,
                    Tipo = u.Tipo,
                    Rack = u.Rack,
                    Division = u.Division,
                    Espacio = u.Espacio,
                    Descripcion = u.Descripcion,
                    EstadoUbicacion = u.EstadoUbicacion
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
                    Nombre = u.Nombre,
                    Tipo = u.Tipo,
                    Rack = u.Rack,
                    Division = u.Division,
                    Espacio = u.Espacio,
                    Descripcion = u.Descripcion,
                    EstadoUbicacion = u.EstadoUbicacion
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
            ubicacion.Nombre = dto.Nombre;
            ubicacion.Tipo = dto.Tipo ?? ubicacion.Tipo;
            ubicacion.Rack = dto.Rack;
            ubicacion.Division = dto.Division;
            ubicacion.Espacio = dto.Espacio;
            ubicacion.Descripcion = dto.Descripcion;
            // EstadoUbicacion NO se modifica aquí — se usa el endpoint PATCH /estado

            await _context.SaveChangesAsync();
            return await ObtenerUbicacionPorIdAsync(id);
        }

        public async Task<bool> EliminarUbicacionAsync(int id)
        {
            var ubicacion = await _context.Ubicacions.FindAsync(id);
            if (ubicacion == null) return false;

            var estaEnUso = await _context.Insumos.AnyAsync(i => i.IdUbicacion == id)
                            || await _context.Scraps.AnyAsync(s => s.IdUbicacion == id);
            if (estaEnUso) return false;

            _context.Ubicacions.Remove(ubicacion);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<UbicacionDTO?> CambiarEstadoAsync(int id, string nuevoEstado)
        {
            if (!EstadosValidos.Contains(nuevoEstado)) return null;

            var ubicacion = await _context.Ubicacions.FindAsync(id);
            if (ubicacion == null) return null;

            ubicacion.EstadoUbicacion = nuevoEstado;
            await _context.SaveChangesAsync();
            return await ObtenerUbicacionPorIdAsync(id);
        }

        public async Task<List<InsumoIndexDTO>> ObtenerInsumosPorUbicacionAsync(int idUbicacion)
        {
            return await _context.InsumoStocks
                .Include(s => s.IdInsumoNavigation)
                    .ThenInclude(i => i.IdTipoInsumoNavigation)
                .Include(s => s.IdProyectoNavigation)
                .Include(s => s.IdUbicacionNavigation)
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
                    Estado = s.IdInsumoNavigation.Estado != null && s.IdInsumoNavigation.Estado.ToLower() == "pulenta"
                      ? "Disponible"
                      : (s.IdInsumoNavigation.Estado ?? "Disponible"),
                    IdUbicacion = s.IdUbicacion,
                    CodigoUbicacion = s.IdUbicacionNavigation != null ? s.IdUbicacionNavigation.Codigo : null,
                    EstadoUbicacion = s.IdUbicacionNavigation != null ? s.IdUbicacionNavigation.EstadoUbicacion : "Activa",
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
                            EstadoUbicacion = s.IdUbicacionNavigation != null ? s.IdUbicacionNavigation.EstadoUbicacion : "Activa",
                            IdOrdenCompra = s.IdOrdenCompra,
                            Cantidad = s.Cantidad,
                            FechaActualizacion = s.FechaActualizacion
                        }
                    }
                })
                .ToListAsync();
        }

        public async Task<List<ScrapUbicacionDTO>> ObtenerScrapsPorUbicacionAsync(int idUbicacion)
        {
            return await _context.Scraps
                .Include(s => s.IdInsumoNavigation)
                .Include(s => s.IdProyectoNavigation)
                .Where(s => s.IdUbicacion == idUbicacion)
                .OrderByDescending(s => s.FechaRegistro)
                .Select(s => new ScrapUbicacionDTO
                {
                    IdScrap = s.IdScrap,
                    IdProyecto = s.IdProyecto,
                    CodigoProyecto = s.IdProyectoNavigation != null ? s.IdProyectoNavigation.CodigoProyecto : null,
                    NombreProyecto = s.IdProyectoNavigation != null ? s.IdProyectoNavigation.NombreProyecto : null,
                    IdInsumo = s.IdInsumo,
                    NombreInsumo = s.IdInsumoNavigation.NombreInsumo,
                    CantidadKg = s.CantidadScrap,
                    Motivo = s.Motivo,
                    AreaOcurrencia = s.AreaOcurrencia,
                    FechaRegistro = s.FechaRegistro
                })
                .ToListAsync();
        }

        public async Task<List<InventarioScrapDTO>> ObtenerInventarioScrapGeneralAsync()
        {
            return await _context.Scraps
                .Include(s => s.IdInsumoNavigation)
                .GroupBy(s => new { s.IdInsumo, s.IdInsumoNavigation.NombreInsumo })
                .Select(g => new InventarioScrapDTO
                {
                    IdInsumo = g.Key.IdInsumo,
                    NombreInsumo = g.Key.NombreInsumo,
                    CantidadTotalKg = g.Sum(x => x.CantidadScrap),
                    CantidadProyectos = g.Select(x => x.IdProyecto).Distinct().Count(),
                    UltimoRegistro = g.Max(x => x.FechaRegistro)
                })
                .OrderByDescending(x => x.CantidadTotalKg)
                .ToListAsync();
        }

        public async Task<List<ScrapProyectoInsumoDTO>> ObtenerInsumosProyectoParaScrapAsync(int idProyecto)
        {
            return await _context.InsumoStocks
                .Include(s => s.IdInsumoNavigation)
                .Where(s => s.IdProyecto == idProyecto && s.Cantidad > 0)
                .GroupBy(s => new
                {
                    s.IdInsumo,
                    s.IdInsumoNavigation.NombreInsumo,
                    s.IdInsumoNavigation.Color,
                    s.IdInsumoNavigation.UnidadMedida
                })
                .Select(g => new ScrapProyectoInsumoDTO
                {
                    IdInsumo = g.Key.IdInsumo,
                    NombreInsumo = g.Key.NombreInsumo,
                    Color = g.Key.Color,
                    UnidadMedida = g.Key.UnidadMedida,
                    CantidadAsignada = g.Sum(x => x.Cantidad),
                    StockProyecto = g.Sum(x => x.Cantidad)
                })
                .OrderBy(x => x.NombreInsumo)
                .ToListAsync();
        }

        public async Task<List<ScrapProyectoInsumoDTO>> ObtenerScrapsProyectoParaTransferenciaAsync(int idProyecto)
        {
            return await _context.Scraps
                .Include(s => s.IdInsumoNavigation)
                .Where(s => s.IdProyecto == idProyecto && s.CantidadScrap > 0)
                .GroupBy(s => new
                {
                    s.IdInsumo,
                    s.IdInsumoNavigation.NombreInsumo,
                    s.IdInsumoNavigation.Color,
                    s.IdInsumoNavigation.UnidadMedida
                })
                .Select(g => new ScrapProyectoInsumoDTO
                {
                    IdInsumo = g.Key.IdInsumo,
                    NombreInsumo = g.Key.NombreInsumo,
                    Color = g.Key.Color,
                    UnidadMedida = g.Key.UnidadMedida,
                    CantidadAsignada = g.Sum(x => x.CantidadScrap),
                    StockProyecto = g.Sum(x => x.CantidadScrap)
                })
                .OrderBy(x => x.NombreInsumo)
                .ToListAsync();
        }

        public async Task<(bool ok, string? error)> TransferirProyectoAScrapAsync(ScrapTransferDTO transferDto)
        {
            var proyecto = await _context.Proyectos.FindAsync(transferDto.IdProyecto);
            if (proyecto == null)
                return (false, "El proyecto seleccionado no existe.");

            var items = transferDto.Items
                .Where(i => i.Cantidad > 0)
                .GroupBy(i => i.IdInsumo)
                .Select(g => new ScrapTransferItemDTO
                {
                    IdInsumo = g.Key,
                    Cantidad = g.Sum(x => x.Cantidad),
                    Motivo = g.Select(x => x.Motivo).FirstOrDefault(m => !string.IsNullOrWhiteSpace(m))
                })
                .ToList();

            if (!items.Any())
                return (false, "Seleccioná al menos un insumo con cantidad mayor a cero.");

            if (items.Any(i => string.IsNullOrWhiteSpace(i.Motivo)))
                return (false, "El motivo es obligatorio para todos los insumos enviados a scrap.");

            var ubicacionScrap = await ObtenerOCrearUbicacionScrapAsync();

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                foreach (var item in items)
                {
                    var insumo = await _context.Insumos.FindAsync(item.IdInsumo);
                    if (insumo == null)
                    {
                        await transaction.RollbackAsync();
                        return (false, $"El insumo {item.IdInsumo} no existe.");
                    }

                    var stockProyecto = await _context.InsumoStocks
                        .Where(s => s.IdProyecto == transferDto.IdProyecto && s.IdInsumo == item.IdInsumo && s.Cantidad > 0)
                        .OrderByDescending(s => s.Cantidad)
                        .ToListAsync();

                    var disponible = stockProyecto.Sum(s => s.Cantidad);
                    if (item.Cantidad > disponible)
                    {
                        await transaction.RollbackAsync();
                        return (false, $"La cantidad de {insumo.NombreInsumo} supera el stock asignado al proyecto. Disponible: {disponible}.");
                    }

                    var restante = item.Cantidad;
                    foreach (var stock in stockProyecto)
                    {
                        if (restante <= 0) break;

                        var cantidadTomada = Math.Min(stock.Cantidad, restante);
                        stock.Cantidad -= cantidadTomada;
                        stock.FechaActualizacion = DateTime.Now;
                        restante -= cantidadTomada;

                        if (stock.Cantidad <= 0)
                            _context.InsumoStocks.Remove(stock);
                    }

                    var scrap = new Scrap
                    {
                        IdProyecto = transferDto.IdProyecto,
                        IdInsumo = item.IdInsumo,
                        CantidadScrap = item.Cantidad,
                        Motivo = item.Motivo,
                        Destino = "Scrap",
                        AreaOcurrencia = "Inventario",
                        FechaRegistro = DateTime.Now,
                        IdUbicacion = ubicacionScrap.IdUbicacion
                    };
                    _context.Scraps.Add(scrap);

                    _context.InventarioMovimientos.Add(new InventarioMovimiento
                    {
                        IdInsumo = item.IdInsumo,
                        NombreInsumo = insumo.NombreInsumo,
                        TipoMovimiento = "Scrap",
                        Cantidad = item.Cantidad,
                        FechaMovimiento = DateOnly.FromDateTime(DateTime.Now),
                        Origen = $"Proyecto {proyecto.CodigoProyecto ?? proyecto.IdProyecto.ToString()}",
                        Destino = ubicacionScrap.Codigo,
                        Observacion = $"Motivo: {item.Motivo}",
                        IdUsuario = transferDto.IdUsuario
                    });
                }

                await _context.SaveChangesAsync();
                await ActualizarTotalesScrapProyectoAsync(transferDto.IdProyecto);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return (true, null);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return (false, $"Error al transferir a scrap: {ex.Message}");
            }
        }

        public async Task<(bool ok, string? error)> TransferirScrapAProyectoAsync(ScrapTransferDTO transferDto)
        {
            var proyecto = await _context.Proyectos.FindAsync(transferDto.IdProyecto);
            if (proyecto == null)
                return (false, "El proyecto seleccionado no existe.");

            var items = transferDto.Items
                .Where(i => i.Cantidad > 0)
                .GroupBy(i => i.IdInsumo)
                .Select(g => new ScrapTransferItemDTO
                {
                    IdInsumo = g.Key,
                    Cantidad = g.Sum(x => x.Cantidad),
                    Motivo = g.Select(x => x.Motivo).FirstOrDefault(m => !string.IsNullOrWhiteSpace(m)) ?? "Reingreso desde scrap"
                })
                .ToList();

            if (!items.Any())
                return (false, "Seleccioná al menos un insumo con cantidad mayor a cero.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                foreach (var item in items)
                {
                    var insumo = await _context.Insumos.FindAsync(item.IdInsumo);
                    if (insumo == null)
                    {
                        await transaction.RollbackAsync();
                        return (false, $"El insumo {item.IdInsumo} no existe.");
                    }

                    var scraps = await _context.Scraps
                        .Where(s => s.IdProyecto == transferDto.IdProyecto && s.IdInsumo == item.IdInsumo && s.CantidadScrap > 0)
                        .OrderBy(s => s.FechaRegistro)
                        .ToListAsync();

                    var disponible = scraps.Sum(s => s.CantidadScrap);
                    if (item.Cantidad > disponible)
                    {
                        await transaction.RollbackAsync();
                        return (false, $"La cantidad de {insumo.NombreInsumo} supera el scrap disponible. Disponible: {disponible}.");
                    }

                    var restante = item.Cantidad;
                    foreach (var scrap in scraps)
                    {
                        if (restante <= 0) break;

                        var cantidadTomada = Math.Min(scrap.CantidadScrap, restante);
                        scrap.CantidadScrap -= cantidadTomada;
                        restante -= cantidadTomada;

                        if (scrap.CantidadScrap <= 0)
                            _context.Scraps.Remove(scrap);
                    }

                    var stockProyecto = await _context.InsumoStocks
                        .FirstOrDefaultAsync(s => s.IdProyecto == transferDto.IdProyecto && s.IdInsumo == item.IdInsumo);

                    if (stockProyecto == null)
                    {
                        stockProyecto = new InsumoStock
                        {
                            IdInsumo = item.IdInsumo,
                            IdProyecto = transferDto.IdProyecto,
                            IdUbicacion = insumo.IdUbicacion,
                            Cantidad = item.Cantidad,
                            FechaActualizacion = DateTime.Now
                        };
                        _context.InsumoStocks.Add(stockProyecto);
                    }
                    else
                    {
                        stockProyecto.Cantidad += item.Cantidad;
                        stockProyecto.FechaActualizacion = DateTime.Now;
                    }

                    _context.InventarioMovimientos.Add(new InventarioMovimiento
                    {
                        IdInsumo = item.IdInsumo,
                        NombreInsumo = insumo.NombreInsumo,
                        TipoMovimiento = "Reingreso Scrap",
                        Cantidad = item.Cantidad,
                        FechaMovimiento = DateOnly.FromDateTime(DateTime.Now),
                        Origen = "Scrap",
                        Destino = $"Proyecto {proyecto.CodigoProyecto ?? proyecto.IdProyecto.ToString()}",
                        Observacion = item.Motivo,
                        IdUsuario = transferDto.IdUsuario
                    });
                }

                await _context.SaveChangesAsync();
                await ActualizarTotalesScrapProyectoAsync(transferDto.IdProyecto);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return (true, null);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return (false, $"Error al devolver scrap al proyecto: {ex.Message}");
            }
        }

        private async Task<Ubicacion> ObtenerOCrearUbicacionScrapAsync()
        {
            var ubicacionScrap = await _context.Ubicacions
                .FirstOrDefaultAsync(u => u.Tipo == "Scrap" || u.Codigo == "SCRP" || u.Codigo == "SCRP-01");

            if (ubicacionScrap != null)
                return ubicacionScrap;

            ubicacionScrap = new Ubicacion
            {
                Codigo = "SCRP-01",
                Nombre = "Depósito General de Scrap",
                Tipo = "Scrap",
                Rack = 0,
                Division = 0,
                Espacio = 0,
                Descripcion = "Ubicación creada automáticamente para scrap",
                EstadoUbicacion = "Activa"
            };

            _context.Ubicacions.Add(ubicacionScrap);
            await _context.SaveChangesAsync();
            return ubicacionScrap;
        }

        private async Task ActualizarTotalesScrapProyectoAsync(int idProyecto)
        {
            var proyecto = await _context.Proyectos.FindAsync(idProyecto);
            if (proyecto == null) return;

            var totalScrap = await _context.Scraps
                .Where(s => s.IdProyecto == idProyecto)
                .SumAsync(s => (decimal?)s.CantidadScrap) ?? 0;

            var totalTelaAsignada = await _context.InsumoStocks
                .Where(s => s.IdProyecto == idProyecto)
                .SumAsync(s => (decimal?)s.Cantidad) ?? 0;

            proyecto.ScrapTotal = totalScrap;
            proyecto.ScrapPorcentaje = totalTelaAsignada + totalScrap > 0
                ? Math.Round((totalScrap / (totalTelaAsignada + totalScrap)) * 100, 2)
                : 0;
        }

        public async Task<List<ProyectoUbicacionDTO>> ObtenerProyectosPorUbicacionAsync(int idUbicacion)
        {
            return await _context.Despachos
                .Include(d => d.IdProyectoNavigation)
                .Where(d => d.IdUbicacion == idUbicacion && d.Estado != "Despachado")
                .Select(d => new ProyectoUbicacionDTO
                {
                    IdProyecto = d.IdProyecto,
                    NombreProyecto = d.IdProyectoNavigation != null ? d.IdProyectoNavigation.NombreProyecto : "Sin nombre",
                    CodigoProyecto = d.IdProyectoNavigation != null ? d.IdProyectoNavigation.CodigoProyecto : "S/C",
                    FechaIngreso = d.FechaCreacion
                })
                .ToListAsync();
        }

        public async Task<(bool ok, string? error)> TransferirInsumosAsync(InsumoTransferDTO transferDto)
        {
            var ubicacionDestino = await _context.Ubicacions.FindAsync(transferDto.IdUbicacionDestino);
            if (ubicacionDestino == null)
                return (false, "La ubicación de destino no existe.");

            // ── VALIDACIONES ESTADO DESTINO ──────────────────────────────────
            if (ubicacionDestino.EstadoUbicacion == "Ocupado")
                return (false, $"La ubicación '{ubicacionDestino.Codigo}' está Ocupada. No puede recibir más mercadería.");

            if (ubicacionDestino.EstadoUbicacion == "BloqIN")
                return (false, $"La ubicación '{ubicacionDestino.Codigo}' tiene Bloqueo de Ingreso (BLIN). No se puede ingresar mercadería.");

            // CASO 1: TRANSFERENCIA DESDE ORDEN DE COMPRA
            if (transferDto.IdOrdenCompra.HasValue)
            {
                var orden = await _context.OrdenCompras
                    .Include(o => o.DetalleOrdenCompras)
                    .FirstOrDefaultAsync(o => o.IdOrdenCompra == transferDto.IdOrdenCompra);
                if (orden == null)
                    return (false, "Orden de compra no encontrada.");

                var cantidadesAprobadas = await _context.InventarioMovimientos
                    .Where(m => m.IdOrdenCompra == orden.IdOrdenCompra
                             && m.TipoMovimiento == "Entrada"
                             && m.IdInsumo != null)
                    .GroupBy(m => m.IdInsumo!.Value)
                    .Select(g => new { IdInsumo = g.Key, Cantidad = g.Sum(m => m.Cantidad) })
                    .ToDictionaryAsync(x => x.IdInsumo, x => x.Cantidad);

                foreach (var idInsumo in transferDto.IdsInsumos)
                {
                    var detalle = orden.DetalleOrdenCompras.FirstOrDefault(d => d.IdInsumo == idInsumo);
                    if (detalle == null) continue;

                    if (!cantidadesAprobadas.TryGetValue(idInsumo, out var cantidadAIngresar) || cantidadAIngresar <= 0)
                        return (false, $"El insumo {idInsumo} no tiene cantidad aprobada en el control de recepción.");

                    var insumo = await _context.Insumos.FindAsync(idInsumo);
                    if (insumo == null) continue;

                    var stockTotalAntes = await _context.InsumoStocks
                        .Where(s => s.IdInsumo == idInsumo)
                        .SumAsync(s => (decimal?)s.Cantidad) ?? 0m;

                    // Actualizar ubicación y stock global según la cantidad real aprobada en recepción.
                    insumo.StockActual = stockTotalAntes + cantidadAIngresar;
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
                            Cantidad = cantidadAIngresar,
                            FechaActualizacion = DateTime.Now
                        };
                        _context.InsumoStocks.Add(stockEntry);
                    }
                    else
                    {
                        stockEntry.Cantidad += cantidadAIngresar;
                        stockEntry.FechaActualizacion = DateTime.Now;
                        stockEntry.IdOrdenCompra = orden.IdOrdenCompra;
                    }

                    var movimiento = new InventarioMovimiento
                    {
                        IdInsumo = insumo.IdInsumo,
                        NombreInsumo = insumo.NombreInsumo,
                        IdOrdenCompra = orden.IdOrdenCompra,
                        TipoMovimiento = "Transferencia",
                        Cantidad = cantidadAIngresar,
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
                if (ubicacionOrigen == null)
                    return (false, "La ubicación de origen no existe.");

                // ── VALIDACIONES ESTADO ORIGEN ───────────────────────────────
                if (ubicacionOrigen.EstadoUbicacion == "BloqOUT")
                    return (false, $"La ubicación '{ubicacionOrigen.Codigo}' tiene Bloqueo de Egreso (BLOUT). No se pueden mover los insumos.");

                if (ubicacionOrigen.EstadoUbicacion == "Ocupado")
                    return (false, $"La ubicación '{ubicacionOrigen.Codigo}' está marcada como Ocupada. Cambie el estado antes de transferir.");

                foreach (var idInsumo in transferDto.IdsInsumos)
                {
                    // Buscar stock en el origen
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

                // ── AUTO-LIBERAR ORIGEN SI QUEDÓ SIN STOCK ──────────────────
                var quedaStockEnOrigen = await _context.InsumoStocks
                    .AnyAsync(s => s.IdUbicacion == transferDto.IdUbicacionOrigen);

                if (!quedaStockEnOrigen && ubicacionOrigen.EstadoUbicacion == "Ocupado")
                {
                    ubicacionOrigen.EstadoUbicacion = "Activa";
                }
            }

            await _context.SaveChangesAsync();

            // ── AUTO-LIBERAR ORIGEN EN CASO 1 SI QUEDÓ SIN STOCK ────────────
            // (aplica después del SaveChanges para no interferir con los removes anteriores)

            return (true, null);
        }
    }
}
