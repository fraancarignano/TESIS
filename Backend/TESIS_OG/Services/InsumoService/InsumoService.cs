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

      // Validar que no exista un insumo con el mismo nombre
      var existeNombre = await _context.Insumos
          .AnyAsync(i => i.NombreInsumo.ToLower() == insumoDto.NombreInsumo.ToLower());
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
        Estado = insumoDto.Estado ?? "Disponible",
        FechaActualizacion = DateOnly.FromDateTime(DateTime.Now)
      };

      _context.Insumos.Add(nuevoInsumo);
      await _context.SaveChangesAsync();

      return await ObtenerInsumoPorIdAsync(nuevoInsumo.IdInsumo);
    }

    public async Task<List<InsumoIndexDTO>> ObtenerTodosLosInsumosAsync()
    {
      var insumos = await _context.Insumos
          .Include(i => i.IdTipoInsumoNavigation)
          .Include(i => i.IdProveedorNavigation)
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
            Estado = i.Estado
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
            Estado = i.Estado
          })
          .FirstOrDefaultAsync();

      return insumo;
    }

    public async Task<InsumoIndexDTO?> ActualizarInsumoAsync(int id, InsumoEditDTO insumoDto)
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

      // Actualizar campos
      insumo.NombreInsumo = insumoDto.NombreInsumo;
      insumo.IdTipoInsumo = insumoDto.IdTipoInsumo;
      insumo.UnidadMedida = insumoDto.UnidadMedida;
      insumo.StockActual = insumoDto.StockActual;
      insumo.StockMinimo = insumoDto.StockMinimo;
      insumo.IdProveedor = insumoDto.IdProveedor;
      insumo.Estado = insumoDto.Estado;
      insumo.FechaActualizacion = DateOnly.FromDateTime(DateTime.Now);

      await _context.SaveChangesAsync();

      return await ObtenerInsumoPorIdAsync(id);
    }

    public async Task<bool> EliminarInsumoAsync(int id)
    {
      var insumo = await _context.Insumos.FindAsync(id);
      if (insumo == null) return false;

      _context.Insumos.Remove(insumo);
      await _context.SaveChangesAsync();

      return true;
    }

    public async Task<List<InsumoIndexDTO>> BuscarInsumosAsync(InsumoSearchDTO filtros)
    {
      var query = _context.Insumos
          .Include(i => i.IdTipoInsumoNavigation)
          .Include(i => i.IdProveedorNavigation)
          .AsQueryable();

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
        query = query.Where(i => i.Estado == filtros.Estado);

      // Filtro especial para stock bajo
      if (filtros.SoloStockBajo == true)
        query = query.Where(i => i.StockMinimo.HasValue && i.StockActual < i.StockMinimo.Value);

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
            Estado = i.Estado
          })
          .OrderByDescending(i => i.FechaActualizacion)
          .ToListAsync();

      return insumos;
    }

    public async Task<bool> CambiarEstadoAsync(int id, string nuevoEstado)
    {
      var insumo = await _context.Insumos.FindAsync(id);
      if (insumo == null) return false;

      insumo.Estado = nuevoEstado;
      insumo.FechaActualizacion = DateOnly.FromDateTime(DateTime.Now);

      await _context.SaveChangesAsync();

      return true;
    }
  }
}
