using System.Collections.Generic;
using System.Threading.Tasks;
using TESIS_OG.DTOs.Proyectos;

namespace TESIS_OG.Services.ProyectoAuditoriaService
{
    public interface IProyectoAuditoriaService
    {
        Task RegistrarCambio(ProyectoAuditoriaDTO auditoria);
        Task RegistrarCambioPropiedad(int idProyecto, int? idUsuario, string campo, string valorAnterior, string valorNuevo, string? descripcion = null);
        Task RegistrarCambioEstado(int idProyecto, int? idUsuario, string estadoAnterior, string estadoNuevo);
        Task<List<ProyectoHistorialCambioDTO>> ObtenerHistorial(ProyectoHistorialRequestDTO request);
        string ObtenerIPCliente();
    }
}