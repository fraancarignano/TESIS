using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;
using TESIS_OG.DTOs.Configuracion;
using TESIS_OG.DTOs.Proyectos;
using TESIS_OG.Models;
using TESIS_OG.Services.ProyectosService;

namespace TESIS_OG.Services.ProyectoService
{
    public class ProyectoService : IProyectosService
    {
        private readonly Data.TamarindoDbContext _context;

        public ProyectoService(Data.TamarindoDbContext context)
        {
            _context = context;
        }

        // ========================================
        // CREAR PROYECTO
        // ========================================

        public async Task<ProyectoDetalleDTO?> CrearProyectoAsync(ProyectoCrearDTO proyectoDto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // 1. Validar que las prendas tengan distribución de talles correcta
                foreach (var prenda in proyectoDto.Prendas)
                {
                    var sumaTalles = prenda.Talles.Sum(t => t.Cantidad);
                    if (sumaTalles != prenda.CantidadTotal)
                    {
                        throw new InvalidOperationException(
                          $"La suma de talles ({sumaTalles}) no coincide con la cantidad total ({prenda.CantidadTotal}) de la prenda {prenda.IdTipoPrenda}"
                        );
                    }
                }

                // 2. Generar código de proyecto
                var codigoProyecto = await GenerarCodigoProyectoAsync();

                // 3. Calcular cantidad total del proyecto (suma de todas las prendas)
                var cantidadTotal = proyectoDto.Prendas.Sum(p => p.CantidadTotal);

                // 4. Crear el proyecto
                var proyecto = new Proyecto
                {
                    IdCliente = proyectoDto.IdCliente,
                    NombreProyecto = proyectoDto.NombreProyecto,
                    Descripcion = proyectoDto.Descripcion,
                    Prioridad = proyectoDto.Prioridad,
                    Estado = proyectoDto.Estado,
                    FechaInicio = proyectoDto.FechaInicio,
                    FechaFin = proyectoDto.FechaFin,
                    CantidadTotal = cantidadTotal,
                    CantidadProducida = 0,
                    IdUsuarioEncargado = proyectoDto.IdUsuarioEncargado,
                    CodigoProyecto = codigoProyecto,
                    EsMultiPrenda = proyectoDto.Prendas.Count > 1,
                    AreaActual = "Gerencia y Administración",
                    AvanceGerenciaAdmin = 0,
                    AvanceDisenoDesarrollo = 0,
                    AvanceControlCalidad = 0,
                    AvanceEtiquetadoEmpaquetado = 0,
                    AvanceDepositoLogistica = 0,
                    ScrapTotal = 0,
                    ScrapPorcentaje = 0
                };

                _context.Proyectos.Add(proyecto);
                await _context.SaveChangesAsync();

                // 5. Crear las prendas del proyecto
                foreach (var prendaDto in proyectoDto.Prendas)
                {
                    var proyectoPrenda = new ProyectoPrendum
                    {
                        IdProyecto = proyecto.IdProyecto,
                        IdTipoPrenda = prendaDto.IdTipoPrenda,
                        IdTipoInsumoMaterial = prendaDto.IdTipoInsumoMaterial,
                        CantidadTotal = prendaDto.CantidadTotal,
                        TieneBordado = prendaDto.TieneBordado,
                        TieneEstampado = prendaDto.TieneEstampado,
                        DescripcionDiseno = prendaDto.DescripcionDiseno,
                        ColorTela = prendaDto.ColorTela?.Trim() != null ? NormalizarColor(prendaDto.ColorTela) : null,
                        Orden = prendaDto.Orden ?? proyectoDto.Prendas.IndexOf(prendaDto)
                    };

                    _context.ProyectoPrenda.Add(proyectoPrenda);
                    await _context.SaveChangesAsync();

                    // 6. Crear la distribución de talles para esta prenda
                    foreach (var talleDto in prendaDto.Talles)
                    {
                        var prendaTalle = new PrendaTalle
                        {
                            IdProyectoPrenda = proyectoPrenda.IdProyectoPrenda,
                            IdTalle = talleDto.IdTalle,
                            Cantidad = talleDto.Cantidad
                        };

                        _context.PrendaTalles.Add(prendaTalle);
                    }
                }

                await _context.SaveChangesAsync();

                // 7. Calcular y asignar materiales automáticos (TELAS)
                await CalcularYAsignarMaterialesAutomaticosAsync(proyecto.IdProyecto);

                // 8. Asignar materiales manuales (HILOS, ACCESORIOS)
                if (proyectoDto.MaterialesManuales != null && proyectoDto.MaterialesManuales.Any())
                {
                    await AsignarMaterialesManualesAsync(proyecto.IdProyecto, proyectoDto.MaterialesManuales);
                }

                await transaction.CommitAsync();

                // 9. Retornar el proyecto completo
                return await ObtenerProyectoPorIdAsync(proyecto.IdProyecto);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw new Exception($"Error al crear proyecto: {ex.Message}", ex);
            }
        }

        // ========================================
        // OBTENER PROYECTOS
        // ========================================

        public async Task<List<ProyectoDetalleDTO>> ObtenerTodosLosProyectosAsync()
        {
            var proyectos = await _context.Proyectos
              .Include(p => p.IdClienteNavigation)
              .Include(p => p.IdUsuarioEncargadoNavigation)
              .Include(p => p.ProyectoPrenda)
                .ThenInclude(pp => pp.IdTipoPrendaNavigation)
              .ToListAsync();

            var proyectosDto = new List<ProyectoDetalleDTO>();

            foreach (var proyecto in proyectos)
            {
                proyectosDto.Add(await MapearProyectoADTOAsync(proyecto));
            }

            return proyectosDto;
        }

