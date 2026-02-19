using Microsoft.AspNetCore.Mvc;
using TESIS_OG.DTOs.Proyectos;
using TESIS_OG.DTOs.Configuracion;
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

        public ProyectoController(
            IProyectosService proyectoService,
            ILogger<ProyectoController> logger,
            IProyectoAuditoriaService auditoriaService,
            IProyectoValidacionService validacionService)
        {
            _proyectoService = proyectoService;
            _logger = logger;
            _auditoriaService = auditoriaService;
            _validacionService = validacionService;
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
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ActualizarAvance(int id, [FromBody] ActualizarAvanceDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

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
}