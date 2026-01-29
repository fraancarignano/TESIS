using TESIS_OG.DTOs.Proyectos;

namespace TESIS_OG.Services.ProyectosService
{
  public interface IProyectosService
  {
    // CRUD Básico
    Task<ProyectoResponseDTO?> CrearProyectoAsync(ProyectoCrearDTO proyectoDto);
    Task<List<ProyectoResponseDTO>> ObtenerTodosLosProyectosAsync();
    Task<ProyectoResponseDTO?> ObtenerProyectoPorIdAsync(int id);
    Task<ProyectoResponseDTO?> ActualizarProyectoAsync(int id, ProyectoEditarDTO proyectoDto);
    Task<bool> EliminarProyectoAsync(int id);

    // Búsqueda y filtros
    Task<List<ProyectoResponseDTO>> BuscarProyectosAsync(ProyectoSearchDTO filtros);
    Task<List<ProyectoResponseDTO>> ObtenerProyectosPorEstadoAsync(string estado);

    // Gestión de materiales
    Task<bool> AgregarMaterialesAsync(int idProyecto, List<MaterialAsignadoDTO> materiales);

    // Gestión de avance
    Task<bool> ActualizarAvanceAsync(int idProyecto, ActualizarAvanceDTO avanceDto);

    // Gestión de scrap
    Task<bool> RegistrarScrapAsync(int idProyecto, RegistrarScrapDTO scrapDto);

    // Observaciones
    Task<bool> AgregarObservacionAsync(int idProyecto, AgregarObservacionDTO observacionDto);

    // Cambio de estado
    Task<bool> CambiarEstadoAsync(int idProyecto, string nuevoEstado);

  }
}
