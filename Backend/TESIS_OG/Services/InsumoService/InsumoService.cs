using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;
using TESIS_OG.DTOs.Insumos;
using TESIS_OG.Models;

namespace TESIS_OG.Services.InsumoService
{
  public class InsumoService : IInsumoService
  {
    private readonly Data.TamarindoDbContext _context;

    public InsumoService(Data.TamarindoDbContext context)
    {
      _context = context;
    }

    public async Task<InsumoIndexDTO?> CrearInsumoAsync(InsumoCreateDTO insumoDto)
    {
      // Validar que el tipo de insumo exista
      var tipoExiste = await _context.TipoInsumos
          .AnyAsync(t => t.IdTipoInsumo == insumoDto.IdTipoInsumo);
      if (!tipoExiste) return null;

      // Validar que el proveedor exista (si se proporciona)
      if (insumoDto.IdProveedor.HasValue)
      {
        var proveedorExiste = await _context.Proveedors
            .AnyAsync(p => p.IdProveedor == insumoDto.IdProveedor.Value);
        if (!proveedorExiste) return null;
      }

      // Validar que no exista un insumo con el mismo nombre Y mismo color
      var existeNombre = await _context.Insumos
          .AnyAsync(i => i.NombreInsumo.ToLower() == insumoDto.NombreInsumo.ToLower()
                      && (i.Color ?? "").ToLower() == (insumoDto.Color ?? "").ToLower());
      if (existeNombre) return null;

      // Crear el insumo
      var nuevoInsumo = new Insumo
      {
        NombreInsumo = insumoDto.NombreInsumo,
        IdTipoInsumo = insumoDto.IdTipoInsumo,
        UnidadMedida = insumoDto.UnidadMedida,
        StockActual = insumoDto.StockActual,
        StockMinimo = insumoDto.StockMinimo,
        IdProveedor = insumoDto.IdProveedor,
        IdUbicacion = insumoDto.IdUbicacion,
        Estado = NormalizarEstadoInsumo(insumoDto.Estado),
        Color = string.IsNullOrWhiteSpace(insumoDto.Color) ? null : insumoDto.Color.Trim().ToUpperInvariant(),
        TipoTela = insumoDto.TipoTela?.Trim(),
        FechaActualizacion = DateOnly.FromDateTime(DateTime.Now)
      };

      _context.Insumos.Add(nuevoInsumo);
      await _context.SaveChangesAsync();

      // Si se proporcionó una ubicación, crear entrada en InsumoStock
      if (insumoDto.IdUbicacion.HasValue && insumoDto.StockActual > 0)
      {
          var stockEntry = new InsumoStock
          {
              IdInsumo = nuevoInsumo.IdInsumo,
              IdUbicacion = insumoDto.IdUbicacion.Value,
              Cantidad = insumoDto.StockActual,
              FechaActualizacion = DateTime.Now
          };
          _context.InsumoStocks.Add(stockEntry);
          await _context.SaveChangesAsync();
      }

      return await ObtenerInsumoPorIdAsync(nuevoInsumo.IdInsumo);
    }

    public async Task<List<InsumoIndexDTO>> ObtenerTodosLosInsumosAsync()
    {
      var insumos = await _context.Insumos
          .Include(i => i.IdTipoInsumoNavigation)
          .Include(i => i.IdProveedorNavigation)
          .Include(i => i.IdUbicacionNavigation)
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
            CuitProveedor = i.IdProveedorNavigation != null ? i.IdProveedorNavigation.Cuit : null,
            Estado = i.Estado != null && i.Estado.ToLower() == "pulenta"
              ? "Disponible"
              : (i.Estado ?? "Disponible"),
            IdUbicacion = i.IdUbicacion,
            CodigoUbicacion = i.IdUbicacionNavigation != null ? i.IdUbicacionNavigation.Codigo : null,
            Color = i.Color,
            TipoTela = i.TipoTela
          })
          .OrderByDescending(i => i.FechaActualizacion)
          .ToListAsync();

