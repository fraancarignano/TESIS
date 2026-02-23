namespace TESIS_OG.DTOs.Talleres;

public class TallerIndexDTO
{
    public int IdTaller { get; set; }
    public string NombreTaller { get; set; } = null!;
    public string? TipoTaller { get; set; }
    public string? Responsable { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? Direccion { get; set; }
    public int IdCiudad { get; set; }
    public int IdProvincia { get; set; }
    public string? NombreCiudad { get; set; }
    public string? NombreProvincia { get; set; }
    public int CantidadProyectosAsignados { get; set; }
    public DateOnly? FechaUltimaAsignacion { get; set; }
}
