using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;
using TESIS_OG.DTOs.OrdenCompra;
using TESIS_OG.Models;

namespace TESIS_OG.Services.OrdenCompraService
{
    public class OrdenCompraService : IOrdenCompraService
    {
        private readonly Data.TamarindoDbContext _context;

        public OrdenCompraService(Data.TamarindoDbContext context)
        {
            _context = context;
        }

        public async Task<OrdenCompraIndexDTO?> CrearOrdenCompraAsync(OrdenCompraCreateDTO ordenDto)
        {
            try
            {
                // Validar que el proveedor exista
                var proveedorExiste = await _context.Proveedors
                    .AnyAsync(p => p.IdProveedor == ordenDto.IdProveedor);
                if (!proveedorExiste) return null;

                // Validar que todos los insumos existan
                foreach (var detalle in ordenDto.Detalles)
                {
                    var insumo = await _context.Insumos
                        .FirstOrDefaultAsync(i => i.IdInsumo == detalle.IdInsumo);

                    if (insumo == null) return null;
                    if (detalle.Cantidad <= 0) return null;
                    if (detalle.PrecioUnitario <= 0) return null;

                    detalle.Subtotal = detalle.Cantidad * detalle.PrecioUnitario;
                }

                // Ajustar total automáticamente
                var totalCalculado = ordenDto.Detalles.Sum(d => d.Subtotal);
                if (Math.Abs(totalCalculado - ordenDto.TotalOrden) > 0.01m)
                    ordenDto.TotalOrden = totalCalculado;

                // Generar código automático: OC-YYYYMMDD-XXXX
                var hoy = DateTime.Now.ToString("yyyyMMdd");
                var contadorHoy = await _context.OrdenCompras
                    .CountAsync(o => o.NroOrden.StartsWith($"OC-{hoy}-"));
                var nroOrden = $"OC-{hoy}-{(contadorHoy + 1):D4}";

                // Crear la orden de compra (estado siempre Pendiente al crear)
                var nuevaOrden = new OrdenCompra
                {
                    NroOrden = nroOrden,
                    IdProveedor = ordenDto.IdProveedor,
                    Descripcion = ordenDto.Descripcion?.Trim(),
                    FechaSolicitud = ordenDto.FechaSolicitud,
                    FechaEntregaEstimada = ordenDto.FechaEntregaEstimada,
                    Estado = "Pendiente",
                    TotalOrden = ordenDto.TotalOrden
                };

                _context.OrdenCompras.Add(nuevaOrden);
                await _context.SaveChangesAsync();

                // Crear los detalles
                foreach (var detalleDto in ordenDto.Detalles)
                {
                    var detalle = new DetalleOrdenCompra
                    {
                        IdOrdenCompra = nuevaOrden.IdOrdenCompra,
                        IdInsumo = detalleDto.IdInsumo,
                        Cantidad = detalleDto.Cantidad,
                        PrecioUnitario = detalleDto.PrecioUnitario,
                        Subtotal = detalleDto.Subtotal
                    };

                    _context.DetalleOrdenCompras.Add(detalle);
                }

                await _context.SaveChangesAsync();

                return await ObtenerOrdenPorIdAsync(nuevaOrden.IdOrdenCompra);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error en CrearOrdenCompraAsync: {ex.Message}");
                if (ex.InnerException != null) Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                throw;
            }
        }

        public async Task<List<OrdenCompraIndexDTO>> ObtenerTodasLasOrdenesAsync()
        {
            var ordenes = await _context.OrdenCompras
                .Include(o => o.IdProveedorNavigation)
                .Include(o => o.DetalleOrdenCompras)
                    .ThenInclude(d => d.IdInsumoNavigation)
                .OrderByDescending(o => o.FechaSolicitud)
                .ToListAsync();

            var result = new List<OrdenCompraIndexDTO>();
            foreach (var o in ordenes)
                result.Add(await MapearOrdenAsync(o));
            return result;
        }

