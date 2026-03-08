namespace TESIS_OG.DTOs.Reportes.Proveedores;

public class ReporteTiemposEntregaDTO
{
    public int TotalOrdenes { get; set; }
    public int OrdenesATiempo { get; set; }
    public int OrdenesConRetraso { get; set; }
    public int OrdenesAnticipadas { get; set; }
    public double PromedioDiasRetraso { get; set; } // Solo de las que tienen retraso
    public List<OrdenTiempoDTO> DetalleOrdenes { get; set; } = new List<OrdenTiempoDTO>();
}

public class OrdenTiempoDTO
{
    public int IdOrdenCompra { get; set; }
    public string NroOrden { get; set; } = null!;
    public string NombreProveedor { get; set; } = null!;
    public DateOnly? FechaEntregaEstimada { get; set; }
    public DateOnly? FechaRecepcionControl { get; set; }
    public int DiasDiferencia { get; set; } // Negativo = anticipado, Positivo = retraso
    public string EstadoTiempo { get; set; } = null!; // "A tiempo", "Con retraso", "Anticipado"
}

public class ReportePrecisionPedidosDTO
{
    public decimal TotalCantidadPedida { get; set; }
    public decimal TotalCantidadRecibida { get; set; }
    public double PorcentajeCumplimientoGlobal { get; set; } // (Recibida / Pedida) * 100
    public List<PrecisionProveedorDTO> ResumenPorProveedor { get; set; } = new List<PrecisionProveedorDTO>();
    public List<OrdenPrecisionDTO> DetalleOrdenes { get; set; } = new List<OrdenPrecisionDTO>();
}

public class PrecisionProveedorDTO
{
    public int IdProveedor { get; set; }
    public string NombreProveedor { get; set; } = null!;
    public decimal CantidadPedida { get; set; }
    public decimal CantidadRecibida { get; set; }
    public double PorcentajeCumplimiento { get; set; }
}

public class OrdenPrecisionDTO
{
    public int IdOrdenCompra { get; set; }
    public string NroOrden { get; set; } = null!;
    public string NombreProveedor { get; set; } = null!;
    public decimal CantidadPedida { get; set; }
    public decimal CantidadRecibida { get; set; }
    public double PorcentajeCumplimiento { get; set; }
}
