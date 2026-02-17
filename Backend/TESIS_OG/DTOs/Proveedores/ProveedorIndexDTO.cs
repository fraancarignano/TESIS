namespace TESIS_OG.DTOs.Proveedores
{
    public class ProveedorIndexDTO
    {
        public int IdProveedor { get; set; }
        public string NombreProveedor { get; set; } = null!;
        public string? Cuit { get; set; }
        public string? Telefono { get; set; }
        public string? Email { get; set; }
        public string? Direccion { get; set; }
        public string? Observaciones { get; set; }
        public DateOnly FechaAlta { get; set; }
    }
}