        public async Task<OrdenCompraIndexDTO?> ObtenerOrdenPorIdAsync(int id)
        {
            var orden = await _context.OrdenCompras
                .Include(o => o.IdProveedorNavigation)
                .Include(o => o.DetalleOrdenCompras)
                    .ThenInclude(d => d.IdInsumoNavigation)
                .FirstOrDefaultAsync(o => o.IdOrdenCompra == id);

            return orden == null ? null : await MapearOrdenAsync(orden);
        }

        private async Task<OrdenCompraIndexDTO> MapearOrdenAsync(OrdenCompra o)
        {
            // Obtener cantidades recibidas por insumo desde movimientos de inventario
            var movimientos = await _context.InventarioMovimientos
                .Where(m => m.IdOrdenCompra == o.IdOrdenCompra && m.TipoMovimiento == "Entrada")
                .GroupBy(m => m.IdInsumo)
                .Select(g => new { IdInsumo = g.Key, TotalRecibido = g.Sum(m => m.Cantidad) })
                .ToListAsync();

            var recibidoMap = movimientos.ToDictionary(m => m.IdInsumo, m => m.TotalRecibido);

            return new OrdenCompraIndexDTO
            {
                IdOrdenCompra = o.IdOrdenCompra,
                NroOrden = o.NroOrden,
                IdProveedor = o.IdProveedor,
                NombreProveedor = o.IdProveedorNavigation?.NombreProveedor,
                Descripcion = o.Descripcion,
                FechaSolicitud = o.FechaSolicitud,
                FechaEntregaEstimada = o.FechaEntregaEstimada,
                Estado = o.Estado,
                TotalOrden = o.TotalOrden ?? 0m,
                FechaHabilitacionControl = o.FechaHabilitacionControl,
                FechaRecepcionControl = o.FechaRecepcionControl,
                ObservacionControl = o.ObservacionControl,
                Detalles = o.DetalleOrdenCompras.Select(d => new DetalleOrdenCompraIndexDTO
                {
                    IdDetalle = d.IdDetalle,
                    IdInsumo = d.IdInsumo,
                    NombreInsumo = d.IdInsumoNavigation?.NombreInsumo,
                    Cantidad = d.Cantidad,
                    CantidadRecibida = recibidoMap.TryGetValue(d.IdInsumo, out var rec) ? rec : 0,
                    PrecioUnitario = d.PrecioUnitario,
                    Subtotal = d.Subtotal ?? 0m
                }).ToList()
            };
        }

        public async Task<OrdenCompraIndexDTO?> ActualizarOrdenCompraAsync(int id, OrdenCompraEditDTO ordenDto)
        {
            var orden = await _context.OrdenCompras
                .Include(o => o.DetalleOrdenCompras)
                .FirstOrDefaultAsync(o => o.IdOrdenCompra == id);

            if (orden == null) return null;

            // Validar que el proveedor exista
            var proveedorExiste = await _context.Proveedors
                .AnyAsync(p => p.IdProveedor == ordenDto.IdProveedor);
            if (!proveedorExiste) return null;

            // Actualizar la orden
            orden.NroOrden = ordenDto.NroOrden;
            orden.IdProveedor = ordenDto.IdProveedor;
            orden.FechaSolicitud = ordenDto.FechaSolicitud;
            orden.FechaEntregaEstimada = ordenDto.FechaEntregaEstimada;
            orden.Estado = ordenDto.Estado;
            orden.TotalOrden = ordenDto.TotalOrden;

            // Eliminar detalles anteriores
            _context.DetalleOrdenCompras.RemoveRange(orden.DetalleOrdenCompras);

            // Agregar nuevos detalles
            foreach (var detalleDto in ordenDto.Detalles)
            {
                var detalle = new DetalleOrdenCompra
                {
                    IdOrdenCompra = orden.IdOrdenCompra,
                    IdInsumo = detalleDto.IdInsumo,
                    Cantidad = detalleDto.Cantidad,
                    PrecioUnitario = detalleDto.PrecioUnitario,
                    Subtotal = detalleDto.Subtotal
                };

                _context.DetalleOrdenCompras.Add(detalle);
            }

            await _context.SaveChangesAsync();

            return await ObtenerOrdenPorIdAsync(id);
        }

