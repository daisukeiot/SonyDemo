using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SonyIMX500.Models;
using System;
using System.Threading.Tasks;

namespace SonyIMX500.Controllers
{

    [Authorize]
    public class ZoneDetection : Controller
    {
        private readonly ILogger<SonyController> _logger;

        public ZoneDetection(IOptions<AppSettings> optionsAccessor, ILogger<SonyController> logger)
        {
            _logger = logger;
        }
        //[Authorize]
        public IActionResult Index()
        {
            if (HttpContext.Request.Cookies.ContainsKey("ZoneDetectionDevId"))
            {
                _logger.LogDebug("Test");
                //HttpContext.Response.Cookies.Append("ZoneDetectionDevId", DateTime.Now.ToString());
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
                    Path = "/ZoneDetection",
                    Expires = new DateTimeOffset(DateTime.Now.AddDays(7))
                    //Expires = new DateTimeOffset(DateTime.Now.AddHours(3))
                };

                HttpContext.Response.Cookies.Append("ZoneDetectionDevId", device_id, cOptions);
                HttpContext.Response.Cookies.Append("ZoneDetectionModelId", model_id, cOptions);
                HttpContext.Response.Cookies.Append("ZoneDetectionRect", rect_zone, cOptions);
                HttpContext.Response.Cookies.Append("ZoneDetectionThreshold", threshold, cOptions);
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
