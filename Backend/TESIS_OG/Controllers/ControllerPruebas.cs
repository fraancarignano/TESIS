using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data; // Ajusta según tu namespace

namespace TESIS_OG.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        private readonly TamarindoDbContext _context;

        public TestController(TamarindoDbContext context)
        {
            _context = context;
        }

        [HttpGet("test-connection")]
        public async Task<IActionResult> TestConnection()
        {
            try
            {
                // Intenta conectarse a la BD
                var canConnect = await _context.Database.CanConnectAsync();

                if (canConnect)
                {
                    return Ok(new
                    {
                        message = "✅ Conexión exitosa a la base de datos",
                        database = _context.Database.GetDbConnection().Database
                    });
                }

                return StatusCode(500, "❌ No se pudo conectar a la base de datos");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "❌ Error al conectar",
                    error = ex.Message
                });
            }
        }

        //[HttpGet("tables-count")]
        //public IActionResult GetTablesInfo()
        //{
        //    try
        //    {
        //        // Ejemplo: cuenta registros de alguna tabla
        //        // Reemplaza "TuTabla" por el nombre real de una de tus entidades
        //        // var count = await _context.TuTabla.CountAsync();

        //        return Ok(new
        //        {
        //            message = "✅ Conexión OK",
        //            // tableCount = count
        //        });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new
        //        {
        //            message = "❌ Error",
        //            error = ex.Message
        //        });
        //    }
        //}
    }
}