using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
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

        public IActionResult Index()
        {
            TraininImages model = new TraininImages();
            return View(model);
        }

        public CustomVision(IOptions<AppSettings> optionsAccessor, ILogger<CustomVision> logger)
        {
            _appSettings = optionsAccessor.Value;
            _logger = logger;
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

        [Route("UploadImages")]
        [HttpPost]
        public async Task<IActionResult> UploadImagesAsync(IFormFile[] images)
        {
            if (images == null || images.Length == 0)
            {
                return Content("File(s) not selected");
            }

            var filePaths = new List<string>();

            foreach (var formFile in images)
            {
                using (var reader = new StreamReader(formFile.OpenReadStream()))
                {
                    var fileContent = await reader.ReadToEndAsync();
                }
            }


            return View("Success");
        }

        #region CUSTOMVISIONGET
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
    }
}
