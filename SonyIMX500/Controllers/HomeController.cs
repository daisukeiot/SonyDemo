using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SonyIMX500.Models;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace SonyIMX500.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private static string _token = "test";
        private readonly AppSettings _appSettings;
        const string blobContainerName = "iothub-link";
        static BlobContainerClient blobContainer;
        public HomeController(IOptions<AppSettings> optionsAccessor, ILogger<HomeController> logger)
        {
            _appSettings = optionsAccessor.Value;
            _logger = logger;
            BlobServiceClient blobServiceClient = new BlobServiceClient(_appSettings.Blob.ConnectionString);
            blobContainer = blobServiceClient.GetBlobContainerClient(blobContainerName);
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

        #region BLOB
        [HttpGet]
        public ActionResult GetAllImagesFromBlob()
        {
            try
            {
                List<Uri> allBlobs = new List<Uri>();

                foreach (BlobItem blob in blobContainer.GetBlobs())
                {
                    if (blob.Properties.BlobType == BlobType.Block)
                        allBlobs.Add(blobContainer.GetBlobClient(blob.Name).Uri);
                }

                return Ok(Json(allBlobs));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in {System.Reflection.MethodBase.GetCurrentMethod().Name}() {ex.Message}");
                return BadRequest(ex.Message);
            }
        }
        #endregion // blob
    }
}