        public async Task<List<ProyectoListaDTO>> ObtenerProyectosResumenAsync()
        {
            var proyectos = await _context.Proyectos
              .AsNoTracking()
              .Select(p => new ProyectoListaDTO
              {
                  IdProyecto = p.IdProyecto,
                  IdCliente = p.IdCliente,
                  ClienteNombre = !string.IsNullOrWhiteSpace(p.IdClienteNavigation.RazonSocial)
                      ? p.IdClienteNavigation.RazonSocial
                      : (p.IdClienteNavigation.Nombre ?? "") + " " + (p.IdClienteNavigation.Apellido ?? ""),
                  NombreProyecto = p.NombreProyecto,
                  TipoPrenda = p.TipoPrendaLegacy,
                  Descripcion = p.Descripcion,
                  Prioridad = p.Prioridad,
                  Estado = p.Estado,
                  FechaInicio = p.FechaInicio,
                  FechaFin = p.FechaFin,
                  CantidadTotal = p.CantidadTotal,
                  CantidadProducida = p.CantidadProducida,
                  IdUsuarioEncargado = p.IdUsuarioEncargado,
                  NombreEncargado = p.IdUsuarioEncargadoNavigation != null
                      ? (p.IdUsuarioEncargadoNavigation.NombreUsuario ?? "") + " " + (p.IdUsuarioEncargadoNavigation.ApellidoUsuario ?? "")
                      : null,
                  TipoEstacion = p.TipoEstacion,
                  CodigoProyecto = p.CodigoProyecto,
                  AreaActual = p.AreaActual,
                  AvanceDiseno = p.AvanceGerenciaAdmin,
                  AvanceCorte = p.AvanceDisenoDesarrollo,
                  AvanceConfeccion = p.AvanceControlCalidad,
                  AvanceCalidadPrenda = p.AvanceEtiquetadoEmpaquetado,
                  AvanceEtiquetadoEmpaquetado = p.AvanceDepositoLogistica,
                  CostoMaterialEstimado = p.CostoMaterialEstimado,
                  ScrapTotal = p.ScrapTotal,
                  ScrapPorcentaje = p.ScrapPorcentaje
              })
              .ToListAsync();

            if (proyectos.Count == 0)
            {
                return proyectos;
            }

            var ids = proyectos.Select(p => p.IdProyecto).ToList();

            var prendas = await _context.ProyectoPrenda
              .AsNoTracking()
              .Where(pp => ids.Contains(pp.IdProyecto))
              .Select(pp => new
              {
                  pp.IdProyecto,
                  DTO = new ProyectoPrendaResumenDTO
                  {
                      IdProyectoPrenda = pp.IdProyectoPrenda,
                      IdTipoPrenda = pp.IdTipoPrenda,
                      NombrePrenda = pp.IdTipoPrendaNavigation != null
                          ? pp.IdTipoPrendaNavigation.NombrePrenda
                          : null
                  }
              })
              .ToListAsync();

            var prendasPorProyecto = prendas
              .GroupBy(p => p.IdProyecto)
              .ToDictionary(g => g.Key, g => g.Select(x => x.DTO).ToList());

            foreach (var proyecto in proyectos)
            {
                if (prendasPorProyecto.TryGetValue(proyecto.IdProyecto, out var lista))
                {
                    proyecto.Prendas = lista;
                }
            }

            return proyectos;
        }

        public async Task<ProyectoDetalleDTO?> ObtenerProyectoPorIdAsync(int id)
        {
            var proyecto = await _context.Proyectos
              .Include(p => p.IdClienteNavigation)
              .Include(p => p.IdUsuarioEncargadoNavigation)
              .Include(p => p.ProyectoPrenda)
                .ThenInclude(pp => pp.IdTipoPrendaNavigation)
              .Include(p => p.ProyectoPrenda)
                .ThenInclude(pp => pp.IdTipoInsumoMaterialNavigation)
              .Include(p => p.ProyectoPrenda)
                .ThenInclude(pp => pp.PrendaTalles)
                  .ThenInclude(pt => pt.IdTalleNavigation)
              .Include(p => p.MaterialCalculados)
                .ThenInclude(mc => mc.IdInsumoNavigation)
                  .ThenInclude(i => i.IdTipoInsumoNavigation)
              .FirstOrDefaultAsync(p => p.IdProyecto == id);

            if (proyecto == null) return null;

            return await MapearProyectoADTOAsync(proyecto);
        }

        public async Task<List<ProyectoDetalleDTO>> ObtenerProyectosPorEstadoAsync(string estado)
        {
            var proyectos = await _context.Proyectos
              .Include(p => p.IdClienteNavigation)
              .Include(p => p.IdUsuarioEncargadoNavigation)
              .Include(p => p.ProyectoPrenda)
                .ThenInclude(pp => pp.IdTipoPrendaNavigation)
              .Where(p => p.Estado == estado)
              .ToListAsync();

            var proyectosDto = new List<ProyectoDetalleDTO>();

            foreach (var proyecto in proyectos)
            {
                proyectosDto.Add(await MapearProyectoADTOAsync(proyecto));
            }

            return proyectosDto;
        }

        public async Task<List<ProyectoDetalleDTO>> ObtenerProyectosPorClienteAsync(int idCliente)
        {
            var proyectos = await _context.Proyectos
              .Include(p => p.IdClienteNavigation)
              .Include(p => p.IdUsuarioEncargadoNavigation)
              .Include(p => p.ProyectoPrenda)
                .ThenInclude(pp => pp.IdTipoPrendaNavigation)
              .Where(p => p.IdCliente == idCliente)
              .ToListAsync();

            var proyectosDto = new List<ProyectoDetalleDTO>();

            foreach (var proyecto in proyectos)
            {
                proyectosDto.Add(await MapearProyectoADTOAsync(proyecto));
            }

            return proyectosDto;
        }

        // ========================================
        // ACTUALIZAR PROYECTO
        // ========================================

        public Task ActualizarProyectoAsync(int id, ProyectoEditarDTO proyectoDto)
        {
            throw new NotImplementedException();
        }

        public async Task<ProyectoDetalleDTO?> ActualizarProyectoAsync(int id, ProyectoActualizarDTO proyectoDto)
        {
            var proyecto = await _context.Proyectos.FindAsync(id);
            if (proyecto == null) return null;

            if (!string.IsNullOrEmpty(proyectoDto.NombreProyecto))
                proyecto.NombreProyecto = proyectoDto.NombreProyecto;

            if (proyectoDto.Descripcion != null)
                proyecto.Descripcion = proyectoDto.Descripcion;

            if (proyectoDto.Prioridad != null)
                proyecto.Prioridad = proyectoDto.Prioridad;

            if (proyectoDto.Estado != null)
                proyecto.Estado = proyectoDto.Estado;

            if (proyectoDto.FechaFin != null)
                proyecto.FechaFin = proyectoDto.FechaFin;

            if (proyectoDto.IdUsuarioEncargado != null)
                proyecto.IdUsuarioEncargado = proyectoDto.IdUsuarioEncargado;

            if (proyectoDto.IdCliente.HasValue && proyectoDto.IdCliente.Value > 0)
                proyecto.IdCliente = proyectoDto.IdCliente.Value;

            // Actualizar prendas si se envían
            if (proyectoDto.Prendas != null && proyectoDto.Prendas.Count > 0)
            {
                // Validar distribución de talles
                foreach (var prenda in proyectoDto.Prendas)
                {
                    var sumaTalles = prenda.Talles.Sum(t => t.Cantidad);
                    if (sumaTalles != prenda.CantidadTotal)
                        throw new InvalidOperationException(
                            $"La suma de talles ({sumaTalles}) no coincide con la cantidad total ({prenda.CantidadTotal})");
                }

                // Eliminar prendas y talles anteriores
                var prendasAnteriores = await _context.ProyectoPrenda
                    .Include(pp => pp.PrendaTalles)
                    .Where(pp => pp.IdProyecto == id)
                    .ToListAsync();

                foreach (var p in prendasAnteriores)
                    _context.PrendaTalles.RemoveRange(p.PrendaTalles);

                _context.ProyectoPrenda.RemoveRange(prendasAnteriores);
                await _context.SaveChangesAsync();

                // Crear nuevas prendas
                foreach (var prendaDto in proyectoDto.Prendas)
                {
                    var proyectoPrenda = new ProyectoPrendum
                    {
                        IdProyecto = id,
                        IdTipoPrenda = prendaDto.IdTipoPrenda,
                        IdTipoInsumoMaterial = prendaDto.IdTipoInsumoMaterial,
                        CantidadTotal = prendaDto.CantidadTotal,
                        TieneBordado = prendaDto.TieneBordado,
                        TieneEstampado = prendaDto.TieneEstampado,
                        DescripcionDiseno = prendaDto.DescripcionDiseno,
                        ColorTela = prendaDto.ColorTela?.Trim() != null ? NormalizarColor(prendaDto.ColorTela) : null,
                        Orden = prendaDto.Orden ?? proyectoDto.Prendas.IndexOf(prendaDto)
                    };

                    _context.ProyectoPrenda.Add(proyectoPrenda);
                    await _context.SaveChangesAsync();

                    foreach (var talleDto in prendaDto.Talles)
                    {
                        _context.PrendaTalles.Add(new PrendaTalle
                        {
                            IdProyectoPrenda = proyectoPrenda.IdProyectoPrenda,
                            IdTalle = talleDto.IdTalle,
                            Cantidad = talleDto.Cantidad
                        });
                    }
                }

                // Actualizar cantidad total del proyecto
                proyecto.CantidadTotal = proyectoDto.Prendas.Sum(p => p.CantidadTotal);
                proyecto.EsMultiPrenda = proyectoDto.Prendas.Count > 1;

                await _context.SaveChangesAsync();

                // Recalcular materiales automáticos
                await CalcularYAsignarMaterialesAutomaticosAsync(id);
            }

            if (proyectoDto.MaterialesManualesActualizados != null)
            {
                var materialesManualesAnteriores = await _context.MaterialCalculados
                  .Where(m => m.IdProyecto == id && m.TipoCalculo == "Manual")
                  .ToListAsync();

                _context.MaterialCalculados.RemoveRange(materialesManualesAnteriores);

                await AsignarMaterialesManualesAsync(id, proyectoDto.MaterialesManualesActualizados);
            }

            await _context.SaveChangesAsync();

            return await ObtenerProyectoPorIdAsync(id);
        }

