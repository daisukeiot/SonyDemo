using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using SonyIMX500.Models;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace SonyIMX500.Controllers
{
    public class SonyController : Controller
    {
        private readonly ILogger<SonyController> _logger;
        private static string _token = "test";
        private readonly AppSettings _appSettings;

        public IActionResult Index()
        {
            return View();
        }

        public SonyController(IOptions<AppSettings> optionsAccessor, ILogger<SonyController> logger)
        {
            _appSettings = optionsAccessor.Value;
            _logger = logger;
        }

        private void AddRequestHeader(HttpClient client)
        {
            Uri baseUri = new Uri(_appSettings.SonyApi.BaseUrl);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _token);
            client.DefaultRequestHeaders.Add("X-AppGw-Validation", _appSettings.SonyApi.AppGwValidation);
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            client.DefaultRequestHeaders.Host = baseUri.Host;
        }

        public async Task<HttpResponseMessage> SendGet(string requestSegment)
        {
            using (HttpClient client = new HttpClient())
            {
                Uri baseUri = new Uri(_appSettings.SonyApi.BaseUrl);
                Uri requestUri = new Uri($"{baseUri.AbsoluteUri}/{requestSegment}");

                AddRequestHeader(client);

                return await client.GetAsync(requestUri.AbsoluteUri);
            }
        }
        public async Task<HttpResponseMessage> SendPost(string requestSegment)
        {
            using (HttpClient client = new HttpClient())
            {
                Uri baseUri = new Uri(_appSettings.SonyApi.BaseUrl);
                Uri requestUri = new Uri($"{baseUri.AbsoluteUri}/{requestSegment}");

                AddRequestHeader(client);

                return await client.PostAsync(requestUri.AbsoluteUri, null);
            }
        }

        [HttpPost]
        public bool PostToken(string token)
        {
            ViewData["Token"] = token;
            _token = token;
            return true;
        }

        #region SONYAPIGET
        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-model-of-base?
        //
        [HttpGet]
        public async Task<ActionResult> GetBaseModelStatus(string model_id)
        {
            try
            {
                var response = await SendGet($"models/{model_id}/base");

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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-deploy-configurations?
        //
        [HttpGet]
        public async Task<ActionResult> GetDeployConfigurations()
        {
            try
            {
                var response = await SendGet("deployconfigurations");

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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-deploy-history?
        //
        [HttpGet]
        public async Task<ActionResult> GetDeployHistory(string device_id)
        {
            try
            {
                var response = await SendGet($"devices/{device_id}/deploy");

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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-device?
        //
        [HttpGet]
        public async Task<ActionResult> GetDevice(string device_id)
        {
            try
            {
                var response = await SendGet($"devices/{device_id}");

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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-model-of-device?
        //
        [HttpGet]
        public async Task<ActionResult> GetDeviceModelStatus(string model_id, string device_id)
        {
            try
            {
                var response = await SendGet($"models/{model_id}/devices/{device_id}");

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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-devices?
        //
        [HttpGet]
        public async Task<ActionResult> GetDevices()
        {
            try
            {
                var response = await SendGet("devices");

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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-firmwares?
        //
        [HttpGet]
        public async Task<ActionResult> GetFirmwares()
        {
            try
            {
                var response = await SendGet("firmwares/?firmware_type=00");

                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                SonyFirmwareResponse firmwareMcu = JsonConvert.DeserializeObject<SonyFirmwareResponse>(jsonString);

                response = await SendGet("firmwares/?firmware_type=01");

                response.EnsureSuccessStatusCode();

                jsonString = await response.Content.ReadAsStringAsync();
                SonyFirmwareResponse firmwareSensor = JsonConvert.DeserializeObject<SonyFirmwareResponse>(jsonString);

                response = await SendGet("firmwares/?firmware_type=02");

                response.EnsureSuccessStatusCode();

                jsonString = await response.Content.ReadAsStringAsync();
                SonyFirmwareResponse firmwareSensorLoader = JsonConvert.DeserializeObject<SonyFirmwareResponse>(jsonString);

                SonyFimwares firmwareData = new SonyFimwares();

                firmwareData.MCUs = firmwareMcu.firmwares;
                firmwareData.Sensors = firmwareSensor.firmwares;
                firmwareData.SensorLoaders = firmwareSensorLoader.firmwares;

                return Ok(Json(JsonConvert.SerializeObject(firmwareData)));

            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in GetDevices() {ex.Message}");
                //return StatusCode(StatusCodes.Status500InternalServerError);
            }
            return BadRequest();
        }

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-metadata-notification?
        //
        [HttpGet]
        public async Task<ActionResult> GetMetadataNotification(string condition_id)
        {
            try
            {
                var response = await SendGet($"metadatanotificationcondns/{condition_id}");

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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-metadata-notifications?
        //
        [HttpGet]
        public async Task<ActionResult> GetMetadataNotifications()
        {
            try
            {
                var response = await SendGet("metadatanotificationcondns");

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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-models?
        //
        [HttpGet]
        public async Task<ActionResult> GetModels(string model_id)
        {
            try
            {
                string urlSegment = "models";

                if (!string.IsNullOrEmpty(model_id))
                {
                    urlSegment += $"?model_id={model_id}";
                }
                var response = await SendGet(urlSegment);

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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-qr-code-for-provisioning?
        //
        [HttpGet]
        public async Task<ActionResult> GetQrCodeForProvisioning()
        {
            try
            {
                var response = await SendGet("provisioning/qrcod");

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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-user?
        //
        [HttpGet]
        public async Task<ActionResult> GetUser(string principal)
        {
            try
            {
                var response = await SendGet($"manage/users/{principal}");

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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-users?
        //
        [HttpGet]
        public async Task<ActionResult> GetUsers()
        {
            try
            {
                var response = await SendGet($"manage/users/");

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

        #region SONYAPIPOST
        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-convert-model?
        //
        [HttpPost]
        public async Task<ActionResult> ConvertModel()
        {
            return Ok();
        }

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-create-custom-vision-project-of-base?
        //
        [HttpPost]
        public async Task<ActionResult> CreateBaseCustomVisionProject(string project_name, string comment)
        {
            try
            {
                string urlSegment = $"model_projects/customvision_base?project_name={project_name}";

                if (!string.IsNullOrEmpty(comment))
                {
                    urlSegment += $"&comment={comment}";
                }

                var response = await SendPost(urlSegment);
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                return Ok(Json(jsonString));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in {System.Reflection.MethodBase.GetCurrentMethod().Name}() {ex.Message}");
            }
            return BadRequest();
        }
#if POST
        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-create-deploy-configuration?
        //
        [HttpPost]
        public ActionResult CreateDeployConfiguration()
        {
            return Ok();
        }

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-create-custom-vision-project-of-device?
        //
        [HttpPost]
        public ActionResult CreateDeviceCustomVisionProject()
        {
            return Ok();
        }

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-create-metadata-notification?
        //
        [HttpPost]
        public ActionResult CreateMetadataNotification()
        {
            return Ok();
        }

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-import-images-from-scblob?
        //
        [HttpPost]
        public async Task<ActionResult> ImportImagesFromScblob(string project_name, string payload)
        {
            try
            {
                Uri url = new Uri(_appSettings.SonyApi.BaseUrl);
                string apiUrl = $"{url.AbsoluteUri}/model_projects/{project_name}/images/customvision_scbloburls";
                var content = new StringContent(payload);
                var response = await SendPost(apiUrl, content);
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                return Ok(Json(jsonString));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in GetDevices() {ex.Message}");
            }
            return BadRequest();
        }

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-publish-model?
        //
        [HttpPost]
        public async Task<ActionResult> PublishModel(string model_id, string device_id)
        {
            try
            {
                Uri url = new Uri(_appSettings.SonyApi.BaseUrl);
                HttpContent content = null;
                string apiUrl = $"{url.AbsoluteUri}/models/{model_id}";

                if (!string.IsNullOrEmpty(device_id))
                {
                    apiUrl += $"?{device_id}";
                }

                var response = await SendPost(apiUrl, content);
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                return Ok(Json(jsonString));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in GetDevices() {ex.Message}");
            }
            return BadRequest();
        }

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-reboot?
        //
        [HttpPost]
        public async Task<ActionResult> RebootDevice(string device_id)
        {
            try
            {
                Uri url = new Uri(_appSettings.SonyApi.BaseUrl);
                HttpContent content = null;
                var apiUrl = $"{url.AbsoluteUri}/models/{device_id}/base";
                var response = await SendPost(apiUrl, content);
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                return Ok(Json(jsonString));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in GetDevices() {ex.Message}");
            }
            return BadRequest();
        }

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-regist-user?
        //
        [HttpPost]
        public async Task<ActionResult> RegistUser(string principal, string belong_group_id)
        {
            try
            {
                Uri url = new Uri(_appSettings.SonyApi.BaseUrl);
                HttpContent content = null;
                var apiUrl = $"{url.AbsoluteUri}/manage/users?principal={principal}&belong_group_id={belong_group_id}";
                var response = await SendPost(apiUrl, content);
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                return Ok(Json(jsonString));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in GetDevices() {ex.Message}");
            }
            return BadRequest();
        }

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-reset?
        //
        [HttpPost]
        public async Task<ActionResult> ResetDevice(string device_id)
        {
            try
            {
                Uri url = new Uri(_appSettings.SonyApi.BaseUrl);
                HttpContent content = null;
                var apiUrl = $"{url.AbsoluteUri}/devices/{device_id}/reset";
                var response = await SendPost(apiUrl, content);
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                return Ok(Json(jsonString));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in GetDevices() {ex.Message}");
            }
            return BadRequest();
        }

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-save-general-model-of-base?
        //
        [HttpPost]
        public async Task<ActionResult> SaveBaseGeneralModel(string payload)
        {
            try
            {
                Uri url = new Uri(_appSettings.SonyApi.BaseUrl);
                var content = new StringContent(payload);
                var apiUrl = $"{url.AbsoluteUri}/model_projects/general_base_save";
                var response = await SendPost(apiUrl, content);
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                return Ok(Json(jsonString));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in GetDevices() {ex.Message}");
            }
            return BadRequest();
        }

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-save-custom-vision-model?
        //
        [HttpPost]
        public async Task<ActionResult> SaveCustomVisionModel(string project_name)
        {
            try
            {
                Uri url = new Uri(_appSettings.SonyApi.BaseUrl);
                StringContent content = null;
                var apiUrl = $"{url.AbsoluteUri}/model_projects/{project_name}/customvision_save";
                var response = await SendPost(apiUrl, content);
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                return Ok(Json(jsonString));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in GetDevices() {ex.Message}");
            }
            return BadRequest();
        }

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-start-upload-inference-result?
        //
        [HttpPost]
        public async Task<ActionResult> StartUploadInferenceResult(string device_id)
        {
            try
            {
                Uri url = new Uri(_appSettings.SonyApi.BaseUrl);
                StringContent content = null;
                var apiUrl = $"{url.AbsoluteUri}/devices/{device_id}/inferenceresults/collectstart";
                var response = await SendPost(apiUrl, content);
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                return Ok(Json(jsonString));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in GetDevices() {ex.Message}");
            }
            return BadRequest();
        }

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-start-upload-retraining-data?
        //
        [HttpPost]
        public async Task<ActionResult> StartUploadRetrainingData(string device_id)
        {
            try
            {
                Uri url = new Uri(_appSettings.SonyApi.BaseUrl);
                StringContent content = null;
                var apiUrl = $"{url.AbsoluteUri}/devices/{device_id}/images/collectstart";
                var response = await SendPost(apiUrl, content);
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                return Ok(Json(jsonString));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in GetDevices() {ex.Message}");
            }
            return BadRequest();
        }

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-stop-upload-inference-result?
        //
        [HttpPost]
        public async Task<ActionResult> StopUploadInferenceResult(string device_id)
        {
            try
            {
                Uri url = new Uri(_appSettings.SonyApi.BaseUrl);
                StringContent content = null;
                var apiUrl = $"{url.AbsoluteUri}/devices/{device_id}/inferenceresults/collectstop";
                var response = await SendPost(apiUrl, content);
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                return Ok(Json(jsonString));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in GetDevices() {ex.Message}");
            }
            return BadRequest();
        }

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-stop-upload-retraining-data?
        //
        [HttpPost]
        public async Task<ActionResult> StopUploadRetrainingData(string device_id)
        {
            try
            {
                Uri url = new Uri(_appSettings.SonyApi.BaseUrl);
                StringContent content = null;
                var apiUrl = $"{url.AbsoluteUri}/devices/{device_id}/images/collectstop";
                var response = await SendPost(apiUrl, content);
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                return Ok(Json(jsonString));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in GetDevices() {ex.Message}");
            }
            return BadRequest();
        }
#endif
#endregion

        public class SonyApiModel
        {
            public string model_version_id { get; set; }
        }

        public class SonyApiDevice
        {
            public string device_id { get; set; }
            public string connectionState { get; set; }
            public string status { get; set; }
            public List<SonyApiModel> models { get; set; }
        }

        public class SonyApiDevices
        {
            public List<SonyApiDevice> devices { get; set; }
        }

        public class SonyFirmwareVersions
        {
            public string version_number { get; set; }
        }

        public class SonyFirmware
        {
            public List<SonyFirmwareVersions> versions { get; set; }
        }

        public class SonyFimwares
        {
            public List<SonyFirmware> MCUs { get; set; }
            public List<SonyFirmware> Sensors { get; set; }
            public List<SonyFirmware> SensorLoaders { get; set; }
        }
        public class SonyFirmwareResponse
        {
            public List<SonyFirmware> firmwares { get; set; }
        }

    }

}

