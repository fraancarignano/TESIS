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

            // Actualizar solo campos editables
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

            // Actualizar materiales manuales si vienen
            if (proyectoDto.MaterialesManualesActualizados != null)
            {
                // Eliminar materiales manuales anteriores
                var materialesManualesAnteriores = await _context.MaterialCalculados
                  .Where(m => m.IdProyecto == id && m.TipoCalculo == "Manual")
                  .ToListAsync();

                _context.MaterialCalculados.RemoveRange(materialesManualesAnteriores);

                // Agregar los nuevos
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

            // Archivar en lugar de eliminar
            proyecto.Estado = "Archivado";
            await _context.SaveChangesAsync();

            return true;
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

            // Calcular materiales por cada prenda
            foreach (var prenda in request.Prendas)
            {
                // Buscar configuración de material para esta prenda
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

                // Calcular cantidad necesaria
                var cantidadNecesaria = prenda.CantidadTotal * config.CantidadPorUnidad;

                // Buscar insumo del tipo de material
                var insumo = await _context.Insumos
                  .Include(i => i.IdTipoInsumoNavigation)
                  .FirstOrDefaultAsync(i => i.IdTipoInsumo == prenda.IdTipoInsumoMaterial);

                if (insumo == null)
                {
                    response.Alertas.Add(new AlertaCalculoDTO
                    {
                        Tipo = "SinStock",
                        Mensaje = $"No hay insumo disponible del tipo {prenda.IdTipoInsumoMaterial}"
                    });
                    response.PuedeCrearse = false;
                    continue;
                }

                var tieneStock = insumo.StockActual >= cantidadNecesaria;

                response.MaterialesCalculados.Add(new MaterialCalculadoPreviewDTO
                {
                    IdInsumo = insumo.IdInsumo,
                    NombreInsumo = insumo.NombreInsumo,
                    TipoInsumo = insumo.IdTipoInsumoNavigation?.NombreTipo ?? "",
                    TipoCalculo = "Auto",
                    CantidadNecesaria = cantidadNecesaria,
                    UnidadMedida = config.UnidadMedida,
                    StockActual = insumo.StockActual,
                    TieneStockSuficiente = tieneStock,
                    Faltante = tieneStock ? null : cantidadNecesaria - insumo.StockActual
                });

                if (!tieneStock)
                {
                    response.Alertas.Add(new AlertaCalculoDTO
                    {
                        Tipo = "StockInsuficiente",
                        Mensaje = $"Stock insuficiente de {insumo.NombreInsumo}. Necesario: {cantidadNecesaria} {config.UnidadMedida}, Disponible: {insumo.StockActual} {config.UnidadMedida}",
                        IdInsumo = insumo.IdInsumo.ToString(),
                        NombreInsumo = insumo.NombreInsumo
                    });
                }
            }

            // Agregar materiales manuales
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

            // Validar stock de telas (automático)
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

            // Validar stock de materiales manuales
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
                // Eliminar materiales automáticos anteriores
                var materialesAuto = await _context.MaterialCalculados
                  .Where(m => m.IdProyecto == idProyecto && m.TipoCalculo == "Auto")
                  .ToListAsync();

                _context.MaterialCalculados.RemoveRange(materialesAuto);
                await _context.SaveChangesAsync();

                // Recalcular
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
        // CATÁLOGOS
        // ========================================

        // ========================================
        // MÉTODO CORREGIDO: ObtenerDatosFormularioAsync
        // ========================================

        public async Task<FormularioProyectoInicializacionDTO> ObtenerDatosFormularioAsync()
        {
            var clientes = await _context.Clientes
              .Where(c => c.IdEstadoCliente == 1) // Solo activos
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

            // ✅ CORRECCIÓN: Primero obtener datos anónimos, luego mapear a DTO
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
                TiposInsumo = tiposInsumo, // ✅ AHORA ES LA LISTA CORRECTA
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

            var avanceArea = new AvanceAreaProyecto
            {
                IdProyecto = idProyecto,
                IdArea = avanceDto.IdArea,  // FK a AreaProduccion
                PorcentajeAvance = avanceDto.Porcentaje,
                FechaActualizacion = DateTime.Now,
                //IdUsuarioRegistro = userId,
                Observaciones = avanceDto.Observaciones
            };
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

            proyecto.Estado = nuevoEstado;
            await _context.SaveChangesAsync();
            return true;
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
                // Buscar configuración de material
                var config = await _context.ConfiguracionMaterials
                  .FirstOrDefaultAsync(c =>
                    c.IdTipoPrenda == prenda.IdTipoPrenda &&
                    c.IdTipoInsumo == prenda.IdTipoInsumoMaterial);

                if (config != null)
                {
                    // Buscar insumo específico del tipo
                    var insumo = await _context.Insumos
                      .FirstOrDefaultAsync(i => i.IdTipoInsumo == prenda.IdTipoInsumoMaterial);

                    if (insumo != null)
                    {
                        var cantidadCalculada = prenda.CantidadTotal * config.CantidadPorUnidad;
                        var tieneStock = insumo.StockActual >= cantidadCalculada;

                        var materialCalculado = new MaterialCalculado
                        {
                            IdProyecto = idProyecto,
                            IdProyectoPrenda = prenda.IdProyectoPrenda,
                            IdInsumo = insumo.IdInsumo,
                            TipoCalculo = "Auto",
                            CantidadCalculada = cantidadCalculada,
                            UnidadMedida = config.UnidadMedida,
                            TieneStock = tieneStock
                        };

                        _context.MaterialCalculados.Add(materialCalculado);

                        // ACTUALIZAR STOCK Y ESTADO
                        insumo.StockActual -= cantidadCalculada;
                        
                        if (insumo.StockActual <= 0)
                        {
                            insumo.StockActual = 0;
                            insumo.Estado = "Agotado";
                        }
                        else
                        {
                            insumo.Estado = "En uso";
                        }
                        
                        insumo.FechaActualizacion = DateOnly.FromDateTime(DateTime.Now);
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
                    var tieneStock = insumo.StockActual >= material.Cantidad;

                    var materialCalculado = new MaterialCalculado
                    {
                        IdProyecto = idProyecto,
                        IdProyectoPrenda = null, // Material general del proyecto
                        IdInsumo = material.IdInsumo,
                        TipoCalculo = "Manual",
                        CantidadCalculada = material.Cantidad,
                        CantidadManual = material.Cantidad,
                        UnidadMedida = material.UnidadMedida,
                        TieneStock = tieneStock,
                        Observaciones = material.Observaciones
                    };

                    _context.MaterialCalculados.Add(materialCalculado);

                    // ACTUALIZAR STOCK Y ESTADO
                    insumo.StockActual -= material.Cantidad;
                    
                    if (insumo.StockActual <= 0)
                    {
                         insumo.StockActual = 0;
                         insumo.Estado = "Agotado";
                    }
                    else
                    {
                         insumo.Estado = "En uso";
                    }

                    insumo.FechaActualizacion = DateOnly.FromDateTime(DateTime.Now);
                }
            }

            await _context.SaveChangesAsync();
        }

        private async Task<ProyectoDetalleDTO> MapearProyectoADTOAsync(Proyecto proyecto)
        {
            var prendas = await ObtenerPrendasProyectoAsync(proyecto.IdProyecto);

            var materiales = await _context.MaterialCalculados
              .Include(mc => mc.IdInsumoNavigation)
                .ThenInclude(i => i!.IdTipoInsumoNavigation)
              .Include(mc => mc.IdProyectoPrendaNavigation)
                .ThenInclude(pp => pp!.IdTipoPrendaNavigation)
              .Where(mc => mc.IdProyecto == proyecto.IdProyecto)
              .Select(mc => new MaterialCalculadoResponseDTO
              {
                  IdMaterialCalculado = mc.IdMaterialCalculado,
                  IdInsumo = mc.IdInsumo,
                  NombreInsumo = mc.IdInsumoNavigation!.NombreInsumo,
                  TipoInsumo = mc.IdInsumoNavigation.IdTipoInsumoNavigation!.NombreTipo,
                  TipoCalculo = mc.TipoCalculo,
                  CantidadCalculada = mc.CantidadCalculada,
                  CantidadManual = mc.CantidadManual,
                  CantidadFinal = mc.CantidadManual ?? mc.CantidadCalculada,
                  UnidadMedida = mc.UnidadMedida,
                  StockActual = mc.IdInsumoNavigation.StockActual,
                  TieneStock = mc.TieneStock ?? false,
                  Observaciones = mc.Observaciones,
                  IdProyectoPrenda = mc.IdProyectoPrenda,
                  NombrePrenda = mc.IdProyectoPrendaNavigation != null
                  ? mc.IdProyectoPrendaNavigation.IdTipoPrendaNavigation!.NombrePrenda
                  : null
              })
              .ToListAsync();

            var alertasStock = materiales
              .Where(m => !m.TieneStock)
              .Select(m => $"Stock insuficiente de {m.NombreInsumo}")
              .ToList();

            return new ProyectoDetalleDTO
            {
                IdProyecto = proyecto.IdProyecto,
                CodigoProyecto = proyecto.CodigoProyecto ?? "",
                IdCliente = proyecto.IdCliente,
                NombreCliente = proyecto.IdClienteNavigation?.RazonSocial
                ?? $"{proyecto.IdClienteNavigation?.Nombre} {proyecto.IdClienteNavigation?.Apellido}",
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
                ? $"{proyecto.IdUsuarioEncargadoNavigation.NombreUsuario} {proyecto.IdUsuarioEncargadoNavigation.ApellidoUsuario}"
                : null,
                EsMultiPrenda = proyecto.EsMultiPrenda ?? false,
                Prendas = prendas,
                Materiales = materiales,
                AlertasStock = alertasStock
            };
        }

        private string ObtenerCategoriaInsumo(string? nombreTipo)
        {
            if (string.IsNullOrWhiteSpace(nombreTipo))
                return "Otro";

            if (nombreTipo.Contains("Tela")) return "Tela";
            if (nombreTipo.Contains("Hilo")) return "Hilo";
            if (nombreTipo.Contains("Accesorio")) return "Accesorio";
            return "Otro";
        }


    }
}