        // ========================================
        // ELIMINAR PROYECTO
        // ========================================

        public async Task<bool> EliminarProyectoAsync(int id)
        {
            var proyecto = await _context.Proyectos.FindAsync(id);
            if (proyecto == null) return false;

            proyecto.Estado = "Archivado";
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<(bool ok, string mensaje)> EliminarProyectoDefinitivoAsync(int id)
        {
            var proyecto = await _context.Proyectos
                .Include(p => p.InsumoStocks)
                .FirstOrDefaultAsync(p => p.IdProyecto == id);

            if (proyecto == null) return (false, "Proyecto no encontrado");

            if (proyecto.Estado != "Anulado" && proyecto.Estado != "Archivado")
                return (false, $"Solo se pueden eliminar proyectos Anulados o Archivados. Estado actual: {proyecto.Estado}");

            try
            {
            // 1. Desasociar muestras (no se eliminan, solo se desvinculan)
            var muestras = await _context.Muestras.Where(m => m.IdProyectoAsignado == id).ToListAsync();
            foreach (var m in muestras) m.IdProyectoAsignado = null;

            // Solicitudes de material
            var solicitudes = await _context.SolicitudMaterialProyectos.Where(s => s.IdProyecto == id).ToListAsync();
            _context.SolicitudMaterialProyectos.RemoveRange(solicitudes);

            // 2. Devolver stock asignado al proyecto al stock general
            var stocksDelProyecto = proyecto.InsumoStocks.Where(s => s.IdProyecto == id).ToList();
            foreach (var stock in stocksDelProyecto)
            {
                var insumo = await _context.Insumos.FindAsync(stock.IdInsumo);
                if (insumo != null)
                {
                    insumo.StockActual += stock.Cantidad;
                    insumo.FechaActualizacion = DateOnly.FromDateTime(DateTime.Now);

                    var stockGeneral = await _context.InsumoStocks
                        .FirstOrDefaultAsync(s => s.IdInsumo == stock.IdInsumo && s.IdProyecto == null);
                    if (stockGeneral != null)
                    {
                        stockGeneral.Cantidad += stock.Cantidad;
                        stockGeneral.FechaActualizacion = DateTime.Now;
                    }
                    else
                    {
                        _context.InsumoStocks.Add(new InsumoStock
                        {
                            IdInsumo = stock.IdInsumo,
                            IdUbicacion = stock.IdUbicacion,
                            Cantidad = stock.Cantidad,
                            FechaActualizacion = DateTime.Now
                        });
                    }
                }
            }

            _context.InsumoStocks.RemoveRange(stocksDelProyecto);
            await _context.SaveChangesAsync();

            // Eliminar relaciones que bloquean el DELETE
            var observaciones = await _context.ObservacionProyectos.Where(o => o.IdProyecto == id).ToListAsync();
            _context.ObservacionProyectos.RemoveRange(observaciones);

            var materiales = await _context.MaterialCalculados.Where(m => m.IdProyecto == id).ToListAsync();
            _context.MaterialCalculados.RemoveRange(materiales);

            var avances = await _context.AvanceAreaProyectos.Where(a => a.IdProyecto == id).ToListAsync();
            _context.AvanceAreaProyectos.RemoveRange(avances);

            var scraps = await _context.Scraps.Where(s => s.IdProyecto == id).ToListAsync();
            _context.Scraps.RemoveRange(scraps);

            var movimientos2 = 0; // placeholder

            // Tablas adicionales con FK al proyecto
            var disenos = await _context.ProyectoDisenos.Where(d => d.IdProyecto == id).ToListAsync();
            _context.ProyectoDisenos.RemoveRange(disenos);

            var tallerDetalles = await _context.DetalleTallerProyectos.Where(d => d.IdProyecto == id).ToListAsync();
            _context.DetalleTallerProyectos.RemoveRange(tallerDetalles);

            var materialDetalles = await _context.DetalleMaterialProyectos.Where(d => d.IdProyecto == id).ToListAsync();
            _context.DetalleMaterialProyectos.RemoveRange(materialDetalles);

            // Prendas y talles
            var prendas = await _context.ProyectoPrenda
                .Include(pp => pp.PrendaTalles)
                .Where(pp => pp.IdProyecto == id).ToListAsync();
            foreach (var p in prendas)
                _context.PrendaTalles.RemoveRange(p.PrendaTalles);
            _context.ProyectoPrenda.RemoveRange(prendas);

            // Despachos asociados
            var despachos = await _context.Despachos.Where(d => d.IdProyecto == id).ToListAsync();
            _context.Despachos.RemoveRange(despachos);

            await _context.SaveChangesAsync();

            _context.Proyectos.Remove(proyecto);
            await _context.SaveChangesAsync();

            return (true, "Proyecto eliminado correctamente");
            }
            catch (Exception ex)
            {
                var causa = ex.InnerException?.Message ?? ex.Message;
                return (false, $"No se pudo eliminar el proyecto. Causa: {causa}");
            }
        }

        // ========================================
        // CÁLCULO DE MATERIALES
        // ========================================

        public async Task<CalculoMaterialesResponseDTO> CalcularMaterialesAsync(CalculoMaterialesRequestDTO request)
        {
            var response = new CalculoMaterialesResponseDTO
            {
                MaterialesCalculados = new List<MaterialCalculadoPreviewDTO>(),
                Alertas = new List<AlertaCalculoDTO>(),
                PuedeCrearse = true
            };

            foreach (var prenda in request.Prendas)
            {
                var config = await _context.ConfiguracionMaterials
                  .FirstOrDefaultAsync(c =>
                    c.IdTipoPrenda == prenda.IdTipoPrenda &&
                    c.IdTipoInsumo == prenda.IdTipoInsumoMaterial);

                if (config == null)
                {
                    response.Alertas.Add(new AlertaCalculoDTO
                    {
                        Tipo = "Advertencia",
                        Mensaje = $"No hay configuración de material para la prenda ID {prenda.IdTipoPrenda} con material ID {prenda.IdTipoInsumoMaterial}"
                    });
                    continue;
                }

                var cantidadNecesaria = prenda.CantidadTotal * config.CantidadPorUnidad;

                // Buscar insumos del tipo solicitado
                var candidatos = await _context.Insumos
                  .Include(i => i.IdTipoInsumoNavigation)
                  .Where(i => i.IdTipoInsumo == prenda.IdTipoInsumoMaterial)
                  .ToListAsync();

                var tipoInsumoNombre = candidatos.FirstOrDefault()?.IdTipoInsumoNavigation?.NombreTipo
                    ?? $"Tipo {prenda.IdTipoInsumoMaterial}";

                Insumo? insumo = null;
                decimal stockDisponible = 0;

                if (!string.IsNullOrWhiteSpace(prenda.ColorSolicitado))
                {
                    var colorNorm = NormalizarColor(prenda.ColorSolicitado);
                    var coincidencias = candidatos.Where(i => NormalizarColor(i.Color) == colorNorm).ToList();
                    insumo = coincidencias.FirstOrDefault();
                    // Stock disponible = solo el stock general (no asignado a proyectos)
                    if (insumo != null)
                    {
                        var stockGeneral = await _context.InsumoStocks
                            .Where(s => coincidencias.Select(c => c.IdInsumo).Contains(s.IdInsumo) && s.IdProyecto == null)
                            .SumAsync(s => (decimal?)s.Cantidad) ?? 0;
                        stockDisponible = stockGeneral > 0 ? stockGeneral : coincidencias.Sum(i => i.StockActual);
                    }
                }
                else
                {
                    insumo = candidatos.FirstOrDefault();
                    // Sin color: stock general de todos los insumos del tipo
                    var idsInsumos = candidatos.Select(c => c.IdInsumo).ToList();
                    var stockGeneral = await _context.InsumoStocks
                        .Where(s => idsInsumos.Contains(s.IdInsumo) && s.IdProyecto == null)
                        .SumAsync(s => (decimal?)s.Cantidad) ?? 0;
                    stockDisponible = stockGeneral > 0 ? stockGeneral : candidatos.Sum(i => i.StockActual);
                }

                var tieneStock = stockDisponible >= cantidadNecesaria;

                response.MaterialesCalculados.Add(new MaterialCalculadoPreviewDTO
                {
                    IdInsumo = insumo?.IdInsumo ?? 0,
                    NombreInsumo = tipoInsumoNombre,
                    TipoInsumo = tipoInsumoNombre,
                    TipoCalculo = "Auto",
                    CantidadNecesaria = cantidadNecesaria,
                    UnidadMedida = config.UnidadMedida,
                    StockActual = stockDisponible,
                    TieneStockSuficiente = tieneStock,
                    Faltante = tieneStock ? null : cantidadNecesaria - stockDisponible,
                    Color = insumo?.Color,
                    ColorSolicitado = string.IsNullOrWhiteSpace(prenda.ColorSolicitado) ? null : prenda.ColorSolicitado
                });

                if (!tieneStock)
                {
                    var colorMsg = string.IsNullOrWhiteSpace(prenda.ColorSolicitado)
                        ? ""
                        : $" color {prenda.ColorSolicitado}";
                    response.Alertas.Add(new AlertaCalculoDTO
                    {
                        Tipo = stockDisponible == 0 ? "SinStock" : "StockInsuficiente",
                        Mensaje = $"Stock insuficiente de {tipoInsumoNombre}{colorMsg}. Necesario: {cantidadNecesaria} {config.UnidadMedida}, Disponible: {stockDisponible} {config.UnidadMedida}",
                        IdInsumo = insumo?.IdInsumo.ToString(),
                        NombreInsumo = tipoInsumoNombre
                    });
                }
            }

            if (request.MaterialesManuales != null)
            {
                foreach (var material in request.MaterialesManuales)
                {
                    var insumo = await _context.Insumos
                      .Include(i => i.IdTipoInsumoNavigation)
                      .FirstOrDefaultAsync(i => i.IdInsumo == material.IdInsumo);

                    if (insumo != null)
                    {
                        var tieneStock = insumo.StockActual >= material.Cantidad;

                        response.MaterialesCalculados.Add(new MaterialCalculadoPreviewDTO
                        {
                            IdInsumo = insumo.IdInsumo,
                            NombreInsumo = insumo.NombreInsumo,
                            TipoInsumo = insumo.IdTipoInsumoNavigation?.NombreTipo ?? "",
                            TipoCalculo = "Manual",
                            CantidadNecesaria = material.Cantidad,
                            UnidadMedida = insumo.UnidadMedida,
                            StockActual = insumo.StockActual,
                            TieneStockSuficiente = tieneStock,
                            Faltante = tieneStock ? null : material.Cantidad - insumo.StockActual
                        });

                        if (!tieneStock)
                        {
                            response.Alertas.Add(new AlertaCalculoDTO
                            {
                                Tipo = "StockInsuficiente",
                                Mensaje = $"Stock insuficiente de {insumo.NombreInsumo}",
                                IdInsumo = insumo.IdInsumo.ToString(),
                                NombreInsumo = insumo.NombreInsumo
                            });
                        }
                    }
                }
            }

            return response;
        }

        public async Task<ValidacionStockDTO> ValidarStockAsync(
          List<ProyectoPrendaCrearDTO> prendas,
          List<MaterialManualDTO>? materialesManuales)
        {
            var validacion = new ValidacionStockDTO
            {
                TieneStockSuficiente = true,
                Alertas = new List<AlertaStockDTO>()
            };

            foreach (var prenda in prendas)
            {
                var config = await _context.ConfiguracionMaterials
                  .FirstOrDefaultAsync(c =>
                    c.IdTipoPrenda == prenda.IdTipoPrenda &&
                    c.IdTipoInsumo == prenda.IdTipoInsumoMaterial);

                if (config != null)
                {
                    var cantidadNecesaria = prenda.CantidadTotal * config.CantidadPorUnidad;
                    var insumo = await _context.Insumos
                      .FirstOrDefaultAsync(i => i.IdTipoInsumo == prenda.IdTipoInsumoMaterial);

                    if (insumo != null && insumo.StockActual < cantidadNecesaria)
                    {
                        validacion.TieneStockSuficiente = false;
                        validacion.Alertas.Add(new AlertaStockDTO
                        {
                            IdInsumo = insumo.IdInsumo,
                            NombreInsumo = insumo.NombreInsumo,
                            CantidadRequerida = cantidadNecesaria,
                            StockActual = insumo.StockActual,
                            Faltante = cantidadNecesaria - insumo.StockActual,
                            UnidadMedida = config.UnidadMedida,
                            Severidad = "Warning"
                        });
                    }
                }
            }

            if (materialesManuales != null)
            {
                foreach (var material in materialesManuales)
                {
                    var insumo = await _context.Insumos.FindAsync(material.IdInsumo);

                    if (insumo != null && insumo.StockActual < material.Cantidad)
                    {
                        validacion.TieneStockSuficiente = false;
                        validacion.Alertas.Add(new AlertaStockDTO
                        {
                            IdInsumo = insumo.IdInsumo,
                            NombreInsumo = insumo.NombreInsumo,
                            CantidadRequerida = material.Cantidad,
                            StockActual = insumo.StockActual,
                            Faltante = material.Cantidad - insumo.StockActual,
                            UnidadMedida = material.UnidadMedida,
                            Severidad = "Warning"
                        });
                    }
                }
            }

            return validacion;
        }

        public async Task<bool> RecalcularMaterialesProyectoAsync(int idProyecto)
        {
            try
            {
                var materialesAuto = await _context.MaterialCalculados
                  .Where(m => m.IdProyecto == idProyecto && m.TipoCalculo == "Auto")
                  .ToListAsync();

                _context.MaterialCalculados.RemoveRange(materialesAuto);
                await _context.SaveChangesAsync();

                await CalcularYAsignarMaterialesAutomaticosAsync(idProyecto);

                return true;
            }
            catch
            {
                return false;
            }
        }

        // ========================================
        // PRENDAS Y TALLES
        // ========================================

        public async Task<List<ProyectoPrendaDTO>> ObtenerPrendasProyectoAsync(int idProyecto)
        {
            var prendas = await _context.ProyectoPrenda
              .Include(pp => pp.IdTipoPrendaNavigation)
              .Include(pp => pp.IdTipoInsumoMaterialNavigation)
              .Include(pp => pp.PrendaTalles)
                .ThenInclude(pt => pt.IdTalleNavigation)
              .Where(pp => pp.IdProyecto == idProyecto)
              .ToListAsync();

            return prendas.Select(p => new ProyectoPrendaDTO
            {
                IdProyectoPrenda = p.IdProyectoPrenda,
                IdTipoPrenda = p.IdTipoPrenda,
                NombrePrenda = p.IdTipoPrendaNavigation?.NombrePrenda ?? "",
                IdTipoInsumoMaterial = p.IdTipoInsumoMaterial,
                NombreMaterial = p.IdTipoInsumoMaterialNavigation?.NombreTipo,
                ColorTela = p.ColorTela,
                CantidadTotal = p.CantidadTotal,
                TieneBordado = p.TieneBordado ?? false,
                TieneEstampado = p.TieneEstampado ?? false,
                DescripcionDiseno = p.DescripcionDiseno,
                Talles = p.PrendaTalles.Select(pt => new PrendaTalleDTO
                {
                    IdPrendaTalle = pt.IdPrendaTalle,
                    IdTalle = pt.IdTalle,
                    NombreTalle = pt.IdTalleNavigation?.NombreTalle ?? "",
                    Cantidad = pt.Cantidad
                }).ToList()
            }).ToList();
        }

        public async Task<ValidarTallesResponseDTO> ValidarDistribucionTallesAsync(ValidarTallesRequestDTO request)
        {
            var sumaTalles = request.Talles.Sum(t => t.Cantidad);
            var esValido = sumaTalles == request.CantidadTotal;
            var diferencia = request.CantidadTotal - sumaTalles;

            return new ValidarTallesResponseDTO
            {
                EsValido = esValido,
                CantidadTotal = request.CantidadTotal,
                SumaTalles = sumaTalles,
                Diferencia = diferencia,
                Mensaje = esValido
                    ? "La distribución de talles es correcta"
                    : $"La suma de talles ({sumaTalles}) no coincide con la cantidad total ({request.CantidadTotal}). Diferencia: {diferencia}"
            };
        }

        // ========================================
        // CATÁLOGOS / FORMULARIO
        // ========================================

        public async Task<FormularioProyectoInicializacionDTO> ObtenerDatosFormularioAsync()
        {
            var clientes = await _context.Clientes
              .Where(c => c.IdEstadoCliente == 1)
              .Select(c => new ClienteSimpleDTO
              {
                  IdCliente = c.IdCliente,
                  NombreCompleto =
                    !string.IsNullOrWhiteSpace(c.RazonSocial)
                        ? c.RazonSocial
                        : $"{c.Nombre ?? ""} {c.Apellido ?? ""}".Trim(),
                  TipoCliente = c.TipoCliente,
                  Email = c.Email
              })
              .ToListAsync();

            var tiposPrenda = await _context.TipoPrenda
              .Where(tp => tp.Estado == "Activo")
              .Select(tp => new TipoPrendaSimpleDTO
              {
                  IdTipoPrenda = tp.IdTipoPrenda,
                  NombrePrenda = tp.NombrePrenda,
                  LongitudCosturaMetros = tp.LongitudCosturaMetros
              })
              .OrderBy(tp => tp.NombrePrenda)
              .ToListAsync();

            var talles = await _context.Talles
              .Where(t => t.Estado == "Activo")
              .Select(t => new TalleSimpleDTO
              {
                  IdTalle = t.IdTalle,
                  NombreTalle = t.NombreTalle,
                  Orden = t.Orden,
                  Categoria = t.Categoria
              })
              .OrderBy(t => t.Orden)
              .ToListAsync();

            var tiposInsumoRaw = await _context.TipoInsumos
                .Select(ti => new
                {
                    ti.IdTipoInsumo,
                    ti.NombreTipo
                })
                .ToListAsync();

            var tiposInsumo = tiposInsumoRaw.Select(ti => new TipoInsumoSimpleDTO
            {
                IdTipoInsumo = ti.IdTipoInsumo,
                NombreTipo = ti.NombreTipo,
                Categoria = ObtenerCategoriaInsumo(ti.NombreTipo)
            }).ToList();

            var insumosRaw = await _context.Insumos
             .Include(i => i.IdTipoInsumoNavigation)
             .Where(i => i.Estado == "Disponible" || i.Estado == "A designar")
             .Select(i => new
             {
                 i.IdInsumo,
                 i.NombreInsumo,
                 i.IdTipoInsumo,
                 NombreTipo = i.IdTipoInsumoNavigation!.NombreTipo,
                 i.UnidadMedida,
                 i.StockActual,
                 i.Color,
                 i.TipoTela,
                 i.RatioKgUnidad
             })
             .ToListAsync();

            var insumos = insumosRaw.Select(i => new InsumoParaFormularioDTO
            {
                IdInsumo = i.IdInsumo,
                NombreInsumo = i.NombreInsumo,
                IdTipoInsumo = i.IdTipoInsumo,
                NombreTipoInsumo = i.NombreTipo,
                Categoria = ObtenerCategoriaInsumo(i.NombreTipo),
                UnidadMedida = i.UnidadMedida,
                StockActual = i.StockActual,
                Color = i.Color,
                TipoTela = i.TipoTela,
                RatioKgUnidad = i.RatioKgUnidad
            }).ToList();

            var usuarios = await _context.Usuarios
              .Where(u => u.Estado == "Activo")
              .Select(u => new UsuarioSimpleDTO
              {
                  IdUsuario = u.IdUsuario,
                  NombreUsuario = u.NombreUsuario,
                  ApellidoUsuario = u.ApellidoUsuario,
                  NombreCompleto = $"{u.NombreUsuario} {u.ApellidoUsuario}"
              })
              .ToListAsync();

            return new FormularioProyectoInicializacionDTO
            {
                Clientes = clientes,
                TiposPrenda = tiposPrenda,
                Talles = talles,
                TiposInsumo = tiposInsumo,
                Insumos = insumos,
                Usuarios = usuarios,
                Prioridades = new List<string> { "alta", "media", "baja" }
            };
        }

        // ========================================
        // MÉTODOS LEGACY (COMPATIBILIDAD)
        // ========================================

        public async Task<bool> ActualizarAvanceAsync(int idProyecto, ActualizarAvanceDTO avanceDto)
        {
            var proyecto = await _context.Proyectos.FindAsync(idProyecto);
            if (proyecto == null) return false;
            if (!string.Equals(proyecto.Estado, "En Proceso", StringComparison.OrdinalIgnoreCase)) return false;

            var areasOrdenadas = await ObtenerAreasOrdenadasAsync();
            if (!areasOrdenadas.Any()) return false;

            var areaSeleccionada = areasOrdenadas.FirstOrDefault(a => a.IdArea == avanceDto.IdArea);
            if (areaSeleccionada == null && avanceDto.IdArea > 0 && avanceDto.IdArea <= areasOrdenadas.Count)
            {
                // Fallback: permite que el frontend envíe el índice de etapa (1..N).
                areaSeleccionada = areasOrdenadas[avanceDto.IdArea - 1];
            }

            if (areaSeleccionada == null) return false;

            var porcentaje = Math.Clamp(avanceDto.Porcentaje, 0, 100);
            var avancesActuales = await ObtenerAvancesActualesPorAreaAsync(idProyecto, areasOrdenadas);
            var indiceArea = areasOrdenadas.FindIndex(a => a.IdArea == areaSeleccionada.IdArea);
            if (indiceArea > 0)
            {
                var areaAnterior = areasOrdenadas[indiceArea - 1];
                if (avancesActuales[areaAnterior.IdArea] < 100) return false;
            }

            var avanceArea = new AvanceAreaProyecto
            {
                IdProyecto = idProyecto,
                IdArea = areaSeleccionada.IdArea,
                PorcentajeAvance = porcentaje,
                FechaActualizacion = DateTime.Now,
                Observaciones = avanceDto.Observaciones
            };

            _context.AvanceAreaProyectos.Add(avanceArea);
            await SincronizarEstadoAreasProyectoAsync(proyecto, areaSeleccionada.IdArea, porcentaje);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> RetrocederAreaAsync(int idProyecto)
        {
            var proyecto = await _context.Proyectos.FindAsync(idProyecto);
            if (proyecto == null) return false;

            var areas = await ObtenerAreasOrdenadasAsync();
            if (!areas.Any()) return false;

            var avances = await ObtenerAvancesActualesPorAreaAsync(idProyecto, areas);
            var indiceUltimaCompleta = areas.FindLastIndex(a => avances[a.IdArea] >= 100);

            if (indiceUltimaCompleta < 0) return false;

            var areaARetroceder = areas[indiceUltimaCompleta];

            _context.AvanceAreaProyectos.Add(new AvanceAreaProyecto
            {
                IdProyecto = idProyecto,
                IdArea = areaARetroceder.IdArea,
                PorcentajeAvance = 0,
                FechaActualizacion = DateTime.Now,
                Observaciones = "Retroceso manual de área"
            });

            await SincronizarEstadoAreasProyectoAsync(proyecto, areaARetroceder.IdArea, 0);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RegistrarScrapAsync(int idProyecto, RegistrarScrapDTO scrapDto)
        {
            try
            {
                var scrap = new Scrap
                {
                    IdProyecto = idProyecto,
                    IdInsumo = scrapDto.IdInsumo,
                    CantidadScrap = scrapDto.CantidadScrap,
                    Motivo = scrapDto.Motivo,
                    Destino = scrapDto.Destino,
                    FechaRegistro = DateTime.Now
                };

                _context.Scraps.Add(scrap);

                var proyecto = await _context.Proyectos.FindAsync(idProyecto);
                if (proyecto != null)
                {
                    proyecto.ScrapTotal = (proyecto.ScrapTotal ?? 0) + (scrapDto.CostoScrap ?? 0);

                    if (proyecto.CostoMaterialEstimado > 0)
                    {
                        proyecto.ScrapPorcentaje = (proyecto.ScrapTotal / proyecto.CostoMaterialEstimado) * 100;
                    }
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> AgregarObservacionAsync(int idProyecto, AgregarObservacionDTO observacionDto)
        {
            try
            {
                var observacion = new ObservacionProyecto
                {
                    IdProyecto = idProyecto,
                    IdUsuario = observacionDto.IdUsuario,
                    Fecha = DateTime.Now,
                    Descripcion = observacionDto.Descripcion
                };

                _context.ObservacionProyectos.Add(observacion);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> CambiarEstadoAsync(int idProyecto, string nuevoEstado)
        {
            var proyecto = await _context.Proyectos.FindAsync(idProyecto);
            if (proyecto == null) return false;

            // Validar transiciones de estado
            var estadoActual = proyecto.Estado;
            var transicionesValidas = new Dictionary<string, List<string>>
            {
                ["Pendiente"]   = new() { "En Proceso", "Anulado", "Archivado" },
                ["En Proceso"]  = new() { "Pausado", "Finalizado", "Archivado" },
                ["Pausado"]     = new() { "En Proceso", "Pendiente", "Anulado", "Archivado" },
                ["Finalizado"]  = new() { "Archivado" },
                ["Anulado"]     = new() { },
                ["Archivado"]   = new()
            };

            if (transicionesValidas.TryGetValue(estadoActual, out var permitidos) &&
                !permitidos.Contains(nuevoEstado))
                throw new InvalidOperationException($"No se puede cambiar de '{estadoActual}' a '{nuevoEstado}'");

            // Si va a iniciar DESDE PENDIENTE, verificar que todos los materiales estén asignados
            // Si viene de Pausado, los materiales ya estaban asignados — no revalidar
            if (nuevoEstado == "En Proceso" && estadoActual == "Pendiente")
            {
                var materiales = await _context.MaterialCalculados
                    .Where(m => m.IdProyecto == idProyecto)
                    .ToListAsync();

                foreach (var mat in materiales)
                {
                    var cantidadNecesaria = mat.CantidadManual ?? mat.CantidadCalculada;
                    var stockAsignado = await _context.InsumoStocks
                        .Where(s => s.IdInsumo == mat.IdInsumo && s.IdProyecto == idProyecto)
                        .SumAsync(s => (decimal?)s.Cantidad) ?? 0;

                    if (stockAsignado < cantidadNecesaria)
                    {
                        var insumo = await _context.Insumos.FindAsync(mat.IdInsumo);
                        throw new InvalidOperationException(
                            $"No se puede iniciar: falta asignar material '{insumo?.NombreInsumo ?? mat.IdInsumo.ToString()}'. " +
                            $"Asignado: {stockAsignado}, Requerido: {cantidadNecesaria}");
                    }
                }
            }

            proyecto.Estado = nuevoEstado;
            await _context.SaveChangesAsync();
            return true;
        }
        

        private async Task<List<AreaProduccion>> ObtenerAreasOrdenadasAsync()
        {
            return await _context.AreaProduccions
                .OrderBy(a => a.Orden)
                .ToListAsync();
        }

        private async Task<Dictionary<int, int>> ObtenerAvancesActualesPorAreaAsync(int idProyecto, List<AreaProduccion> areas)
        {
            var ultimoAvancePorArea = await _context.AvanceAreaProyectos
                .Where(a => a.IdProyecto == idProyecto)
                .GroupBy(a => a.IdArea)
                .Select(g => g.OrderByDescending(x => x.FechaActualizacion).ThenByDescending(x => x.IdAvanceArea).First())
                .ToListAsync();

            var avances = areas.ToDictionary(a => a.IdArea, _ => 0);
            foreach (var avance in ultimoAvancePorArea)
            {
                avances[avance.IdArea] = avance.PorcentajeAvance;
            }

            return avances;
        }

        private async Task SincronizarEstadoAreasProyectoAsync(Proyecto proyecto, int idAreaActualizado, int porcentajeActualizado)
        {
            var areas = await ObtenerAreasOrdenadasAsync();
            var avances = await ObtenerAvancesActualesPorAreaAsync(proyecto.IdProyecto, areas);
            avances[idAreaActualizado] = porcentajeActualizado;

            var slots = areas.Select(a => avances[a.IdArea]).ToList();
            proyecto.AvanceGerenciaAdmin = slots.Count > 0 ? slots[0] : 0;
            proyecto.AvanceDisenoDesarrollo = slots.Count > 1 ? slots[1] : 0;
            proyecto.AvanceControlCalidad = slots.Count > 2 ? slots[2] : 0;
            proyecto.AvanceEtiquetadoEmpaquetado = slots.Count > 3 ? slots[3] : 0;
            proyecto.AvanceDepositoLogistica = slots.Count > 4 ? slots[4] : 0;

            var siguientePendiente = areas.FirstOrDefault(a => avances[a.IdArea] < 100);
            if (siguientePendiente == null)
            {
                proyecto.AreaActual = areas.LastOrDefault()?.NombreArea ?? proyecto.AreaActual;
                proyecto.Estado = "Finalizado";
                return;
            }

            proyecto.AreaActual = siguientePendiente.NombreArea;
            if (proyecto.Estado == "Finalizado")
            {
                proyecto.Estado = "En Proceso";
            }
            else if (proyecto.Estado == "Pendiente")
            {
                proyecto.Estado = "En Proceso";
            }
        }

        // ========================================
        // MÉTODOS PRIVADOS AUXILIARES
        // ========================================

        private async Task<string> GenerarCodigoProyectoAsync()
        {
            var ultimoProyecto = await _context.Proyectos
              .OrderByDescending(p => p.IdProyecto)
              .FirstOrDefaultAsync();

            var numeroProyecto = (ultimoProyecto?.IdProyecto ?? 0) + 1;
            return $"P-{DateTime.Now.Year}-{numeroProyecto:D3}";
        }

        private async Task CalcularYAsignarMaterialesAutomaticosAsync(int idProyecto)
        {
            var prendas = await _context.ProyectoPrenda
              .Where(pp => pp.IdProyecto == idProyecto)
              .ToListAsync();

            foreach (var prenda in prendas)
            {
                var config = await _context.ConfiguracionMaterials
                  .FirstOrDefaultAsync(c =>
                    c.IdTipoPrenda == prenda.IdTipoPrenda &&
                    c.IdTipoInsumo == prenda.IdTipoInsumoMaterial);

                if (config != null)
                {
                    var candidatosInsumo = await _context.Insumos
                      .Where(i => i.IdTipoInsumo == prenda.IdTipoInsumoMaterial)
                      .ToListAsync();

                    Insumo? insumo = null;
                    if (!string.IsNullOrWhiteSpace(prenda.ColorTela))
                    {
                        var colorNorm = NormalizarColor(prenda.ColorTela);
                        insumo = candidatosInsumo.FirstOrDefault(i => NormalizarColor(i.Color) == colorNorm)
                              ?? candidatosInsumo.FirstOrDefault();
                    }
                    else
                    {
                        insumo = candidatosInsumo.FirstOrDefault();
                    }

                    if (insumo != null)
                    {
                        var cantidadCalculada = prenda.CantidadTotal * config.CantidadPorUnidad;

                        // Solo registrar el MaterialCalculado — NO descontar stock aquí.
                        // El stock se descuenta cuando inventario asigna el material al proyecto.
                        _context.MaterialCalculados.Add(new MaterialCalculado
                        {
                            IdProyecto = idProyecto,
                            IdProyectoPrenda = prenda.IdProyectoPrenda,
                            IdInsumo = insumo.IdInsumo,
                            TipoCalculo = "Auto",
                            CantidadCalculada = cantidadCalculada,
                            UnidadMedida = config.UnidadMedida,
                            TieneStock = insumo.StockActual >= cantidadCalculada
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();
        }

        private async Task AsignarMaterialesManualesAsync(int idProyecto, List<MaterialManualDTO> materiales)
        {
            foreach (var material in materiales)
            {
                var insumo = await _context.Insumos.FindAsync(material.IdInsumo);
                if (insumo != null)
                {
                    // Solo registrar el MaterialCalculado — NO descontar stock aquí.
                    _context.MaterialCalculados.Add(new MaterialCalculado
                    {
                        IdProyecto = idProyecto,
                        IdProyectoPrenda = null,
                        IdInsumo = material.IdInsumo,
                        TipoCalculo = "Manual",
                        CantidadCalculada = material.Cantidad,
                        CantidadManual = material.Cantidad,
                        UnidadMedida = material.UnidadMedida,
                        TieneStock = insumo.StockActual >= material.Cantidad,
                        Observaciones = material.Observaciones
                    });
                }
            }

            await _context.SaveChangesAsync();
        }

        private static string NormalizarColor(string? color)
        {
            if (string.IsNullOrWhiteSpace(color)) return string.Empty;
            // Quitar acentos, pasar a mayúsculas, trim
            var normalized = color.Trim().ToUpperInvariant();
            normalized = System.Text.RegularExpressions.Regex.Replace(
                normalized.Normalize(System.Text.NormalizationForm.FormD),
                @"\p{Mn}", "");
            return normalized;
        }

        private string ObtenerCategoriaInsumo(string? nombreTipo)
        {
            if (string.IsNullOrWhiteSpace(nombreTipo)) return "Otros";

            var nombre = nombreTipo.ToLower();

            if (nombre.Contains("tela") || nombre.Contains("algodón") || nombre.Contains("poliéster"))
                return "Telas";
            if (nombre.Contains("hilo"))
                return "Hilos";
            if (nombre.Contains("botón") || nombre.Contains("cierre") || nombre.Contains("accesorio"))
                return "Accesorios";

            return "Otros";
        }

        private async Task<ProyectoDetalleDTO> MapearProyectoADTOAsync(Proyecto proyecto)
        {
            var prendas = await ObtenerPrendasProyectoAsync(proyecto.IdProyecto);

            var materialesRaw = await _context.MaterialCalculados
                .Include(mc => mc.IdInsumoNavigation)
                    .ThenInclude(i => i != null ? i.IdTipoInsumoNavigation : null)
                .Include(mc => mc.IdProyectoPrendaNavigation)
                    .ThenInclude(pp => pp != null ? pp.IdTipoPrendaNavigation : null)
                .Where(mc => mc.IdProyecto == proyecto.IdProyecto)
                .ToListAsync();

            // Pre-cargar todos los insumos por tipo para buscar stock por color
            var idsTipoInsumo = materialesRaw
                .Where(mc => mc.IdInsumoNavigation != null)
                .Select(mc => mc.IdInsumoNavigation!.IdTipoInsumo)
                .Distinct().ToList();

            var insumosPorTipo = await _context.Insumos
                .Where(i => idsTipoInsumo.Contains(i.IdTipoInsumo))
                .ToListAsync();

            var materiales = materialesRaw.Select(mc =>
            {
                var colorSolicitado = mc.IdProyectoPrendaNavigation?.ColorTela;
                var idTipoInsumo = mc.IdInsumoNavigation?.IdTipoInsumo ?? 0;

                // Usar el insumo del MaterialCalculado directamente (es el insumo específico)
                // Solo buscar alternativo por tipo+color si el insumo original tiene stock 0
                Insumo? insumoReal = mc.IdInsumoNavigation;
                decimal stockReal = insumoReal?.StockActual ?? 0;

                // Si el insumo original no tiene stock, buscar por tipo+color como fallback
                if (stockReal == 0 && !string.IsNullOrWhiteSpace(colorSolicitado))
                {
                    var colorNorm = NormalizarColor(colorSolicitado);
                    var alternativo = insumosPorTipo
                        .Where(i => i.IdTipoInsumo == idTipoInsumo && i.IdInsumo != (insumoReal?.IdInsumo ?? 0))
                        .FirstOrDefault(i => NormalizarColor(i.Color) == colorNorm);
                    if (alternativo != null && alternativo.StockActual > 0)
                    {
                        insumoReal = alternativo;
                        stockReal = alternativo.StockActual;
                    }
                }
                else if (stockReal == 0 && string.IsNullOrWhiteSpace(colorSolicitado))
                {
                    // Sin color: sumar todo el stock del tipo como fallback
                    var totalTipo = insumosPorTipo.Where(i => i.IdTipoInsumo == idTipoInsumo).Sum(i => i.StockActual);
                    if (totalTipo > stockReal) stockReal = totalTipo;
                }

                var cantidadFinal = mc.CantidadManual ?? mc.CantidadCalculada;
                var tieneStockReal = stockReal >= cantidadFinal;

                return new MaterialCalculadoResponseDTO
                {
                    IdMaterialCalculado = mc.IdMaterialCalculado,
                    // Usar el insumo real (con el color correcto) si existe, sino el original
                    IdInsumo = insumoReal?.IdInsumo ?? mc.IdInsumo,
                    IdTipoInsumo = idTipoInsumo,
                    NombreInsumo = mc.IdInsumoNavigation?.IdTipoInsumoNavigation?.NombreTipo
                                   ?? mc.IdInsumoNavigation?.NombreInsumo ?? "",
                    TipoInsumo = mc.IdInsumoNavigation?.IdTipoInsumoNavigation?.NombreTipo ?? "",
                    TipoCalculo = mc.TipoCalculo,
                    CantidadCalculada = mc.CantidadCalculada,
                    CantidadManual = mc.CantidadManual,
                    CantidadFinal = cantidadFinal,
                    UnidadMedida = mc.UnidadMedida,
                    StockActual = stockReal,
                    TieneStock = tieneStockReal,
                    Observaciones = mc.Observaciones,
                    IdProyectoPrenda = mc.IdProyectoPrenda,
                    NombrePrenda = mc.IdProyectoPrendaNavigation?.IdTipoPrendaNavigation?.NombrePrenda,
                    ColorInsumo = insumoReal?.Color,
                    ColorSolicitado = colorSolicitado,
                    ColorCoincide = tieneStockReal || string.IsNullOrWhiteSpace(colorSolicitado)
                };
            }).ToList();

            var alertasStock = materiales
                .Where(m => !m.TieneStock)
                .Select(m => $"Stock insuficiente de {m.NombreInsumo}")
                .ToList();

            var muestraAsociada = await _context.Muestras
                .FirstOrDefaultAsync(m => m.IdProyectoAsignado == proyecto.IdProyecto);

            return new ProyectoDetalleDTO
            {
                IdProyecto = proyecto.IdProyecto,
                CodigoProyecto = proyecto.CodigoProyecto ?? "",
                IdCliente = proyecto.IdCliente,

                NombreCliente =
                    !string.IsNullOrWhiteSpace(proyecto.IdClienteNavigation?.RazonSocial)
                        ? proyecto.IdClienteNavigation.RazonSocial
                        : $"{proyecto.IdClienteNavigation?.Nombre ?? ""} {proyecto.IdClienteNavigation?.Apellido ?? ""}".Trim(),

                NombreProyecto = proyecto.NombreProyecto,
                Descripcion = proyecto.Descripcion,
                Prioridad = proyecto.Prioridad,
                Estado = proyecto.Estado,
                FechaInicio = proyecto.FechaInicio,
                FechaFin = proyecto.FechaFin,
                CantidadTotal = proyecto.CantidadTotal,
                CantidadProducida = proyecto.CantidadProducida,
                IdUsuarioEncargado = proyecto.IdUsuarioEncargado,

                NombreUsuarioEncargado = proyecto.IdUsuarioEncargadoNavigation != null
                    ? $"{proyecto.IdUsuarioEncargadoNavigation.NombreUsuario ?? ""} {proyecto.IdUsuarioEncargadoNavigation.ApellidoUsuario ?? ""}".Trim()
                    : null,

                AreaActual = proyecto.AreaActual,
                AvanceDiseno = proyecto.AvanceGerenciaAdmin ?? 0,
                AvanceCorte = proyecto.AvanceDisenoDesarrollo ?? 0,
                AvanceConfeccion = proyecto.AvanceControlCalidad ?? 0,
                AvanceCalidadPrenda = proyecto.AvanceEtiquetadoEmpaquetado ?? 0,
                AvanceEtiquetadoEmpaquetado = proyecto.AvanceDepositoLogistica ?? 0,

                EsMultiPrenda = proyecto.EsMultiPrenda ?? false,
                IdMuestra = muestraAsociada?.IdMuestra,
                NombreMuestra = muestraAsociada?.NombreMuestra,
                Prendas = prendas,
                Materiales = materiales,
                AlertasStock = alertasStock
            };
        }

    } // fin clase ProyectoService
} // fin namespace