        public async Task<OrdenCompraIndexDTO?> AnularOrdenAsync(int id)
        {
            var orden = await _context.OrdenCompras.FirstOrDefaultAsync(o => o.IdOrdenCompra == id);
            if (orden == null) return null;

            if (orden.Estado == "Recibida" || orden.Estado == "PendienteControl" || orden.Estado == "Anulada")
                return null;

            orden.Estado = "Anulada";
            await _context.SaveChangesAsync();
            return await ObtenerOrdenPorIdAsync(id);
        }

        public async Task<bool> EliminarOrdenCompraAsync(int id)
        {
            var orden = await _context.OrdenCompras
                .Include(o => o.DetalleOrdenCompras)
                .FirstOrDefaultAsync(o => o.IdOrdenCompra == id);

            if (orden == null) return false;

            // Solo se pueden eliminar órdenes anuladas
            if (orden.Estado != "Anulada") return false;

            _context.DetalleOrdenCompras.RemoveRange(orden.DetalleOrdenCompras);
            _context.OrdenCompras.Remove(orden);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<OrdenCompraIndexDTO?> RegistrarRecepcionAsync(OrdenCompraReceiveDTO recepcionDto)
        {
            // 1. Buscar la orden de compra
            var orden = await _context.OrdenCompras
                .Include(o => o.DetalleOrdenCompras)
                .FirstOrDefaultAsync(o => o.IdOrdenCompra == recepcionDto.IdOrdenCompra);

            if (orden == null) return null;

            // 2. Validar que la orden esté en estado válido para recibir
            if (orden.Estado == "Recibida" || orden.Estado == "Cancelada")
            {
                return null; // No se puede recibir una orden ya recibida o cancelada
            }

            // 3. Validar que todos los insumos existan
            foreach (var detalle in recepcionDto.Detalles)
            {
                var insumo = await _context.Insumos
                    .FirstOrDefaultAsync(i => i.IdInsumo == detalle.IdInsumo);

                if (insumo == null) return null;

                if (detalle.CantidadRecibida <= 0) return null;
            }

            // 4. Actualizar el stock de cada insumo
            foreach (var detalle in recepcionDto.Detalles)
            {
                var insumo = await _context.Insumos
                    .FirstOrDefaultAsync(i => i.IdInsumo == detalle.IdInsumo);

                if (insumo != null)
                {
                    // Incrementar el stock
                    insumo.StockActual += detalle.CantidadRecibida;
                    insumo.FechaActualizacion = DateOnly.FromDateTime(DateTime.Now);
                }

                // 5. Registrar el movimiento de inventario
                var movimiento = new InventarioMovimiento
                {
                    IdInsumo = detalle.IdInsumo,
                    IdOrdenCompra = orden.IdOrdenCompra,
                    TipoMovimiento = "Entrada",
                    Cantidad = detalle.CantidadRecibida,
                    FechaMovimiento = DateOnly.Parse(recepcionDto.FechaRecepcion),
                    Origen = "Recepción de Orden de Compra",
                    Observacion = detalle.ObservacionDetalle ?? recepcionDto.Observacion,
                    IdUsuario = recepcionDto.IdUsuario
                };

                _context.InventarioMovimientos.Add(movimiento);
            }

            // 6. Actualizar el estado de la orden a "Recibida"
            orden.Estado = "Recibida";

            // 7. Guardar todos los cambios
            await _context.SaveChangesAsync();

            // 8. Retornar la orden actualizada
            return await ObtenerOrdenPorIdAsync(orden.IdOrdenCompra);
        }

        // ==================== CONTROL DE RECEPCIÓN ====================

        public async Task<OrdenCompraIndexDTO?> HabilitarControlAsync(int id, HabilitarControlDTO dto)
        {
            var orden = await _context.OrdenCompras.FirstOrDefaultAsync(o => o.IdOrdenCompra == id);
            if (orden == null) return null;

            // Solo se puede habilitar si está Pendiente o Aprobada
            if (orden.Estado == "PendienteControl" || orden.Estado == "Recibida" || orden.Estado == "Cancelada")
                return null;

            orden.Estado = "PendienteControl";
            orden.FechaHabilitacionControl = DateOnly.FromDateTime(DateTime.Now);

            await _context.SaveChangesAsync();
            return await ObtenerOrdenPorIdAsync(id);
        }

        public async Task<List<OrdenCompraIndexDTO>> ObtenerOrdenesPendienteControlAsync()
        {
            var ordenes = await _context.OrdenCompras
                .Include(o => o.IdProveedorNavigation)
                .Include(o => o.DetalleOrdenCompras)
                    .ThenInclude(d => d.IdInsumoNavigation)
                .Where(o => o.Estado == "PendienteControl")
                .OrderByDescending(o => o.FechaSolicitud)
                .ToListAsync();

            var result = new List<OrdenCompraIndexDTO>();
            foreach (var o in ordenes)
                result.Add(await MapearOrdenAsync(o));
            return result;
        }

        public async Task<OrdenCompraIndexDTO?> RegistrarControlRecepcionAsync(ControlRecepcionDTO dto)
        {
            var orden = await _context.OrdenCompras
                .Include(o => o.DetalleOrdenCompras)
                .FirstOrDefaultAsync(o => o.IdOrdenCompra == dto.IdOrdenCompra);

            if (orden == null) return null;

            // Solo se puede controlar si está PendienteControl
            if (orden.Estado != "PendienteControl") return null;

            // Validar detalles — cantidad 0 es válida en recontrol (significa "no llegó nada más de este insumo")
            foreach (var detalle in dto.Detalles)
            {
                var insumo = await _context.Insumos.FirstOrDefaultAsync(i => i.IdInsumo == detalle.IdInsumo);
                if (insumo == null) return null;
                if (detalle.CantidadRecibida < 0) return null;
            }

            // Actualizar stock y registrar movimientos — solo para los que tienen cantidad > 0
            var fechaControl = DateOnly.Parse(dto.FechaControl);
            foreach (var detalle in dto.Detalles.Where(d => d.CantidadRecibida > 0))
            {
                var insumo = await _context.Insumos.FirstOrDefaultAsync(i => i.IdInsumo == detalle.IdInsumo);
                if (insumo != null)
                {
                    insumo.StockActual += detalle.CantidadRecibida;
                    insumo.FechaActualizacion = DateOnly.FromDateTime(DateTime.Now);
                }

                _context.InventarioMovimientos.Add(new InventarioMovimiento
                {
                    IdInsumo = detalle.IdInsumo,
                    IdOrdenCompra = orden.IdOrdenCompra,
                    TipoMovimiento = "Entrada",
                    Cantidad = detalle.CantidadRecibida,
                    FechaMovimiento = fechaControl,
                    Origen = "Control Recepción de Orden de Compra",
                    Observacion = detalle.ObservacionDetalle ?? dto.Observacion,
                    IdUsuario = dto.IdUsuarioControl
                });
            }

            // Actualizar estado de la orden
            orden.Estado = "Recibida";
            orden.FechaRecepcionControl = fechaControl;
            orden.IdUsuarioControl = dto.IdUsuarioControl;
            orden.ObservacionControl = dto.Observacion;

            await _context.SaveChangesAsync();
            return await ObtenerOrdenPorIdAsync(orden.IdOrdenCompra);
        }

        public async Task<OrdenCompraIndexDTO?> RecalcularRecepcionAsync(int id)
        {
            var orden = await _context.OrdenCompras.FirstOrDefaultAsync(o => o.IdOrdenCompra == id);
            if (orden == null) return null;

            // Solo se puede recalcular si está Recibida
            if (orden.Estado != "Recibida") return null;

            orden.Estado = "PendienteControl";
            orden.FechaRecepcionControl = null;

            await _context.SaveChangesAsync();
            return await ObtenerOrdenPorIdAsync(id);
        }
    }
}