      return insumos;
    }

    public async Task<List<InsumoIndexDTO>> ObtenerInsumosConStockAsync()
    {
      var insumos = await _context.Insumos
          .Include(i => i.IdTipoInsumoNavigation)
          .Include(i => i.IdProveedorNavigation)
          .Include(i => i.IdUbicacionNavigation)
          .Where(i => i.StockActual > 0 || i.InsumoStocks.Any())
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
            CuitProveedor = i.IdProveedorNavigation != null ? i.IdProveedorNavigation.Cuit : null,
            Estado = i.Estado != null && i.Estado.ToLower() == "pulenta"
              ? "Disponible"
              : (i.Estado ?? "Disponible"),
            IdUbicacion = i.IdUbicacion,
            CodigoUbicacion = i.IdUbicacionNavigation != null ? i.IdUbicacionNavigation.Codigo : null,
            Color = i.Color,
            TipoTela = i.TipoTela
          })
          .OrderByDescending(i => i.FechaActualizacion)
          .ToListAsync();

      return insumos;
    }

    public async Task<InsumoIndexDTO?> ObtenerInsumoPorIdAsync(int id)
    {
      var insumo = await _context.Insumos
          .Include(i => i.IdTipoInsumoNavigation)
          .Include(i => i.IdProveedorNavigation)
          .Include(i => i.IdUbicacionNavigation)
          .Include(i => i.InsumoStocks)
            .ThenInclude(s => s.IdProyectoNavigation)
          .Include(i => i.InsumoStocks)
            .ThenInclude(s => s.IdUbicacionNavigation)
          .Include(i => i.InsumoStocks)
            .ThenInclude(s => s.IdOrdenCompraNavigation)
          .Include(i => i.MaterialCalculados)
            .ThenInclude(mc => mc.IdProyectoNavigation)
          .Include(i => i.MaterialCalculados)
            .ThenInclude(mc => mc.IdProyectoPrendaNavigation)
                .ThenInclude(pp => pp!.IdTipoPrendaNavigation)
          .Where(i => i.IdInsumo == id)
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
            CuitProveedor = i.IdProveedorNavigation != null ? i.IdProveedorNavigation.Cuit : null,
            Estado = i.Estado != null && i.Estado.ToLower() == "pulenta"
              ? "Disponible"
              : (i.Estado ?? "Disponible"),
            IdUbicacion = i.IdUbicacion,
            CodigoUbicacion = i.IdUbicacionNavigation != null ? i.IdUbicacionNavigation.Codigo : null,
            Color = i.Color,
            TipoTela = i.TipoTela,
            DetalleStock = i.InsumoStocks.Select(s => new InsumoStockDTO
            {
                IdInsumoStock = s.IdInsumoStock,
                IdInsumo = s.IdInsumo,
                IdProyecto = s.IdProyecto,
                NombreProyecto = s.IdProyectoNavigation != null ? s.IdProyectoNavigation.NombreProyecto : "General",
                CodigoProyecto = s.IdProyectoNavigation != null ? s.IdProyectoNavigation.CodigoProyecto : null,
                IdUbicacion = s.IdUbicacion,
                CodigoUbicacion = s.IdUbicacionNavigation != null ? s.IdUbicacionNavigation.Codigo : null,
                IdOrdenCompra = s.IdOrdenCompra,
                NroOrden = s.IdOrdenCompraNavigation != null ? s.IdOrdenCompraNavigation.NroOrden : null,
                Cantidad = s.Cantidad,
                FechaActualizacion = s.FechaActualizacion
            }).ToList(),
            ProyectosAsignados = i.MaterialCalculados
                .Where(mc => mc.IdProyectoNavigation.Estado != "Archivado" && mc.IdProyectoNavigation.Estado != "Cancelado")
                .Select(mc => new ProyectoAsignadoDTO
                {
                    IdProyecto = mc.IdProyecto,
                    NombreProyecto = mc.IdProyectoNavigation.NombreProyecto,
                    CodigoProyecto = mc.IdProyectoNavigation.CodigoProyecto ?? "",
                    Cantidad = mc.CantidadManual ?? mc.CantidadCalculada,
                    UnidadMedida = mc.UnidadMedida,
                    TipoCalculo = mc.TipoCalculo,
                    NombrePrenda = mc.IdProyectoPrendaNavigation != null 
                        ? mc.IdProyectoPrendaNavigation.IdTipoPrendaNavigation!.NombrePrenda 
                        : "General"
                }).ToList()
          })
          .FirstOrDefaultAsync();

      return insumo;
    }

    public async Task<InsumoIndexDTO?> ActualizarInsumoAsync(int id, InsumoEditDTO insumoDto, int? idUsuario = null)
    {
      var insumo = await _context.Insumos.FindAsync(id);
      if (insumo == null) return null;

      // Validar que el tipo de insumo exista
      var tipoExiste = await _context.TipoInsumos
          .AnyAsync(t => t.IdTipoInsumo == insumoDto.IdTipoInsumo);
      if (!tipoExiste) return null;

      // Validar que el proveedor exista (si se proporciona)
      if (insumoDto.IdProveedor.HasValue)
      {
        var proveedorExiste = await _context.Proveedors
            .AnyAsync(p => p.IdProveedor == insumoDto.IdProveedor.Value);
        if (!proveedorExiste) return null;
      }

      // Validar que no exista otro insumo con el mismo nombre
      var existeNombre = await _context.Insumos
          .AnyAsync(i => i.NombreInsumo.ToLower() == insumoDto.NombreInsumo.ToLower() && i.IdInsumo != id);
      if (existeNombre) return null;

      // Registrar movimiento si cambió el stock
      if (insumo.StockActual != insumoDto.StockActual)
      {
          decimal diferencia = insumoDto.StockActual - insumo.StockActual;
          var movimiento = new InventarioMovimiento
          {
              IdInsumo = id,
              NombreInsumo = insumo.NombreInsumo,
              TipoMovimiento = "Editar",
              Cantidad = diferencia,
              FechaMovimiento = DateOnly.FromDateTime(DateTime.Now),
              Origen = "-",
              Destino = insumo.IdUbicacionNavigation?.Codigo ?? "Sin Ubicación",
              Observacion = "Cambio manual de stock",
              IdUsuario = idUsuario
          };
          _context.InventarioMovimientos.Add(movimiento);
      }

      // Actualizar campos
      insumo.NombreInsumo = insumoDto.NombreInsumo;
      insumo.IdTipoInsumo = insumoDto.IdTipoInsumo;
      insumo.UnidadMedida = insumoDto.UnidadMedida;
      insumo.StockActual = insumoDto.StockActual;
      insumo.StockMinimo = insumoDto.StockMinimo;
      insumo.IdProveedor = insumoDto.IdProveedor;
      insumo.IdUbicacion = insumoDto.IdUbicacion;
      insumo.Estado = NormalizarEstadoInsumo(insumoDto.Estado);
      insumo.Color = string.IsNullOrWhiteSpace(insumoDto.Color) ? null : insumoDto.Color.Trim().ToUpperInvariant();
      insumo.TipoTela = insumoDto.TipoTela?.Trim();
      insumo.FechaActualizacion = DateOnly.FromDateTime(DateTime.Now);

      await _context.SaveChangesAsync();

      // Sincronizar InsumoStock para la ubicación "General" (sin proyecto)
      if (insumo.IdUbicacion.HasValue)
      {
          var stockEntry = await _context.InsumoStocks
              .FirstOrDefaultAsync(s => s.IdInsumo == id && s.IdUbicacion == insumo.IdUbicacion && s.IdProyecto == null);

          if (stockEntry == null)
          {
              stockEntry = new InsumoStock
              {
                  IdInsumo = id,
                  IdUbicacion = insumo.IdUbicacion.Value,
                  Cantidad = insumo.StockActual,
                  FechaActualizacion = DateTime.Now
              };
              _context.InsumoStocks.Add(stockEntry);
          }
          else
          {
              stockEntry.Cantidad = insumo.StockActual;
              stockEntry.FechaActualizacion = DateTime.Now;
          }
          await _context.SaveChangesAsync();
      }

      return await ObtenerInsumoPorIdAsync(id);
    }

    public async Task<bool> EliminarInsumoAsync(int id, int? idUsuario = null)
    {
      var insumo = await _context.Insumos
          .Include(i => i.InsumoStocks)
          .FirstOrDefaultAsync(i => i.IdInsumo == id);
          
      if (insumo == null) return false;

      // Registrar movimiento antes de eliminar
      var movimiento = new InventarioMovimiento
      {
          IdInsumo = null,
          NombreInsumo = insumo.NombreInsumo,
          TipoMovimiento = "Eliminar",
          Cantidad = insumo.StockActual,
          FechaMovimiento = DateOnly.FromDateTime(DateTime.Now),
          Origen = "-",
          Destino = "-",
          Observacion = "Insumo eliminado del sistema",
          IdUsuario = idUsuario
      };
      _context.InventarioMovimientos.Add(movimiento);

      // Limpiar stock asociado para evitar errores de integridad
      if (insumo.InsumoStocks.Any())
      {
          _context.InsumoStocks.RemoveRange(insumo.InsumoStocks);
      }

      _context.Insumos.Remove(insumo);
      await _context.SaveChangesAsync();

      return true;
    }

    public async Task<List<InsumoIndexDTO>> BuscarInsumosAsync(InsumoSearchDTO filtros)
    {
      var query = _context.Insumos
          .Include(i => i.IdTipoInsumoNavigation)
          .Include(i => i.IdProveedorNavigation)
          .Include(i => i.IdUbicacionNavigation)
          .AsQueryable();

      return await AplicarBusquedaAsync(query, filtros);
    }

    public async Task<List<InsumoIndexDTO>> BuscarInsumosConStockAsync(InsumoSearchDTO filtros)
    {
      var query = _context.Insumos
          .Include(i => i.IdTipoInsumoNavigation)
          .Include(i => i.IdProveedorNavigation)
          .Include(i => i.IdUbicacionNavigation)
          .Where(i => i.StockActual > 0 || i.InsumoStocks.Any())
          .AsQueryable();

      return await AplicarBusquedaAsync(query, filtros);
    }

    private async Task<List<InsumoIndexDTO>> AplicarBusquedaAsync(IQueryable<Insumo> query, InsumoSearchDTO filtros)
    {

      // Aplicar filtros
      if (!string.IsNullOrEmpty(filtros.NombreInsumo))
        query = query.Where(i => i.NombreInsumo.Contains(filtros.NombreInsumo));

      if (filtros.IdTipoInsumo.HasValue)
        query = query.Where(i => i.IdTipoInsumo == filtros.IdTipoInsumo.Value);

      if (!string.IsNullOrEmpty(filtros.UnidadMedida))
        query = query.Where(i => i.UnidadMedida == filtros.UnidadMedida);

      if (filtros.IdProveedor.HasValue)
        query = query.Where(i => i.IdProveedor == filtros.IdProveedor.Value);

      if (!string.IsNullOrEmpty(filtros.Estado))
      {
        var estadoBuscado = NormalizarEstadoInsumo(filtros.Estado);
        if (estadoBuscado == "Disponible")
        {
          query = query.Where(i =>
            i.Estado == "Disponible" ||
            (i.Estado != null && i.Estado.ToLower() == "pulenta"));
        }
        else
        {
          query = query.Where(i => i.Estado == estadoBuscado);
        }
      }

      // Filtro especial para stock bajo
      if (filtros.SoloStockBajo == true)
        query = query.Where(i => i.StockMinimo.HasValue && i.StockActual < i.StockMinimo.Value);

      // Filtro por rango de fechas
      if (filtros.FechaDesde.HasValue)
        query = query.Where(i => i.FechaActualizacion >= filtros.FechaDesde.Value);

      if (filtros.FechaHasta.HasValue)
        query = query.Where(i => i.FechaActualizacion <= filtros.FechaHasta.Value);

      var insumos = await query
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
            CuitProveedor = i.IdProveedorNavigation != null ? i.IdProveedorNavigation.Cuit : null,
            Estado = i.Estado != null && i.Estado.ToLower() == "pulenta"
              ? "Disponible"
              : (i.Estado ?? "Disponible"),
            IdUbicacion = i.IdUbicacion,
            CodigoUbicacion = i.IdUbicacionNavigation != null ? i.IdUbicacionNavigation.Codigo : null,
            Color = i.Color,
            TipoTela = i.TipoTela
          })
          .OrderByDescending(i => i.FechaActualizacion)
          .ToListAsync();

      return insumos;
    }

    public async Task<bool> CambiarEstadoAsync(int id, string nuevoEstado, int? idUsuario = null)
    {
      var insumo = await _context.Insumos.FindAsync(id);
      if (insumo == null) return false;

      var estadoNormalizado = NormalizarEstadoInsumo(nuevoEstado);
      insumo.Estado = estadoNormalizado;
      insumo.FechaActualizacion = DateOnly.FromDateTime(DateTime.Now);

      // Registrar movimiento de cambio de estado
      var movimiento = new InventarioMovimiento
      {
          IdInsumo = id,
          NombreInsumo = insumo.NombreInsumo,
          TipoMovimiento = "Editar",
          Cantidad = 0,
          FechaMovimiento = DateOnly.FromDateTime(DateTime.Now),
          Origen = "-",
          Destino = "-",
          Observacion = $"Cambio de estado a: {estadoNormalizado}",
          IdUsuario = idUsuario
      };
      _context.InventarioMovimientos.Add(movimiento);

      await _context.SaveChangesAsync();

      return true;
    }

    private static string NormalizarEstadoInsumo(string? estado)    {
      if (string.IsNullOrWhiteSpace(estado))
        return "Disponible";

      var estadoLimpio = estado.Trim();
      if (estadoLimpio.Equals("pulenta", StringComparison.OrdinalIgnoreCase))
        return "Disponible";

      return estadoLimpio;
    }

    public async Task<string?> EditarStockEntryAsync(int idInsumoStock, decimal nuevaCantidad)
    {
      if (nuevaCantidad < 0) return "La cantidad no puede ser negativa";
      var entry = await _context.InsumoStocks.FindAsync(idInsumoStock);
      if (entry == null) return "Registro de stock no encontrado";
      var insumo = await _context.Insumos.FindAsync(entry.IdInsumo);
      if (insumo == null) return "Insumo no encontrado";

      var diferencia = nuevaCantidad - entry.Cantidad;

      if (diferencia > 0)
      {
        var stockGeneral = await _context.InsumoStocks
            .Where(s => s.IdInsumo == entry.IdInsumo && s.IdProyecto == null)
            .SumAsync(s => (decimal?)s.Cantidad) ?? 0;
        if (stockGeneral < diferencia)
          return $"Stock general insuficiente. Disponible: {stockGeneral}, Requerido: {diferencia}";

        var entradaGeneral = await _context.InsumoStocks
            .FirstOrDefaultAsync(s => s.IdInsumo == entry.IdInsumo && s.IdProyecto == null);
        if (entradaGeneral != null)
        {
          entradaGeneral.Cantidad -= diferencia;
          entradaGeneral.FechaActualizacion = DateTime.Now;
          if (entradaGeneral.Cantidad <= 0) _context.InsumoStocks.Remove(entradaGeneral);
        }
      }
      else if (diferencia < 0)
      {
        var entradaGeneral = await _context.InsumoStocks
            .FirstOrDefaultAsync(s => s.IdInsumo == entry.IdInsumo && s.IdProyecto == null);
        if (entradaGeneral != null)
        {
          entradaGeneral.Cantidad += Math.Abs(diferencia);
          entradaGeneral.FechaActualizacion = DateTime.Now;
        }
        else
        {
          _context.InsumoStocks.Add(new InsumoStock
          {
            IdInsumo = entry.IdInsumo, IdUbicacion = entry.IdUbicacion,
            Cantidad = Math.Abs(diferencia), FechaActualizacion = DateTime.Now
          });
        }
      }

      entry.Cantidad = nuevaCantidad;
      entry.FechaActualizacion = DateTime.Now;
      insumo.StockActual += diferencia;
      if (insumo.StockActual < 0) insumo.StockActual = 0;
      insumo.FechaActualizacion = DateOnly.FromDateTime(DateTime.Now);
      if (nuevaCantidad == 0) _context.InsumoStocks.Remove(entry);

      await _context.SaveChangesAsync();
      return null;
    }

    public async Task<(bool ok, string mensaje)> DevolverStockAlGeneralAsync(int idInsumoStock)
    {
      var entry = await _context.InsumoStocks.FindAsync(idInsumoStock);
      if (entry == null) return (false, "Registro de stock no encontrado");
      if (entry.IdProyecto == null) return (false, "Este registro ya es stock general");
      var insumo = await _context.Insumos.FindAsync(entry.IdInsumo);
      if (insumo == null) return (false, "Insumo no encontrado");

      var entradaGeneral = await _context.InsumoStocks
          .FirstOrDefaultAsync(s => s.IdInsumo == entry.IdInsumo && s.IdProyecto == null);
      if (entradaGeneral != null)
      {
        entradaGeneral.Cantidad += entry.Cantidad;
        entradaGeneral.FechaActualizacion = DateTime.Now;
      }
      else
      {
        _context.InsumoStocks.Add(new InsumoStock
        {
          IdInsumo = entry.IdInsumo, IdUbicacion = entry.IdUbicacion,
          Cantidad = entry.Cantidad, FechaActualizacion = DateTime.Now
        });
      }

      insumo.FechaActualizacion = DateOnly.FromDateTime(DateTime.Now);
      _context.InsumoStocks.Remove(entry);
      await _context.SaveChangesAsync();
      return (true, $"Se devolvieron {entry.Cantidad} unidades al stock general");
    }
  }
}

