using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class PrendaTalle
{
    public int IdPrendaTalle { get; set; }

    public int IdProyectoPrenda { get; set; }

    public int IdTalle { get; set; }

    public int Cantidad { get; set; }

    public virtual ProyectoPrendum IdProyectoPrendaNavigation { get; set; } = null!;

    public virtual Talle IdTalleNavigation { get; set; } = null!;
}
