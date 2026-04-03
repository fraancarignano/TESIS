using System.ComponentModel.DataAnnotations;

namespace Tesis.DTOs.ProyectoDiseno;

public class CompletarAreaDisenoDto
{
    [MaxLength(1000)]
    public string? Observaciones { get; set; }
}
