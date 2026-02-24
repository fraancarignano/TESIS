using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;
using TESIS_OG.DTOs.Movimientos;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TESIS_OG.Services.MovimientoService
{
    public class MovimientoService : IMovimientoService
    {
        private readonly TamarindoDbContext _context;

        public MovimientoService(TamarindoDbContext context)
        {
            _context = context;
        }

        public async Task<List<MovimientoIndexDTO>> ObtenerMovimientosAsync(MovimientoSearchDTO filtros)
        {
            var query = _context.InventarioMovimientos
                .Include(m => m.IdUsuarioNavigation)
                .Include(m => m.IdInsumoNavigation)
                .AsQueryable();

            if (filtros.FechaDesde.HasValue)
                query = query.Where(m => m.FechaMovimiento >= filtros.FechaDesde.Value);

            if (filtros.FechaHasta.HasValue)
                query = query.Where(m => m.FechaMovimiento <= filtros.FechaHasta.Value);

            if (!string.IsNullOrEmpty(filtros.TerminoBusqueda))
            {
                var term = filtros.TerminoBusqueda.ToLower();
                query = query.Where(m => m.NombreInsumo!.ToLower().Contains(term) || 
                                       m.TipoMovimiento.ToLower().Contains(term) ||
                                       m.Origen.ToLower().Contains(term) ||
                                       m.Destino!.ToLower().Contains(term));
            }

            var movimientos = await query
                .OrderByDescending(m => m.FechaMovimiento)
                .ThenByDescending(m => m.IdMovimiento)
                .Select(m => new MovimientoIndexDTO
                {
                    IdMovimiento = m.IdMovimiento,
                    IdInsumo = m.IdInsumo,
                    NombreInsumo = m.NombreInsumo,
                    TipoMovimiento = m.TipoMovimiento,
                    Cantidad = m.Cantidad,
                    UnidadesDetalle = FormatearUnidades(m),
                    FechaMovimiento = m.FechaMovimiento,
                    Usuario = m.IdUsuarioNavigation != null ? m.IdUsuarioNavigation.NombreUsuario : "Sistema",
                    Origen = m.Origen,
                    Destino = m.Destino,
                    Observacion = m.Observacion
                })
                .ToListAsync();

            return movimientos;
        }

        private static string FormatearUnidades(Models.InventarioMovimiento m)
        {
            string prefijo = "";
            if (m.TipoMovimiento == "Editar")
            {
                prefijo = m.Cantidad >= 0 ? "+ " : "";
            }
            
            string unidad = m.IdInsumoNavigation?.UnidadMedida ?? "";
            return $"{prefijo}{m.Cantidad} {unidad}".Trim();
        }
    }
}
