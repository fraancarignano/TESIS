using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;
using TESIS_OG.Models;

namespace TESIS_OG.Pages_Clientes
{
    public class IndexModel : PageModel
    {
        private readonly TESIS_OG.Data.TamarindoDbContext _context;

        public IndexModel(TESIS_OG.Data.TamarindoDbContext context)
        {
            _context = context;
        }

        public IList<Cliente> Cliente { get;set; } = default!;

        public async Task OnGetAsync()
        {
            Cliente = await _context.Clientes
                .Include(c => c.IdDireccionNavigation)
                .Include(c => c.IdEstadoClienteNavigation).ToListAsync();
        }
    }
}
