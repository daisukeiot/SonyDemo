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
using Microsoft.WindowsAzure.Storage.Blob;
using Microsoft.WindowsAzure.Storage;

namespace SonyIMX500.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private static string _token = "test";
        private readonly AppSettings _appSettings;
        const string blobContainerName = "iothub-link";
        static BlobContainerClient blobContainer;
        static string userSasToken = string.Empty;
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

        private void AddRequestHeader(HttpClient client)
        {
            client.DefaultRequestHeaders.Add("Training-Key", _appSettings.CustomVision.AccessKey);
        }

        private async Task<HttpResponseMessage> SendCVGet(string requestSegment)
        {
            using (HttpClient client = new HttpClient())
            {
                Uri baseUri = new Uri(_appSettings.CustomVision.Endpoint);
                Uri requestUri = new Uri($"{baseUri.AbsoluteUri}/{requestSegment}");

                AddRequestHeader(client);

                return await client.GetAsync(requestUri.AbsoluteUri);
            }
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        public async Task<string> GetSasToken()
        {
            try
            {
                CloudStorageAccount storageAccount = CloudStorageAccount.Parse(_appSettings.Blob.ConnectionString);
                CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();
                CloudBlobContainer container = blobClient.GetContainerReference(blobContainerName);
                var blob = container.GetBlockBlobReference(blobContainerName);

                BlobContainerPermissions blobPermissions = new BlobContainerPermissions();

                blobPermissions.SharedAccessPolicies.Add("accesspolicy", new SharedAccessBlobPolicy()
                {
                    // To ensure SAS is valid immediately, don’t set start time.
                    // This way, you can avoid failures caused by small clock differences.
                    SharedAccessExpiryTime = DateTime.UtcNow.AddMinutes(5),
                    Permissions = SharedAccessBlobPermissions.Read
                });

                blobPermissions.PublicAccess = BlobContainerPublicAccessType.Off;

                await container.SetPermissionsAsync(blobPermissions);

                string sasToken =
                    container.GetSharedAccessSignature(new SharedAccessBlobPolicy(), "accesspolicy");

                return sasToken;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in {System.Reflection.MethodBase.GetCurrentMethod().Name}() {ex.Message}");
            }

            return string.Empty;
        }

        #region BLOB
        [HttpGet]
        public async Task<ActionResult> GetAllImagesFromBlob()
        {
            string sas = await GetSasToken();

            try
            {
                List<string> allBlobs = new List<string>();

                foreach (BlobItem blob in blobContainer.GetBlobs())
                {
                    if (blob.Properties.BlobType == Azure.Storage.Blobs.Models.BlobType.Block)
                    {
                        var blobClient = blobContainer.GetBlobClient(blob.Name);

                        allBlobs.Add($"{blobClient.Uri.AbsoluteUri}{sas}");
                    }
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

        #region CUSTOMVISIONGET
        //
        // https://docs.microsoft.com/en-us/rest/api/customvision/training3.3/get-projects/get-projects
        //
        [HttpGet]
        public async Task<IActionResult> GetProjects(string model_id)
        {
            try
            {
                var response = await SendCVGet($"customvision/v3.3/training/projects");
                var jsonString = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    return Ok(Json(jsonString));
                }
                else
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, Json(jsonString));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in {System.Reflection.MethodBase.GetCurrentMethod().Name}() {ex.Message}");
                System.Diagnostics.Trace.TraceError($"Excetion in {System.Reflection.MethodBase.GetCurrentMethod().Name}() {ex.Message}");
                return BadRequest(ex.Message);
            }
        }
        #endregion
    }
}
