using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using SonyIMX500.Models;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace SonyIMX500.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private static string _token = "test";
        HttpClient httpClient;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Spa()
        {
            return File("~/index.html", "text/html");
        }

        public IActionResult Index()
        {
            ViewData["Token"] = _token;
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        [HttpPost]
        public bool PostToken(string token)
        {
            ViewData["Token"] = token;
            _token = token;
            return true;
        }

        [HttpPost]
        public async Task<ActionResult> GetDevices(string deviceId)
        {

            try
            {
                using (HttpClient client = new HttpClient())
                {
                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _token);
                    client.DefaultRequestHeaders.Add("X-AppGw-Validation", "PMrcP4UvN.XvoYbC");
                    client.DefaultRequestHeaders.Host = "apim-labstaging05.azure-api.net";
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                    var response = await client.GetAsync($"https://apim-labstaging05.azure-api.net/v09_m/v1/devices/{deviceId}");

                    response.EnsureSuccessStatusCode();

                    var jsonString = await response.Content.ReadAsStringAsync();
                    jsonString.Replace(@"\", "");
                    return Ok(Json(jsonString));
                }
            }
            catch (Exception ex)
            {
                //
            }
            return null;
        }
    }
}
