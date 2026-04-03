using System.ComponentModel.DataAnnotations;

namespace Tesis.DTOs.ProyectoDiseno;

public class ProyectoDisenoDto
{
    [Required]
    [MinLength(1)]
    public List<ProyectoDisenoPrendaDto> Prendas { get; set; } = [];

    [MaxLength(1000)]
    public string? ObservacionesGenerales { get; set; }
}

public class ProyectoDisenoPrendaDto
{
    [Required]
    public int IdPrenda { get; set; }

    public string? ImagenLogo { get; set; }

    [MaxLength(500)]
    public string? DescripcionLogo { get; set; }

    [Required]
    public string? ImagenMockup { get; set; }

    [MaxLength(500)]
    public string? DescripcionMockup { get; set; }
}
