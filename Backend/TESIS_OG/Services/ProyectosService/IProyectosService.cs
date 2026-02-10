using TESIS_OG.DTOs.Proyectos;
using TESIS_OG.DTOs.Configuracion;

namespace TESIS_OG.Services.ProyectosService
{
    public interface IProyectosService
    {
        // ========================================
        // CRUD BÁSICO
        // ========================================

        /// <summary>
        /// Crea un nuevo proyecto con múltiples prendas y calcula materiales automáticamente
        /// </summary>
        Task<ProyectoDetalleDTO?> CrearProyectoAsync(ProyectoCrearDTO proyectoDto);

        /// <summary>
        /// Obtiene todos los proyectos con información básica
        /// </summary>
        Task<List<ProyectoDetalleDTO>> ObtenerTodosLosProyectosAsync();

        /// <summary>
        /// Obtiene un proyecto por ID con toda su información (prendas, talles, materiales)
        /// </summary>
        Task<ProyectoDetalleDTO?> ObtenerProyectoPorIdAsync(int id);

        /// <summary>
        /// Actualiza un proyecto existente (solo datos generales, no prendas)
        /// </summary>
        Task<ProyectoDetalleDTO?> ActualizarProyectoAsync(int id, ProyectoActualizarDTO proyectoDto);

        /// <summary>
        /// Elimina (archiva) un proyecto
        /// </summary>
        Task<bool> EliminarProyectoAsync(int id);

        // ========================================
        // BÚSQUEDA Y FILTROS
        // ========================================

        Task<List<ProyectoDetalleDTO>> ObtenerProyectosPorEstadoAsync(string estado);
        Task<List<ProyectoDetalleDTO>> ObtenerProyectosPorClienteAsync(int idCliente);

        // ========================================
        // CÁLCULO Y VALIDACIÓN DE MATERIALES
        // ========================================

        /// <summary>
        /// Calcula los materiales necesarios sin crear el proyecto (preview)
        /// </summary>
        Task<CalculoMaterialesResponseDTO> CalcularMaterialesAsync(CalculoMaterialesRequestDTO request);

        /// <summary>
        /// Valida si hay stock suficiente para las prendas del proyecto
        /// </summary>
        Task<ValidacionStockDTO> ValidarStockAsync(List<ProyectoPrendaCrearDTO> prendas, List<MaterialManualDTO>? materialesManuales);

        /// <summary>
        /// Recalcula los materiales de un proyecto existente
        /// </summary>
        Task<bool> RecalcularMaterialesProyectoAsync(int idProyecto);

        // ========================================
        // GESTIÓN DE PRENDAS Y TALLES
        // ========================================

        /// <summary>
        /// Obtiene las prendas de un proyecto con su distribución de talles
        /// </summary>
        Task<List<ProyectoPrendaDTO>> ObtenerPrendasProyectoAsync(int idProyecto);

        /// <summary>
        /// Valida que la suma de talles coincida con la cantidad total
        /// </summary>
        Task<ValidarTallesResponseDTO> ValidarDistribucionTallesAsync(ValidarTallesRequestDTO request);

        // ========================================
        // CATÁLOGOS PARA FORMULARIO
        // ========================================

        /// <summary>
        /// Obtiene todos los datos necesarios para inicializar el formulario de crear proyecto
        /// </summary>
        Task<FormularioProyectoInicializacionDTO> ObtenerDatosFormularioAsync();

        // ========================================
        // GESTIÓN DE AVANCE (MANTENER COMPATIBILIDAD)
        // ========================================

        Task<bool> ActualizarAvanceAsync(int idProyecto, ActualizarAvanceDTO avanceDto);

        // ========================================
        // GESTIÓN DE SCRAP (MANTENER COMPATIBILIDAD)
        // ========================================

        Task<bool> RegistrarScrapAsync(int idProyecto, RegistrarScrapDTO scrapDto);

        // ========================================
        // OBSERVACIONES (MANTENER COMPATIBILIDAD)
        // ========================================

        Task<bool> AgregarObservacionAsync(int idProyecto, AgregarObservacionDTO observacionDto);

        // ========================================
        // CAMBIO DE ESTADO
        // ========================================

        Task<bool> CambiarEstadoAsync(int idProyecto, string nuevoEstado);
        Task ActualizarProyectoAsync(int id, ProyectoEditarDTO proyectoDto);
    }
}