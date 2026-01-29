public class ClienteIndexDTO
{
    public int IdCliente { get; set; }
    public string TipoCliente { get; set; } = null!;

    // Nombre completo combinado
    public string NombreCompleto
    {
        get
        {
            if (!string.IsNullOrEmpty(RazonSocial))
                return RazonSocial;
            return $"{Nombre} {Apellido}".Trim();
        }
    }

    public string? Nombre { get; set; }
    public string? Apellido { get; set; }
    public string? RazonSocial { get; set; }
    public string? NumeroDocumento { get; set; }
    public string? CuitCuil { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? Direccion { get; set; }
    public string? CodigoPostal { get; set; }

    // IDs de ubicación - ✅ AGREGÁ ESTOS
    public int? IdCiudad { get; set; }
    public int? IdProvincia { get; set; }

    // Nombres de ubicación
    public string? NombreCiudad { get; set; }
    public string? NombreProvincia { get; set; }

    public int IdEstadoCliente { get; set; }
    public string? NombreEstado { get; set; }
    public DateOnly FechaAlta { get; set; }
}