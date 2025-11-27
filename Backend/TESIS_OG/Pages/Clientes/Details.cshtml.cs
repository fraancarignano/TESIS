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
    public class DetailsModel : PageModel
    {
        private readonly TESIS_OG.Data.TamarindoDbContext _context;

        public DetailsModel(TESIS_OG.Data.TamarindoDbContext context)
        {
            _context = context;
        }

        public Cliente Cliente { get; set; } = default!;

        public async Task<IActionResult> OnGetAsync(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var cliente = await _context.Clientes.FirstOrDefaultAsync(m => m.IdCliente == id);
            if (cliente == null)
            {
                return NotFound();
            }
            else
            {
                Cliente = cliente;
            }
            return Page();
        }
    }
}
