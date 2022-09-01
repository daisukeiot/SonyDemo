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
using Azure.Storage.Blobs.Specialized;
using Microsoft.AspNetCore.Authorization;

namespace SonyIMX500.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private static string _token = string.Empty;
        private readonly AppSettings _appSettings;
        const string blobContainerName = "iothub-link";
        static BlobContainerClient blobContainerClient;
        static string userSasToken = string.Empty;
        static private string _clientId = string.Empty;
        static private string _name = string.Empty;
        static private string _preferredName = string.Empty;
        static private string _tokenExpiration = string.Empty;

        public HomeController(IOptions<AppSettings> optionsAccessor, ILogger<HomeController> logger)
        {
            _appSettings = optionsAccessor.Value;
            _logger = logger;
            BlobServiceClient blobServiceClient = new BlobServiceClient(_appSettings.Blob.ConnectionString);
            blobContainerClient = blobServiceClient.GetBlobContainerClient(blobContainerName);
            
        }

        [Authorize]
        public IActionResult LoginAAD()
        {
            return View();
        }

        //public IActionResult Spa()
        //{
        //    return File("~/index.html", "text/html");
        //}

        [Authorize]
        public IActionResult Index()
        {
            if (string.IsNullOrEmpty(_clientId))
            {
                _clientId = _appSettings.SonyApi.ClientId;
            }

            ViewData["Token"] = _token;
            ViewData["ClientId"] = _clientId;
            ViewData["Name"] = _name;
            ViewData["PreferredName"] = _preferredName;
            ViewData["TokenExpiration"] = _tokenExpiration;

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

        [HttpGet]
        public ActionResult GetClientId()
        {
            try
            {
                if (!string.IsNullOrEmpty(_appSettings.SonyApi.ClientId))
                {
                    return Ok(_clientId);

                }
                else
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, "Client ID not set");
                }
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

        [HttpPost]
        public ActionResult SetClientId(string clientId)
        {
            try
            {
                _clientId = clientId;
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


        [HttpPost]
        public ActionResult SetLoginData(string idToken, string clientId, string idTokenJson)
        {
            try
            {

                var idTokenObj = JObject.Parse(idTokenJson);

                if (idTokenObj.ContainsKey("rawIdToken"))
                {
                    _token = (string)idTokenObj["rawIdToken"];
                    ViewData["Token"] = _token;
                }

                if (idTokenObj.ContainsKey("name"))
                {
                    _name = (string)idTokenObj["name"];
                    ViewData["Name"] = _name;
                }

                if (idTokenObj.ContainsKey("preferredName"))
                {
                    _preferredName = (string)idTokenObj["preferredName"];
                    ViewData["PreferredName"] = _preferredName;
                }

                if (idTokenObj.ContainsKey("expiration"))
                {
                    _tokenExpiration = (string)idTokenObj["expiration"];
                    ViewData["TokenExpiration"] = _tokenExpiration;
                }

                _clientId = clientId;
                ViewData["Token"] = idToken;
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
                BlobServiceClient blobServiceClient = new BlobServiceClient(_appSettings.Blob.ConnectionString);
                BlobContainerClient blobContainerClient = blobServiceClient.GetBlobContainerClient("iothub-link");
                BlobContainerClient container = new BlobContainerClient(_appSettings.Blob.ConnectionString, "iothub-link");
                var block = container.GetBlockBlobClient(timeStamp);

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
                                    return Ok(Json($"{{\"uri\":\"{blobContainerClient.Uri.AbsoluteUri}/{item.Name}{sas}\"}}"));
                                }
                            }
                        }
                    }
                }

                return StatusCode(StatusCodes.Status404NotFound, Json($"{{\"Status\":\"Image File ({timeStamp}) Not Found in Blob Storage\"}}"));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in {System.Reflection.MethodBase.GetCurrentMethod().Name}() {ex.Message}");
                return BadRequest(ex.Message);
            }
        }

        [HttpGet]
        public async Task<ActionResult> CheckImage(string deviceId, string imagePath)
        {
            int retry = 3;

            try
            {
                while (retry > 0)
                {
                    //BlobServiceClient blobServiceClient = new BlobServiceClient(_appSettings.Blob.ConnectionString);
                    //BlobContainerClient blobContainerClient = blobServiceClient.GetBlobContainerClient("iothub-link");
                    BlobContainerClient container = new BlobContainerClient(_appSettings.Blob.ConnectionString, "iothub-link");
                    var block = container.GetBlockBlobClient(imagePath);

                    bool bExist = await block.ExistsAsync();

                    if (bExist == true)
                    {
                        string sas = GetSasToken();
                        return Ok(Json($"{{\"uri\":\"{block.Uri.AbsoluteUri}{sas}\"}}"));
                    }
                    else
                    {
                        System.Threading.Thread.Sleep(5000);
                        retry--;

                    }
                }
                return StatusCode(StatusCodes.Status404NotFound, Json($"{{\"Status\":\"Image File ({imagePath}) Not Found in Blob Storage\"}}"));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in {System.Reflection.MethodBase.GetCurrentMethod().Name}() {ex.Message}");
                return BadRequest(ex.Message);
            }
        }

        [HttpGet]
        public async Task<ActionResult> GetImagesFromBlob(string deviceId, string imagePath)
        {
            try
            {
                BlobServiceClient blobServiceClient = new BlobServiceClient(_appSettings.Blob.ConnectionString);
                BlobContainerClient blobContainerClient = blobServiceClient.GetBlobContainerClient("iothub-link");

                await foreach (BlobItem item in blobContainerClient.GetBlobsAsync())
                {
                    if (item.Name.IndexOf(imagePath) < 0)
                    {
                        continue;
                    }

                    string sas = GetSasToken();
                    return Ok(Json($"{{\"uri\":\"{blobContainerClient.Uri.AbsoluteUri}/{item.Name}{sas}\"}}"));
                }

                return StatusCode(StatusCodes.Status404NotFound, Json($"{{\"Status\":\"Image File ({imagePath}) Not Found in Blob Storage\"}}"));
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

        public class LOGIN_DATA
        {
            public string rawIdTOken { get; set; }
            public string preferredName { get; set; }
            public string name { get; set; }
            public string expiration { get; set; }
        }

    }
}