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
using Azure.Storage.Sas;

namespace SonyIMX500.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private static string _token = "test";
        private readonly AppSettings _appSettings;
        const string blobContainerName = "iothub-link";
        static BlobContainerClient blobContainerClient;
        static string userSasToken = string.Empty;
        public HomeController(IOptions<AppSettings> optionsAccessor, ILogger<HomeController> logger)
        {
            _appSettings = optionsAccessor.Value;
            _logger = logger;
            BlobServiceClient blobServiceClient = new BlobServiceClient(_appSettings.Blob.ConnectionString);
            blobContainerClient = blobServiceClient.GetBlobContainerClient(blobContainerName);
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
                Uri requestUri = new Uri($"{baseUri.AbsoluteUri}{requestSegment}");

                AddRequestHeader(client);

                return await client.GetAsync(requestUri.AbsoluteUri);
            }
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        public string GetSasToken()
        {
            try
            {
                if (blobContainerClient.CanGenerateSasUri)
                {
                    BlobSasBuilder sasBuilder = new BlobSasBuilder()
                    {
                        BlobContainerName = blobContainerClient.Name,
                        Resource = "b",
                        ExpiresOn = DateTime.UtcNow.AddHours(1)
                    };

                    sasBuilder.SetPermissions(BlobContainerSasPermissions.Read);
                    Uri sasUri = blobContainerClient.GenerateSasUri(sasBuilder);
                    return sasUri.Query;
                }
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
            var responses = new List<BLOB_IMAGE_DATA>();

            string sas = GetSasToken();

            try
            {
                await foreach (BlobItem item in blobContainerClient.GetBlobsAsync())
                {
                    var blobClient = blobContainerClient.GetBlobClient(item.Name);
                    var response = new BLOB_IMAGE_DATA();

                    var fileName = item.Name.Split("/");

                    response.DeviceId = fileName[0];
                    response.FileName = fileName[fileName.Length - 1];
                    response.CreateDate = item.Properties.CreatedOn.ToString();
                    response.Image = $"{blobClient.Uri.AbsoluteUri}{sas}";

                    responses.Add(response);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in {System.Reflection.MethodBase.GetCurrentMethod().Name}() {ex.Message}");
                return BadRequest(ex.Message);
            }

            return Ok(Json(JsonConvert.SerializeObject(responses)));
        }

        [HttpGet]
        public async Task<ActionResult> FindImagesFromBlob(string deviceId, string timeStamp)
        {
            try
            {

                //CloudBlobContainer blobContainer = CloudStorageAccount
                //                                    .Parse(_appSettings.Blob.ConnectionString)
                //                                    .CreateCloudBlobClient()
                //                                    .GetContainerReference("iothub-link");

                BlobServiceClient blobServiceClient = new BlobServiceClient(_appSettings.Blob.ConnectionString);
                BlobContainerClient blobContainerClient = blobServiceClient.GetBlobContainerClient("iothub-link");

                //var directory = blobContainer.GetDirectoryReference(deviceId);
                //var item = await RecursiveFindFile(directory, deviceId, timeStamp);

                //if (item != null)
                //{
                //    string sas = await GetSasToken();
                //    return Ok(Json($"{{\"uri\":\"{item.Uri.AbsoluteUri}{sas}\"}}"));
                //}

                await foreach (BlobItem item in blobContainerClient.GetBlobsAsync())
                {
                    
                    var split = item.Name.Split("/");

                    if (split.Length > 1)
                    {
                        if (split[0] == deviceId)
                        {
                            var fileName = split[split.Length - 1];
                            var fileNameSplit = fileName.Split(".");

                            if (fileNameSplit.Length == 2)
                            {
                                if (fileNameSplit[0] == timeStamp)
                                {
                                    string sas = GetSasToken();
                                    var test = $"{{\"uri\":\"{blobContainerClient.Uri.AbsoluteUri}/{item.Name}{sas}\"}}";
                                    return Ok(Json($"{{\"uri\":\"{blobContainerClient.Uri.AbsoluteUri}/{item.Name}{sas}\"}}"));
                                }
                            }
                        }
                    }
                    //return Ok(Json($"{{\"uri\":\"{item.Uri.AbsoluteUri}{sas}\"}}"));
                }

                return NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in {System.Reflection.MethodBase.GetCurrentMethod().Name}() {ex.Message}");
                return BadRequest(ex.Message);
            }
        }
        public class BLOB_IMAGE_DATA
        {
            public string Image { get; set; }
            public string DeviceId { get; set; }
            public string FileName { get; set; }
            public string CreateDate { get; set; }
        }
        #endregion // blob
    }
}