namespace TESIS_OG.DTOs.Proyectos
{
  public class ProyectoEditarDTO
  {
    public string? NombreProyecto { get; set; }
    public string? TipoPrenda { get; set; }
    public string? Descripcion { get; set; }
    public string? Prioridad { get; set; }
    public string? Estado { get; set; }
    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public int? CantidadTotal { get; set; }
    public int? CantidadProducida { get; set; }
    public int? IdUsuarioEncargado { get; set; }
    public string? TipoEstacion { get; set; }
    public string? AreaActual { get; set; }
    public int? AvanceGerenciaAdmin { get; set; }
    public int? AvanceDiseñoDesarrollo { get; set; }
    public int? AvanceControlCalidad { get; set; }
    public int? AvanceEtiquetadoEmpaquetado { get; set; }
    public int? AvanceDepositoLogistica { get; set; }
  }
}
