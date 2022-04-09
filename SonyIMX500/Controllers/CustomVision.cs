using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SonyIMX500.Models;
using System;
using System.Net.Http;
using System.Threading.Tasks;

namespace SonyIMX500.Controllers
{
    public class CustomVision : Controller
    {
        private readonly ILogger<CustomVision> _logger;
        private static string _token = "test";
        private readonly AppSettings _appSettings;

        public IActionResult Index()
        {
            return View();
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

                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                return Ok(Json(jsonString));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in GetDevices() {ex.Message}");
                //return StatusCode(StatusCodes.Status500InternalServerError);
            }
            return BadRequest();
        }
        #endregion


        #region CUSTOMVISIONDELETE
        //
        // https://docs.microsoft.com/en-us/rest/api/customvision/training3.3/delete-project/delete-project
        //
        [HttpDelete]
        public async Task<ActionResult> DeleteProject(string project_name)
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
                _logger.LogError($"Excetion in GetDevices() {ex.Message}");
                //return StatusCode(StatusCodes.Status500InternalServerError);
            }
            return BadRequest();
        }
        #endregion
    }
}
