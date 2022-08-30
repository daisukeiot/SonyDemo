using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SonyIMX500.Models;
using System;
using System.Threading.Tasks;

namespace SonyIMX500.Controllers
{
    public class SafetyDetection : Controller
    {
        private readonly ILogger<SonyController> _logger;

        public SafetyDetection(IOptions<AppSettings> optionsAccessor, ILogger<SonyController> logger)
        {
            _logger = logger;
        }
        public IActionResult Index()
        {
            if (HttpContext.Request.Cookies.ContainsKey("SafetyZoneDevId"))
            {
                _logger.LogDebug("Test");
                //HttpContext.Response.Cookies.Append("SafetyZoneDevId", DateTime.Now.ToString());
            }
            return View();
        }

        [HttpPost]
        public ActionResult SaveParameters(string device_id, string model_id, string rect_zone, string threshold, string capture_photo_url)
        {
            try
            {
                var cOptions = new CookieOptions()
                {
                    Path = "/SafetyDetection",
                    Expires = new DateTimeOffset(DateTime.Now.AddDays(7))
                    //Expires = new DateTimeOffset(DateTime.Now.AddHours(3))
                };

                HttpContext.Response.Cookies.Append("SafetyZoneDevId", device_id, cOptions);
                HttpContext.Response.Cookies.Append("SafetyZoneModelId", model_id, cOptions);
                HttpContext.Response.Cookies.Append("SafetyZoneRect", rect_zone, cOptions);
                HttpContext.Response.Cookies.Append("SafetyZoneThreshold", threshold, cOptions);
                HttpContext.Response.Cookies.Append("capture_photo_url", capture_photo_url, cOptions);
                return Ok();
            }
            catch (ArgumentException ex)
            {
                return StatusCode(StatusCodes.Status400BadRequest, Json(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in {System.Reflection.MethodBase.GetCurrentMethod().Name}() {ex.Message}");
                return BadRequest(ex.Message);
            }
        }

    }
}
