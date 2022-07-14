using Microsoft.AspNetCore.Mvc;

namespace SonyIMX500.Controllers
{
    public class SafetyDetection : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
