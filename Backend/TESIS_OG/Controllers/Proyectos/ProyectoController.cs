using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TESIS_OG.Data;
using TESIS_OG.DTOs.Proyectos;
using TESIS_OG.DTOs.Configuracion;
using TESIS_OG.Models;
using TESIS_OG.Security;
using AppAuthorizationService = TESIS_OG.Services.AuthorizationService;
using TESIS_OG.Services.ProyectosService;
using TESIS_OG.Services.ProyectoAuditoriaService;
using TESIS_OG.Services.ProyectoValidacionService;

namespace TESIS_OG.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProyectoController : ControllerBase
    {
        private readonly IProyectosService _proyectoService;
        private readonly ILogger<ProyectoController> _logger;
        private readonly IProyectoAuditoriaService _auditoriaService;
        private readonly IProyectoValidacionService _validacionService;
        private readonly TamarindoDbContext _context;
        private readonly AppAuthorizationService.IAuthorizationService _authorizationService;

        public ProyectoController(
            IProyectosService proyectoService,
            ILogger<ProyectoController> logger,
            IProyectoAuditoriaService auditoriaService,
            IProyectoValidacionService validacionService,
            TamarindoDbContext context,
            AppAuthorizationService.IAuthorizationService authorizationService)
        {
            _proyectoService = proyectoService;
            _logger = logger;
            _auditoriaService = auditoriaService;
            _validacionService = validacionService;
            _context = context;
            _authorizationService = authorizationService;
        }

        // ========================================
        // CRUD
        // ========================================

        /// <summary>
        /// Crea un nuevo proyecto con múltiples prendas
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ProyectoDetalleDTO), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CrearProyecto([FromBody] ProyectoCrearDTO proyectoDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _proyectoService.CrearProyectoAsync(proyectoDto);

                if (result == null)
                    return BadRequest(new { message = "No se pudo crear el proyecto" });

                return CreatedAtAction(nameof(ObtenerProyectoPorId), new { id = result.IdProyecto }, result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Error de validación al crear proyecto");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear proyecto");
                return StatusCode(500, new { message = "Error interno al crear el proyecto" });
            }
        }

        /// <summary>
        /// Obtiene todos los proyectos
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(List<ProyectoDetalleDTO>), StatusCodes.Status200OK)]
        public async Task<IActionResult> ObtenerProyectos()
        {
            try
            {
                var proyectos = await _proyectoService.ObtenerTodosLosProyectosAsync();
                return Ok(proyectos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener proyectos");
                return StatusCode(500, new { message = "Error al obtener proyectos" });
            }
        }

        /// <summary>
        /// Obtiene un listado liviano de proyectos (para carga inicial rí¡pida)
        /// </summary>
        [HttpGet("resumen")]
        [ProducesResponseType(typeof(List<ProyectoListaDTO>), StatusCodes.Status200OK)]
        public async Task<IActionResult> ObtenerProyectosResumen()
        {
            try
            {
                var proyectos = await _proyectoService.ObtenerProyectosResumenAsync();
                return Ok(proyectos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener proyectos (resumen)");
                return StatusCode(500, new { message = "Error al obtener proyectos" });
            }
        }

        /// <summary>
        /// Obtiene un proyecto por ID con toda su información
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ProyectoDetalleDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObtenerProyectoPorId(int id)
        {
            try
            {
                var proyecto = await _proyectoService.ObtenerProyectoPorIdAsync(id);

                if (proyecto == null)
                    return NotFound(new { message = $"Proyecto con ID {id} no encontrado" });

                return Ok(proyecto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener proyecto {IdProyecto}", id);
                return StatusCode(500, new { message = "Error al obtener el proyecto" });
            }
        }

        /// <summary>
        /// Actualiza un proyecto existente (solo datos generales, no prendas)
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(ProyectoDetalleDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ActualizarProyecto(int id, [FromBody] ProyectoActualizarDTO proyectoDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                proyectoDto.IdProyecto = id;
                var result = await _proyectoService.ActualizarProyectoAsync(id, proyectoDto);

                if (result == null)
                    return NotFound(new { message = $"Proyecto con ID {id} no encontrado" });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar proyecto {IdProyecto}", id);
                return StatusCode(500, new { message = "Error al actualizar el proyecto" });
            }
        }

        /// <summary>
        /// Elimina (archiva) un proyecto
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> EliminarProyecto(int id)
        {
            try
            {
                var eliminado = await _proyectoService.EliminarProyectoAsync(id);
                if (!eliminado)
                    return NotFound(new { message = $"Proyecto con ID {id} no encontrado" });
                return Ok(new { message = "Proyecto archivado correctamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar proyecto {IdProyecto}", id);
                return StatusCode(500, new { message = "Error al archivar el proyecto" });
            }
        }

        /// <summary>
        /// Elimina definitivamente un proyecto Anulado o Archivado, devolviendo el stock al general
        /// </summary>
        [HttpDelete("{id}/definitivo")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> EliminarProyectoDefinitivo(int id)
        {
            try
            {
                var (ok, mensaje) = await _proyectoService.EliminarProyectoDefinitivoAsync(id);
                if (!ok) return BadRequest(new { message = mensaje });
                return Ok(new { message = mensaje });
            }
            catch (Exception ex)
            {
                var causa = ex.InnerException?.Message ?? ex.Message;
                _logger.LogError(ex, "Error al eliminar definitivamente proyecto {IdProyecto}", id);
                return StatusCode(500, new { message = $"Error al eliminar el proyecto. Causa: {causa}" });
            }
        }

        // ========================================
        // FILTROS
        // ========================================

        /// <summary>
        /// Obtiene proyectos por estado
        /// </summary>
        [HttpGet("estado/{estado}")]
        [ProducesResponseType(typeof(List<ProyectoDetalleDTO>), StatusCodes.Status200OK)]
        public async Task<IActionResult> ObtenerPorEstado(string estado)
        {
            try
            {
                var proyectos = await _proyectoService.ObtenerProyectosPorEstadoAsync(estado);
                return Ok(proyectos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener proyectos por estado {Estado}", estado);
                return StatusCode(500, new { message = "Error al obtener proyectos" });
            }
        }

        /// <summary>
        /// Obtiene proyectos por cliente
        /// </summary>
        [HttpGet("cliente/{idCliente}")]
        [ProducesResponseType(typeof(List<ProyectoDetalleDTO>), StatusCodes.Status200OK)]
        public async Task<IActionResult> ObtenerPorCliente(int idCliente)
        {
            try
            {
                var proyectos = await _proyectoService.ObtenerProyectosPorClienteAsync(idCliente);
                return Ok(proyectos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener proyectos del cliente {IdCliente}", idCliente);
                return StatusCode(500, new { message = "Error al obtener proyectos" });
            }
        }

        // ========================================
        // MATERIALES
        // ========================================

        /// <summary>
        /// Calcula los materiales necesarios sin crear el proyecto (preview)
        /// </summary>
        [HttpPost("calcular-materiales")]
        [ProducesResponseType(typeof(CalculoMaterialesResponseDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CalcularMateriales([FromBody] CalculoMaterialesRequestDTO request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _proyectoService.CalcularMaterialesAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al calcular materiales");
                return StatusCode(500, new { message = "Error al calcular materiales" });
            }
        }

        /// <summary>
        /// Valida si hay stock suficiente para crear el proyecto
        /// </summary>
        [HttpPost("validar-stock")]
        [ProducesResponseType(typeof(ValidacionStockDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ValidarStock([FromBody] ValidarStockRequestWrapper request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _proyectoService.ValidarStockAsync(
                    request.Prendas,
                    request.MaterialesManuales
                );

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al validar stock");
                return StatusCode(500, new { message = "Error al validar stock" });
            }
        }

        /// <summary>
        /// Recalcula los materiales de un proyecto existente
        /// </summary>
        [HttpPost("{id}/recalcular-materiales")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> RecalcularMateriales(int id)
        {
            try
            {
                var ok = await _proyectoService.RecalcularMaterialesProyectoAsync(id);

                if (!ok)
                    return NotFound(new { message = $"Proyecto con ID {id} no encontrado" });

                return Ok(new { message = "Materiales recalculados correctamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al recalcular materiales del proyecto {IdProyecto}", id);
                return StatusCode(500, new { message = "Error al recalcular materiales" });
            }
        }

        // ========================================
        // PRENDAS Y TALLES
        // ========================================

        /// <summary>
        /// Obtiene las prendas de un proyecto con su distribución de talles
        /// </summary>
        [HttpGet("{id}/prendas")]
        [ProducesResponseType(typeof(List<ProyectoPrendaDTO>), StatusCodes.Status200OK)]
        public async Task<IActionResult> ObtenerPrendas(int id)
        {
            try
            {
                var prendas = await _proyectoService.ObtenerPrendasProyectoAsync(id);
                return Ok(prendas);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener prendas del proyecto {IdProyecto}", id);
                return StatusCode(500, new { message = "Error al obtener prendas" });
            }
        }

        /// <summary>
        /// Valida que la suma de talles coincida con la cantidad total
        /// </summary>
        [HttpPost("validar-talles")]
        [ProducesResponseType(typeof(ValidarTallesResponseDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ValidarTalles([FromBody] ValidarTallesRequestDTO request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _proyectoService.ValidarDistribucionTallesAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al validar talles");
                return StatusCode(500, new { message = "Error al validar talles" });
            }
        }

        // ========================================
        // FORMULARIO
        // ========================================

        /// <summary>
        /// Obtiene todos los datos necesarios para inicializar el formulario de crear proyecto
        /// </summary>
        [HttpGet("formulario/inicializacion")]
        public async Task<IActionResult> ObtenerDatosFormulario()
        {
            try
            {
                var datos = await _proyectoService.ObtenerDatosFormularioAsync();
                return Ok(datos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener datos del formulario");

                
                return StatusCode(500, new
                {
                    message = "Error al cargar datos del formulario",
                    error = ex.Message,
                    innerError = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace // Solo para desarrollo
                });
            }
        }

        // ========================================
        // AVANCE / SCRAP / OBSERVACIONES
        // ========================================

        /// <summary>
        /// Actualiza el avance de un área del proyecto
        /// </summary>
        [HttpPut("{id}/avance")]
        [RequiresPermission("Proyectos", "CompletarArea")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ActualizarAvance(int id, [FromBody] ActualizarAvanceDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var idUsuario = ObtenerIdUsuarioDesdeToken();
                if (!idUsuario.HasValue)
                    return Unauthorized(new { message = "No se pudo identificar al usuario autenticado." });

                var usuario = await _context.Usuarios
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.IdUsuario == idUsuario.Value);

                if (usuario == null || !string.Equals(usuario.Estado, "Activo", StringComparison.OrdinalIgnoreCase))
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "Usuario inactivo o inexistente." });

                // Operario: solo puede actualizar áreas asignadas en UsuarioArea.
                if (usuario.IdRol == 3)
                {
                    var areasOrdenadas = await _context.AreaProduccions
                        .AsNoTracking()
                        .OrderBy(a => a.Orden)
                        .ToListAsync();

                    var areaSeleccionada = areasOrdenadas.FirstOrDefault(a => a.IdArea == dto.IdArea);
                    if (areaSeleccionada == null && dto.IdArea > 0 && dto.IdArea <= areasOrdenadas.Count)
                    {
                        areaSeleccionada = areasOrdenadas[dto.IdArea - 1];
                    }

                    if (areaSeleccionada == null)
                        return BadRequest(new { message = "Área inválida para actualizar avance." });

                    var puedeEditarArea = await _authorizationService.PuedeEditarArea(idUsuario.Value, areaSeleccionada.NombreArea);
                    if (!puedeEditarArea)
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, new
                        {
                            message = "No tiene asignada esta área para poder actualizarla."
                        });
                    }
                }

                var ok = await _proyectoService.ActualizarAvanceAsync(id, dto);

                if (!ok)
                    return BadRequest(new { message = "No se pudo actualizar el avance" });

                return Ok(new { message = "Avance actualizado correctamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar avance del proyecto {IdProyecto}", id);
                return StatusCode(500, new { message = "Error al actualizar avance" });
            }
        }

        /// <summary>
        /// Registra scrap (desperdicio) en un proyecto
        /// </summary>
        [HttpPost("{id}/scrap")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RegistrarScrap(int id, [FromBody] RegistrarScrapDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var ok = await _proyectoService.RegistrarScrapAsync(id, dto);

                if (!ok)
                    return BadRequest(new { message = "No se pudo registrar el scrap" });

                return Ok(new { message = "Scrap registrado correctamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al registrar scrap del proyecto {IdProyecto}", id);
                return StatusCode(500, new { message = "Error al registrar scrap" });
            }
        }

        /// <summary>
        /// Obtiene el listado de scrap registrado en el proyecto
        /// </summary>
        [HttpGet("{id}/scraps")]
        [ProducesResponseType(typeof(List<ScrapProyectoDTO>), StatusCodes.Status200OK)]
        public async Task<IActionResult> ObtenerScrapsProyecto(int id)
        {
            try
            {
                var result = await _proyectoService.ObtenerScrapsProyectoAsync(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener scrap del proyecto {IdProyecto}", id);
                return StatusCode(500, new { message = "Error al obtener scrap" });
            }
        }

        /// <summary>
        /// Agrega una observación al proyecto
        /// </summary>
        [HttpPost("{id}/observaciones")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AgregarObservacion(int id, [FromBody] AgregarObservacionDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var ok = await _proyectoService.AgregarObservacionAsync(id, dto);

                if (!ok)
                    return BadRequest(new { message = "No se pudo agregar la observación" });

                return Ok(new { message = "Observación agregada correctamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al agregar observación al proyecto {IdProyecto}", id);
                return StatusCode(500, new { message = "Error al agregar observación" });
            }
        }

        // ========================================
        // ESTADO
        // ========================================

        /// <summary>
        /// Cambia el estado de un proyecto
        /// </summary>
        [HttpPatch("{id}/estado")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (string.IsNullOrWhiteSpace(dto.Estado))
                    return BadRequest(new { message = "El estado no puede estar vacío" });

                var ok = await _proyectoService.CambiarEstadoAsync(id, dto.Estado);

                if (!ok)
                    return NotFound(new { message = $"Proyecto con ID {id} no encontrado" });

                return Ok(new { message = "Estado actualizado correctamente", nuevoEstado = dto.Estado });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cambiar estado del proyecto {IdProyecto}", id);
                return StatusCode(500, new { message = "Error al cambiar estado" });
            }
        }

        // ========================================
        // VALIDACIÓN DE EDICIÓN Y HISTORIAL
        // ========================================

        /// <summary>
        /// Asigna materiales del stock global al proyecto (sin requerir ubicación)
        /// </summary>
        [HttpPost("{id}/asignar-materiales")]
        public async Task<IActionResult> AsignarMateriales(int id, [FromBody] AsignarMaterialesDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var proyecto = await _context.Proyectos.FindAsync(id);
                if (proyecto == null)
                    return NotFound(new { message = $"Proyecto {id} no encontrado" });

                if (proyecto.Estado != "Pendiente")
                    return BadRequest(new { message = $"Solo se pueden asignar materiales a proyectos en estado Pendiente. Estado actual: {proyecto.Estado}" });

                if (dto?.Materiales == null || !dto.Materiales.Any())
                    return BadRequest(new { message = "No se recibieron materiales para asignar" });

                var resultados = new List<object>();

                foreach (var item in dto.Materiales)
                {
                    if (item.IdInsumo <= 0)
                    {
                        resultados.Add(new { idInsumo = item.IdInsumo, error = "IdInsumo inválido" });
                        continue;
                    }

                    var insumo = await _context.Insumos.FindAsync(item.IdInsumo);
                    if (insumo == null)
                    {
                        resultados.Add(new { idInsumo = item.IdInsumo, error = "Insumo no encontrado" });
                        continue;
                    }

                    // Si el insumo no tiene stock suficiente, buscar otro del mismo tipo+color que sí tenga
                    if (insumo.StockActual < item.Cantidad && !string.IsNullOrWhiteSpace(insumo.Color))
                    {
                        var colorNorm = NormalizarColor(insumo.Color);
                        var candidatos = await _context.Insumos
                            .Where(i => i.IdTipoInsumo == insumo.IdTipoInsumo
                                     && i.IdInsumo != insumo.IdInsumo
                                     && i.StockActual >= item.Cantidad
                                     && i.Color != null && i.Color != "")
                            .ToListAsync();

                        var alternativo = candidatos.FirstOrDefault(i => NormalizarColor(i.Color) == colorNorm);
                        if (alternativo != null) insumo = alternativo;
                    }

                    if (item.Cantidad <= 0)
                    {
                        resultados.Add(new { idInsumo = item.IdInsumo, error = $"Cantidad inválida: {item.Cantidad}" });
                        continue;
                    }

                    // Idempotencia: si ya fue asignado, omitir
                    bool yaAsignado;
                    if (!string.IsNullOrWhiteSpace(insumo.Color))
                    {
                        var colorNorm = NormalizarColor(insumo.Color);
                        var candidatos = await _context.Insumos
                            .Where(i => i.IdTipoInsumo == insumo.IdTipoInsumo && i.Color != null && i.Color != "")
                            .Select(i => new { i.IdInsumo, i.Color })
                            .ToListAsync();

                        var idsEquivalentes = candidatos
                            .Where(i => NormalizarColor(i.Color) == colorNorm)
                            .Select(i => i.IdInsumo)
                            .ToList();

                        yaAsignado = await _context.InsumoStocks.AnyAsync(s => s.IdProyecto == id && idsEquivalentes.Contains(s.IdInsumo));
                    }
                    else
                    {
                        yaAsignado = await _context.InsumoStocks.AnyAsync(s => s.IdInsumo == insumo.IdInsumo && s.IdProyecto == id);
                    }
                    if (yaAsignado)
                    {
                        resultados.Add(new { idInsumo = insumo.IdInsumo, nombre = insumo.NombreInsumo, info = "Ya estaba asignado, omitido" });
                        continue;
                    }

                    if (insumo.StockActual < item.Cantidad)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new { message = $"Stock insuficiente de {insumo.NombreInsumo} ({insumo.Color}). Disponible: {insumo.StockActual}, Requerido: {item.Cantidad}" });
                    }

                    var stockAntes = insumo.StockActual;
                    insumo.StockActual -= item.Cantidad;
                    insumo.FechaActualizacion = DateOnly.FromDateTime(DateTime.Now);
                    if (insumo.StockActual <= 0) { insumo.StockActual = 0; insumo.Estado = "Agotado"; }
                    else insumo.Estado = "En uso";

                    // Descontar del InsumoStock "Stock General" (IdProyecto = null) de este insumo
                    var stockGeneral = await _context.InsumoStocks
                        .Where(s => s.IdInsumo == insumo.IdInsumo && s.IdProyecto == null)
                        .OrderByDescending(s => s.Cantidad)
                        .FirstOrDefaultAsync();

                    int? idUbicacionHeredada = stockGeneral?.IdUbicacion;

                    if (stockGeneral != null)
                    {
                        stockGeneral.Cantidad -= item.Cantidad;
                        stockGeneral.FechaActualizacion = DateTime.Now;
                        if (stockGeneral.Cantidad <= 0)
                            _context.InsumoStocks.Remove(stockGeneral);
                    }

                    _context.InsumoStocks.Add(new InsumoStock
                    {
                        IdInsumo = insumo.IdInsumo,
                        IdProyecto = id,
                        IdUbicacion = idUbicacionHeredada, // hereda la ubicación del stock general
                        Cantidad = item.Cantidad,
                        FechaActualizacion = DateTime.Now
                    });

                    var destino = $"Proyecto {proyecto.CodigoProyecto ?? id.ToString()}";
                    var observacion = $"Asignado al proyecto {proyecto.NombreProyecto}";
                    _context.InventarioMovimientos.Add(new InventarioMovimiento
                    {
                        IdInsumo = insumo.IdInsumo,
                        NombreInsumo = insumo.NombreInsumo,
                        TipoMovimiento = "Asignacion",
                        Cantidad = item.Cantidad,
                        FechaMovimiento = DateOnly.FromDateTime(DateTime.Now),
                        Origen = "Stock General",
                        Destino = destino.Length > 100 ? destino[..100] : destino,
                        Observacion = observacion.Length > 100 ? observacion[..100] : observacion
                    });

                    resultados.Add(new
                    {
                        idInsumoSolicitado = item.IdInsumo,
                        idInsumoAsignado = insumo.IdInsumo,
                        nombre = insumo.NombreInsumo,
                        color = insumo.Color,
                        stockAntes,
                        stockDespues = insumo.StockActual,
                        cantidad = item.Cantidad
                    });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { message = "Materiales asignados correctamente", detalle = resultados });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error al asignar materiales al proyecto {id}", id);
                return StatusCode(500, new { message = "Error al asignar materiales", detalle = ex.Message, inner = ex.InnerException?.Message });
            }
        }

        /// <summary>
        /// Verifica si todos los materiales del proyecto están asignados
        /// </summary>
        [HttpGet("{id}/materiales-listos")]
        public async Task<IActionResult> VerificarMaterialesListos(int id)
        {
            try
            {
                var proyecto = await _context.Proyectos.FindAsync(id);
                if (proyecto == null)
                    return NotFound(new { message = $"Proyecto {id} no encontrado" });

                var materiales = await _context.MaterialCalculados
                    .Include(mc => mc.IdInsumoNavigation)
                        .ThenInclude(i => i != null ? i.IdTipoInsumoNavigation : null)
                    .Include(mc => mc.IdProyectoPrendaNavigation)
                    .Where(mc => mc.IdProyecto == id)
                    .ToListAsync();

                if (!materiales.Any())
                    return Ok(new { listos = false, mensaje = "El proyecto no tiene materiales calculados" });

                var detalles = new List<object>();
                bool todosListos = true;

                foreach (var mat in materiales)
                {
                    var cantidadNecesaria = mat.CantidadManual ?? mat.CantidadCalculada;

                    var idTipoInsumo = mat.IdInsumoNavigation?.IdTipoInsumo ?? 0;
                    var colorSolicitado = mat.IdProyectoPrendaNavigation?.ColorTela;
                    var colorParaMatch = !string.IsNullOrWhiteSpace(colorSolicitado)
                        ? colorSolicitado
                        : mat.IdInsumoNavigation?.Color;

                    decimal stockAsignado;
                    if (idTipoInsumo > 0)
                    {
                        // Con color solicitado → contar por tipo+color; sin color → contar por tipo (cualquier insumo del tipo)
                        if (!string.IsNullOrWhiteSpace(colorParaMatch))
                        {
                            var colorNorm = NormalizarColor(colorParaMatch);
                            var idsEquivalentes = await _context.Insumos
                                .Where(i => i.IdTipoInsumo == idTipoInsumo && i.Color != null && i.Color != "")
                                .Select(i => new { i.IdInsumo, i.Color })
                                .ToListAsync();

                            var ids = idsEquivalentes
                                .Where(i => NormalizarColor(i.Color) == colorNorm)
                                .Select(i => i.IdInsumo)
                                .ToList();

                            stockAsignado = ids.Count == 0
                                ? 0
                                : await _context.InsumoStocks
                                    .Where(s => s.IdProyecto == id && ids.Contains(s.IdInsumo))
                                    .SumAsync(s => (decimal?)s.Cantidad) ?? 0;
                        }
                        else
                        {
                            var idsTipo = await _context.Insumos
                                .Where(i => i.IdTipoInsumo == idTipoInsumo)
                                .Select(i => i.IdInsumo)
                                .ToListAsync();

                            stockAsignado = idsTipo.Count == 0
                                ? 0
                                : await _context.InsumoStocks
                                    .Where(s => s.IdProyecto == id && idsTipo.Contains(s.IdInsumo))
                                    .SumAsync(s => (decimal?)s.Cantidad) ?? 0;
                        }
                    }
                    else
                    {
                        // Fallback: por insumo exacto
                        stockAsignado = await _context.InsumoStocks
                            .Where(s => s.IdInsumo == mat.IdInsumo && s.IdProyecto == id)
                            .SumAsync(s => (decimal?)s.Cantidad) ?? 0;
                    }

                    var listo = stockAsignado >= cantidadNecesaria;
                    if (!listo) todosListos = false;

                    detalles.Add(new
                    {
                        idInsumo = mat.IdInsumo,
                        idTipoInsumo,
                        nombreInsumo = mat.IdInsumoNavigation?.IdTipoInsumoNavigation?.NombreTipo
                                      ?? mat.IdInsumoNavigation?.NombreInsumo,
                        colorSolicitado,
                        colorInsumo = mat.IdInsumoNavigation?.Color,
                        cantidadNecesaria,
                        stockAsignado,
                        listo
                    });
                }

                return Ok(new { listos = todosListos, detalles });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar materiales del proyecto {id}", id);
                return StatusCode(500, new { message = "Error al verificar materiales" });
            }
        }

        /// <summary>
        /// Valida qué campos se pueden editar según el estado del proyecto
        /// </summary>
        [HttpGet("{id}/validar-edicion")]
        [ProducesResponseType(typeof(ProyectoValidacionEdicionDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ValidarEdicion(int id)
        {
            try
            {
                var validacion = await _validacionService.ValidarEdicion(id);

                if (validacion.EstadoActual == "No encontrado")
                    return NotFound(new { message = $"Proyecto con ID {id} no encontrado" });

                return Ok(validacion);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al validar edición del proyecto {IdProyecto}", id);
                return StatusCode(500, new { message = "Error al validar edición" });
            }
        }

        /// <summary>
        /// Obtiene el historial de cambios de un proyecto
        /// </summary>
        [HttpGet("{id}/historial")]
        [ProducesResponseType(typeof(List<ProyectoHistorialCambioDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObtenerHistorial(int id, [FromQuery] int pagina = 1, [FromQuery] int tamanoPagina = 20)
        {
            try
            {
                var proyecto = await _proyectoService.ObtenerProyectoPorIdAsync(id);

                if (proyecto == null)
                    return NotFound(new { message = $"Proyecto con ID {id} no encontrado" });

                var request = new ProyectoHistorialRequestDTO
                {
                    IdProyecto = id,
                    Pagina = pagina,
                    TamanoPagina = tamanoPagina
                };

                var historial = await _auditoriaService.ObtenerHistorial(request);

                return Ok(historial);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener historial del proyecto {IdProyecto}", id);
                return StatusCode(500, new { message = "Error al obtener historial" });
            }
        }

        private int? ObtenerIdUsuarioDesdeToken()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? User.FindFirstValue("sub");

            return int.TryParse(raw, out var idUsuario) ? idUsuario : null;
        }

        private static string NormalizarColor(string? color)
        {
            if (string.IsNullOrWhiteSpace(color)) return "";

            var normalized = color.Trim().ToUpperInvariant().Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder(normalized.Length);
            foreach (var ch in normalized)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
                    sb.Append(ch);
            }
            return sb.ToString();
        }
    }

    // ========================================
    // DTOs AUXILIARES
    // ========================================

    /// <summary>
    /// Wrapper para validar stock
    /// </summary>
    public class ValidarStockRequestWrapper
    {
        public List<ProyectoPrendaCrearDTO> Prendas { get; set; } = new();
        public List<MaterialManualDTO>? MaterialesManuales { get; set; }
    }

    /// <summary>
    /// DTO para cambiar estado
    /// </summary>
    public class CambiarEstadoDTO
    {
        public string Estado { get; set; } = null!;
    }

    public class AsignarMaterialesDTO
    {
        public List<AsignarMaterialItem> Materiales { get; set; } = new();
    }

    public class AsignarMaterialItem
    {
        public int IdInsumo { get; set; }
        public decimal Cantidad { get; set; }
    }
}
