using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.CognitiveServices.Vision.CustomVision.Training;
using Microsoft.Azure.CognitiveServices.Vision.CustomVision.Training.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using SonyIMX500.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace SonyIMX500.Controllers
{
    public class CustomVision : Controller
    {
        private readonly ILogger<CustomVision> _logger;
        private readonly AppSettings _appSettings;
        private static CustomVisionTrainingClient _customVisionTrainingClient = null;

        public IActionResult Index()
        {
            TraininImages model = new TraininImages();
            return View(model);
        }

        public CustomVision(IOptions<AppSettings> optionsAccessor, ILogger<CustomVision> logger)
        {
            _appSettings = optionsAccessor.Value;
            _logger = logger;
            if (_customVisionTrainingClient == null)
            {
                var credentials = new ApiKeyServiceClientCredentials(_appSettings.CustomVision.AccessKey);
                _customVisionTrainingClient = new CustomVisionTrainingClient(credentials)
                {
                    Endpoint = _appSettings.CustomVision.Endpoint
                };
            }
        }

        private void AddRequestHeader(HttpClient client)
        {
            client.DefaultRequestHeaders.Add("Training-Key", _appSettings.CustomVision.AccessKey);
        }

        private async Task<HttpResponseMessage> SendGet(string requestSegment)
        {
            using (HttpClient client = new HttpClient())
            {
                Uri baseUri = new Uri(_appSettings.CustomVision.Endpoint);
                Uri requestUri = new Uri($"{baseUri.AbsoluteUri}/{requestSegment}");

                AddRequestHeader(client);

                return await client.GetAsync(requestUri.AbsoluteUri);
            }
        }
        private async Task<HttpResponseMessage> SendDelete(string requestSegment)
        {
            using (HttpClient client = new HttpClient())
            {
                Uri baseUri = new Uri(_appSettings.CustomVision.Endpoint);
                Uri requestUri = new Uri($"{baseUri.AbsoluteUri}/{requestSegment}");

                AddRequestHeader(client);

                return await client.DeleteAsync(requestUri.AbsoluteUri);
            }
        }

        private async Task<HttpResponseMessage> SendPost(string requestSegment, HttpContent reqBody)
        {
            using (HttpClient client = new HttpClient())
            {
                Uri baseUri = new Uri(_appSettings.CustomVision.Endpoint);
                Uri requestUri = new Uri($"{baseUri.AbsoluteUri}/{requestSegment}");

                AddRequestHeader(client);

                return await client.PostAsync(requestUri.AbsoluteUri, reqBody);
            }
        }

        [Route("UploadImagesAsync")]
        [HttpPost]
        public async Task<ActionResult> UploadImagesAsync(string projectId, IFormFile[] images)
        {
            if (images == null || images.Length == 0)
            {
                return BadRequest(Json(new { status = "File(s) not selected" }));
            }

            var filePaths = new List<string>();
            var trainingImages = new List<ImageFileCreateEntry>();

            foreach (var formFile in images)
            {
                var imageFileCreateEntry = new ImageFileCreateEntry
                {

                    Name = formFile.FileName,
                };

                using (BinaryReader reader = new BinaryReader(formFile.OpenReadStream()))
                {
                    imageFileCreateEntry.Contents = reader.ReadBytes((int)formFile.OpenReadStream().Length);
                };

                trainingImages.Add(imageFileCreateEntry);

                //using (var reader = new StreamReader(formFile.OpenReadStream()))
                //{
                //    imageFileCreateEntry.Contents = await reader.ReadToEndAsync();
                //};
            }

            if (trainingImages.Count > 0)
            {
                var batch = new ImageFileCreateBatch
                {
                    Images = trainingImages
                };
                await _customVisionTrainingClient.CreateImagesFromFilesAsync(Guid.Parse(projectId), batch);
            }

            return Ok(Json(new { status = "ok" }));
        }

        #region CUSTOMVISIONGET

        //
        // https://docs.microsoft.com/en-us/dotnet/api/microsoft.azure.cognitiveservices.vision.customvision.training.customvisiontrainingclientextensions.getimagesasync?view=azure-dotnet
        //
        [HttpGet]
        public async Task<IActionResult> GetImages(string projectId)
        {
            var responses = new List<CV_IMAGE_DATA>();

            var images = await _customVisionTrainingClient.GetImagesAsync(Guid.Parse(projectId));

            foreach (var image in images)
            {
                var response = new CV_IMAGE_DATA()
                {
                    Id = image.Id.ToString(),
                    Uri = image.OriginalImageUri,
                    ResizedImageUri = image.ResizedImageUri,
                    ThumbnailUri = image.ThumbnailUri,
                    Width = image.Width,
                    Height = image.Height,
                    Regions = new List<CV_REGION_DATA>(),
                    Proposals = new List<CV_REGION_DATA>()
                };

                if (image.Tags != null)
                {
                    foreach(var tag in image.Tags)
                    {
                        response.Tags += tag.TagName;
                    }
                }

                if (image.Regions != null)
                {
                    foreach (var region in image.Regions)
                    {
                        var regionData = new CV_REGION_DATA();
                        regionData.X = region.Left;
                        regionData.Y = region.Top;
                        regionData.W = region.Width;
                        regionData.H = region.Height;

                        response.Regions.Add(regionData);
                    }
                }

                //
                // https://docs.microsoft.com/en-us/dotnet/api/microsoft.azure.cognitiveservices.vision.customvision.training.customvisiontrainingclientextensions.getimageregionproposalsasync?view=azure-dotnet
                //
                var imageRegionProposal = await _customVisionTrainingClient.GetImageRegionProposalsAsync(Guid.Parse(projectId), image.Id);

                if (imageRegionProposal != null)
                {
                    foreach (var proposal in imageRegionProposal.Proposals)
                    {
                        if (proposal.Confidence > 0.9)
                        {
                            var regionData = new CV_REGION_DATA();
                            regionData.X = proposal.BoundingBox.Left;
                            regionData.Y = proposal.BoundingBox.Top;
                            regionData.W = proposal.BoundingBox.Width;
                            regionData.H = proposal.BoundingBox.Height;

                            response.Proposals.Add(regionData);
                        }
                    }
                }

                responses.Add(response);
            }

            return Ok(Json(JsonConvert.SerializeObject(responses)));
        }
        //
        // https://docs.microsoft.com/en-us/rest/api/customvision/training3.3/get-projects/get-projects
        //
        [HttpGet]
        public async Task<IActionResult> GetProjects(string model_id)
        {
            try
            {
                var response = await SendGet($"customvision/v3.3/training/projects");
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

        [HttpGet]
        public async Task<IActionResult> GetTags(string projectId)
        {
            try
            {
                var response = await SendGet($"customvision/v3.3/training/projects/{projectId}/tags");
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

        #region CUSTOMVISIONDELETE
        //
        // https://docs.microsoft.com/en-us/rest/api/customvision/training3.3/delete-project/delete-project
        //
        [HttpDelete]
        public async Task<ActionResult> DeleteProjectCv(string project_name)
        {
            try
            {
                var response = await SendDelete($"customvision/v3.3/training/projects/{project_name}");

                if (response.IsSuccessStatusCode)
                {
                    return StatusCode(StatusCodes.Status204NoContent);
                }
                else
                {
                    var jsonString = await response.Content.ReadAsStringAsync();
                    return StatusCode((int)response.StatusCode, Json(jsonString));
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

        #region CUSTOMVISIONPOST
        //
        // https://docs.microsoft.com/en-us/rest/api/customvision/training3.3/train-project/train-project
        //
        [HttpPost]
        public async Task<IActionResult> TrainProject(string projectId)
        {
            try
            {
                var response = await SendPost($"customvision/v3.3/training/projects/{projectId}/train", null);
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

        //
        // https://docs.microsoft.com/en-us/rest/api/customvision/training3.3/create-tag/create-tag
        //
        [HttpPost]
        public async Task<IActionResult> CreateTag(string projectId, string tagName, string desc)
        {
            try
            {
                string urlSegment = $"customvision/v3.3/training/projects/{projectId}/tags?name={tagName}";

                if (!string.IsNullOrEmpty(desc))
                {
                    urlSegment += $"&description={desc}";
                }

                var response = await SendPost(urlSegment, null);
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

        public class ReponseModel
        {
            public string Message { get; set; }
            public bool IsSuccess { get; set; }
            public bool IsResponse { get; set; }
        }

        public class MultipleFilesModel : ReponseModel
        {
            [Required(ErrorMessage = "Please select files")]
            public List<IFormFile> Files { get; set; }
        }

        public class CV_REGION_DATA
        {
            public double X { get; set; }
            public double Y { get; set; }
            public double W { get; set; }
            public double H { get; set; }
        }

        public class CV_IMAGE_DATA
        {
            public string Uri { get; set; }
            public string Id { get; set; }
            public string ThumbnailUri { get; set; }
            public string ResizedImageUri { get; set; }
            public int Height { get; set; }
            public int Width { get; set; }
            public string Tags { get; set; }
            public List<CV_REGION_DATA> Regions { get; set; }
            public List<CV_REGION_DATA> Proposals { get; set; }
        }
    }
}
