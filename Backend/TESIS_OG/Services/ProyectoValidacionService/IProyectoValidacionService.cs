using System.Collections.Generic;
using System.Threading.Tasks;
using TESIS_OG.DTOs.Proyectos;

namespace TESIS_OG.Services.ProyectoValidacionService
{
    public interface IProyectoValidacionService
    {
        Task<ProyectoValidacionEdicionDTO> ValidarEdicion(int idProyecto);
        bool EsEditable(string estado);
        bool PermiteEdicionCompleta(string estado);
        List<string> ObtenerCamposEditables(string estado);
        List<string> ObtenerCamposBloqueados(string estado);
    }
}