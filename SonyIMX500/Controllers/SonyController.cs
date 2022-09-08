using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SonyIMX500.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace SonyIMX500.Controllers
{
    [Authorize]
    public class SonyController : Controller
    {
        private readonly ILogger<SonyController> _logger;
        private static string _token = string.Empty;
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

        private async Task<HttpResponseMessage> SendGet(string requestSegment)
        {
            if (string.IsNullOrEmpty(_token))
            {
                throw new ArgumentException("{\"status\":\"Need Token\"}");
            }
            using (HttpClient client = new HttpClient())
            {
                Uri baseUri = new Uri(_appSettings.SonyApi.BaseUrl);
                Uri requestUri = new Uri($"{baseUri.AbsoluteUri}/{requestSegment}");

                AddRequestHeader(client);

                return await client.GetAsync(requestUri.AbsoluteUri);
            }
        }
        private async Task<HttpResponseMessage> SendPost(string requestSegment)
        {
            if (string.IsNullOrEmpty(_token))
            {
                throw new ArgumentException(@"{'status':'Need Token'}");
            }
            using (HttpClient client = new HttpClient())
            {
                Uri baseUri = new Uri(_appSettings.SonyApi.BaseUrl);
                Uri requestUri = new Uri($"{baseUri.AbsoluteUri}/{requestSegment}");

                AddRequestHeader(client);

                return await client.PostAsync(requestUri.AbsoluteUri, null);
            }
        }

        private async Task<HttpResponseMessage> SendDelete(string requestSegment)
        {
            if (string.IsNullOrEmpty(_token))
            {
                throw new ArgumentException(@"{'status':'Need Token'}");
            }
            using (HttpClient client = new HttpClient())
            {
                Uri baseUri = new Uri(_appSettings.SonyApi.BaseUrl);
                Uri requestUri = new Uri($"{baseUri.AbsoluteUri}/{requestSegment}");

                AddRequestHeader(client);

                return await client.DeleteAsync(requestUri.AbsoluteUri);
            }
        }

        private async Task<HttpResponseMessage> SendPut(string requestSegment)
        {
            if (string.IsNullOrEmpty(_token))
            {
                throw new ArgumentException(@"{'status':'Need Token'}");
            }
            using (HttpClient client = new HttpClient())
            {
                Uri baseUri = new Uri(_appSettings.SonyApi.BaseUrl);
                Uri requestUri = new Uri($"{baseUri.AbsoluteUri}/{requestSegment}");

                AddRequestHeader(client);

                return await client.PutAsync(requestUri.AbsoluteUri, null);
            }
        }

        [HttpPost]
        public bool PostToken(string token)
        {
            if (token != null)
            {
                _token = token;
                return true;
            }

            return false;
        }

        #region SONYAPIGET
        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-model-of-base?
        //
        [HttpGet]
        public async Task<ActionResult> GetBaseModelStatus(string model_id, string latest_type)
        {
            try
            {
                var response = await SendGet($"models/{model_id}/base");
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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-deploy-configurations?
        //
        [HttpGet]
        public async Task<ActionResult> GetDeployConfigurations()
        {
            try
            {
                var response = await SendGet($"deployconfigurations");
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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-deploy-history?
        //
        [HttpGet]
        public async Task<ActionResult> GetDeployHistory(string device_id)
        {
            try
            {
                if (device_id == null)
                {
                    return StatusCode(StatusCodes.Status400BadRequest, @"{'status':'Specify device_id'}");
                }
                var response = await SendGet($"devices/{device_id}/deploys");
                var jsonString = await response.Content.ReadAsStringAsync();
                var jsonObj = JObject.Parse(jsonString);

                if (response.IsSuccessStatusCode)
                {
                    return Ok(Json(jsonObj["deploys"].ToString()));
                }
                else
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, Json(jsonString));
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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-device?
        //
        [HttpGet]
        public async Task<ActionResult> GetDevice(string device_id)
        {
            try
            {
                var response = await SendGet($"devices/{device_id}");
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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-model-of-device?
        //
        [HttpGet]
        public async Task<ActionResult> GetDeviceModelStatus(string model_id, string latest_type)
        {
            try
            {
                string urlSegment = $"models/{model_id}/base";

                if (!string.IsNullOrEmpty(latest_type))
                {
                    urlSegment += $"?latest_type={latest_type}";
                }

                var response = await SendGet(urlSegment);

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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-devices?
        //
        [HttpGet]
        public async Task<ActionResult> GetDevices()
        {
            try
            {
                var response = await SendGet("devices");
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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-firmwares?
        //
        [HttpGet]
        public async Task<ActionResult> GetFirmwares(string firmware_type, string ppl)
        {
            try
            {
                string urlSegment = $"firmwares?firmware_type={firmware_type}";
                List<string> options = new List<string>();

                if (!string.IsNullOrEmpty(ppl))
                {
                    urlSegment += $"?ppl={ppl}";
                }

                var response = await SendGet(urlSegment);

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
        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-firmwares?
        //
        [HttpGet]
        public async Task<ActionResult> GetAllFirmwares(string firmware_type, string ppl)
        {
            try
            {
                var response = await SendGet("firmwares/?firmware_type=00");
                var jsonString = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, Json(jsonString));
                }

                SonyFirmwareResponse firmwareMcu = JsonConvert.DeserializeObject<SonyFirmwareResponse>(jsonString);

                response = await SendGet("firmwares/?firmware_type=01");
                jsonString = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, Json(jsonString));
                }

                jsonString = await response.Content.ReadAsStringAsync();
                SonyFirmwareResponse firmwareSensor = JsonConvert.DeserializeObject<SonyFirmwareResponse>(jsonString);

                response = await SendGet("firmwares/?firmware_type=02");
                jsonString = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, Json(jsonString));
                }

                SonyFirmwareResponse firmwareSensorLoader = JsonConvert.DeserializeObject<SonyFirmwareResponse>(jsonString);

                SonyFimwares firmwareData = new SonyFimwares();

                firmwareData.MCUs = firmwareMcu.firmwares;
                firmwareData.Sensors = firmwareSensor.firmwares;
                firmwareData.SensorLoaders = firmwareSensorLoader.firmwares;

                return Ok(Json(JsonConvert.SerializeObject(firmwareData)));

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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-metadata-notification?
        //
        [HttpGet]
        public async Task<ActionResult> GetMetadataNotification(string condition_id)
        {
            try
            {
                var response = await SendGet($"metadatanotificationcondns/{condition_id}");
                var jsonString = await response.Content.ReadAsStringAsync();
                return Ok(Json(jsonString));
            }
            catch (ArgumentException ex)
            {
                return StatusCode(StatusCodes.Status400BadRequest, Json(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in {System.Reflection.MethodBase.GetCurrentMethod().Name}() {ex.Message}");
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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-models?
        //
        [HttpGet]
        public async Task<ActionResult> GetModels(string model_id,
                                                  string comment,
                                                  string project_name,
                                                  string model_platform,
                                                  string project_type,
                                                  string device_id,
                                                  string latest_type)
        {
            try
            {
                string urlSegment = "models";
                List<string> options = new List<string>();

                if (!string.IsNullOrEmpty(model_id))
                {
                    options.Add($"model_id={model_id}");
                }

                if (!string.IsNullOrEmpty(comment))
                {
                    options.Add($"comment={comment}");
                }

                if (!string.IsNullOrEmpty(project_name))
                {
                    options.Add($"project_name={project_name}");
                }

                if (!string.IsNullOrEmpty(model_platform))
                {
                    options.Add($"model_platform={model_platform}");
                }

                if (!string.IsNullOrEmpty(project_type))
                {
                    options.Add($"project_type={project_type}");
                }

                if (!string.IsNullOrEmpty(device_id))
                {
                    options.Add($"device_id={device_id}");
                }

                if (!string.IsNullOrEmpty(latest_type))
                {
                    options.Add($"latest_type={latest_type}");
                }

                if (options.Count > 0)
                {
                    for (int index = 0; index < options.Count; index++)
                    {
                        if (index == 0)
                        {
                            urlSegment += $"?{options[index]}";
                        }
                        else
                        {
                            urlSegment += $"&{options[index]}";
                        }
                    }
                }

                var response = await SendGet(urlSegment);

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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-qr-code-for-provisioning?
        //
        [HttpGet]
        public async Task<ActionResult> GetQrCodeForProvisioning()
        {
            try
            {
                var response = await SendGet("provisioning/qrcod");
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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-user?
        //
        [HttpGet]
        public async Task<ActionResult> GetUser(string principal)
        {
            try
            {
                var response = await SendGet($"manage/users/{principal}");
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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/get-get-users?
        //
        [HttpGet]
        public async Task<ActionResult> GetUsers()
        {
            try
            {
                var response = await SendGet($"manage/users/");
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

        #endregion

        #region SONYAPIPOST
        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-convert-model?
        //
        [HttpPost]
        public async Task<ActionResult> ConvertModel(string model_id, string device_id)
        {
            try
            {
                string urlSegment = $"models/{model_id}/convert";

                if (!string.IsNullOrEmpty(device_id))
                {
                    urlSegment += $"?device_id={device_id}";
                }

                var response = await SendPost(urlSegment);

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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-create-deploy-configuration?
        //
        [HttpPost]
        public async Task<ActionResult> CreateDeployConfiguration(string config_id,
                                                      string sensor_loader_version_number,
                                                      string sensor_version_number,
                                                      string model_id,
                                                      string ap_fw_version_number,
                                                      string comment,
                                                      string device_type,
                                                      string model_version_number,
                                                      string color_matrix_mode,
                                                      string color_matrix_file_name,
                                                      string gamma_mode,
                                                      string gamma_file_name,
                                                      string lsc_mode,
                                                      string lsc_file_name,
                                                      string prewb_mode,
                                                      string prewb_file_name,
                                                      string dewarp_mode,
                                                      string dewarp_file_name)
        {
            {
                try
                {
                    string urlSegment = $"deployconfigurations?config_id={config_id}&sensor_loader_version_number={sensor_loader_version_number}&sensor_version_number={sensor_version_number}&model_id={model_id}&ap_fw_version_number={ap_fw_version_number}";
                    List<string> options = new List<string>();

                    if (!string.IsNullOrEmpty(comment))
                    {
                        options.Add($"comment={comment}");
                    }

                    if (!string.IsNullOrEmpty(device_type))
                    {
                        options.Add($"device_type={device_type}");
                    }

                    if (!string.IsNullOrEmpty(model_version_number))
                    {
                        options.Add($"model_version_number={model_version_number}");
                    }

                    if (!string.IsNullOrEmpty(color_matrix_mode))
                    {
                        options.Add($"color_matrix_mode={color_matrix_mode}");
                    }

                    if (!string.IsNullOrEmpty(color_matrix_file_name))
                    {
                        options.Add($"color_matrix_file_name={color_matrix_file_name}");
                    }

                    if (!string.IsNullOrEmpty(gamma_mode))
                    {
                        options.Add($"gamma_mode={gamma_mode}");
                    }

                    if (!string.IsNullOrEmpty(gamma_file_name))
                    {
                        options.Add($"gamma_file_name={gamma_file_name}");
                    }

                    if (!string.IsNullOrEmpty(lsc_mode))
                    {
                        options.Add($"lsc_mode={lsc_mode}");
                    }

                    if (!string.IsNullOrEmpty(lsc_file_name))
                    {
                        options.Add($"lsc_file_name={lsc_file_name}");
                    }

                    if (!string.IsNullOrEmpty(prewb_mode))
                    {
                        options.Add($"prewb_mode={prewb_mode}");
                    }

                    if (!string.IsNullOrEmpty(prewb_file_name))
                    {
                        options.Add($"prewb_file_name={prewb_file_name}");
                    }

                    if (!string.IsNullOrEmpty(dewarp_mode))
                    {
                        options.Add($"dewarp_mode={dewarp_mode}");
                    }

                    if (!string.IsNullOrEmpty(dewarp_file_name))
                    {
                        options.Add($"dewarp_file_name={dewarp_file_name}");
                    }

                    if (options.Count > 0)
                    {
                        for (int index = 0; index < options.Count; index++)
                        {
                            urlSegment += $"&{options[index]}";
                        }
                    }

                    var response = await SendPost(urlSegment);
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
#if POST
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
                
                var jsonString = await response.Content.ReadAsStringAsync();
                return Ok(Json(jsonString));
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
#endif


        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-publish-model?
        //
        [HttpPost]
        public async Task<ActionResult> PublishModel(string model_id, string device_id)
        {
            try
            {
                string urlSegment = $"models/{model_id}";

                if (!string.IsNullOrEmpty(device_id))
                {
                    urlSegment += $"?device_id={device_id}";
                }

                var response = await SendPost(urlSegment);

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

#if POST
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
#endif
        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-save-custom-vision-model?
        //
        [HttpPost]
        public async Task<ActionResult> SaveCustomVisionModel(string project_name,
                                                              string model_id,
                                                              string initial_version_number,
                                                              string functionality,
                                                              string vendor_name,
                                                              string comment)
        {
            try
            {

                if (string.IsNullOrEmpty(project_name))
                {
                    return StatusCode(StatusCodes.Status400BadRequest, Json(@"{'status':'Need Token'}"));
                }
                string urlSegment = $"model_projects/{project_name}/customvision_save";
                List<string> options = new List<string>();

                if (!string.IsNullOrEmpty(model_id))
                {
                    options.Add($"model_id={model_id}");
                }

                if (!string.IsNullOrEmpty(initial_version_number))
                {
                    options.Add($"initial_version_number={initial_version_number}");
                }

                if (!string.IsNullOrEmpty(functionality))
                {
                    options.Add($"functionality={functionality}");
                }

                if (!string.IsNullOrEmpty(vendor_name))
                {
                    options.Add($"vendor_name={vendor_name}");
                }

                if (!string.IsNullOrEmpty(comment))
                {
                    options.Add($"comment={comment}");
                }

                if (options.Count > 0)
                {
                    for (int index = 0; index < options.Count; index++)
                    {
                        if (index == 0)
                        {
                            urlSegment += $"?{options[index]}";
                        }
                        else
                        {
                            urlSegment += $"&{options[index]}";
                        }
                    }
                }

                var response = await SendPost(urlSegment);
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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-start-upload-inference-result?
        //
        [HttpPost]
        public async Task<ActionResult> StartUploadInferenceResult(string device_id,
                                                                   string FrequencyOfInferences,
                                                                   string MaxDetectionsPerFrame,
                                                                   string CropHOffset,
                                                                   string CropVOffset,
                                                                   string CropHSize,
                                                                   string CropVSize,
                                                                   string NumberOfInferencesPerMessage,
                                                                   string model_id)
        {
            try
            {
                string urlSegment = $"devices/{device_id}/inferenceresults/collectstart";
                List<string> options = new List<string>();

                if (!string.IsNullOrEmpty(FrequencyOfInferences))
                {
                    options.Add($"FrequencyOfInferences={FrequencyOfInferences}");
                }

                if (!string.IsNullOrEmpty(MaxDetectionsPerFrame))
                {
                    options.Add($"MaxDetectionsPerFrame={MaxDetectionsPerFrame}");
                }

                if (!string.IsNullOrEmpty(CropHOffset))
                {
                    options.Add($"CropHOffset={CropHOffset}");
                }

                if (!string.IsNullOrEmpty(CropVOffset))
                {
                    options.Add($"CropVOffset={CropVOffset}");
                }

                if (!string.IsNullOrEmpty(CropHSize))
                {
                    options.Add($"CropHSize={CropHSize}");
                }

                if (!string.IsNullOrEmpty(CropVSize))
                {
                    options.Add($"CropVSize={CropVSize}");
                }

                if (!string.IsNullOrEmpty(NumberOfInferencesPerMessage))
                {
                    options.Add($"NumberOfInferencesPerMessage={NumberOfInferencesPerMessage}");
                }

                if (!string.IsNullOrEmpty(model_id))
                {
                    options.Add($"model_id={model_id}");
                }

                if (options.Count > 0)
                {
                    for (int index = 0; index < options.Count; index++)
                    {
                        if (index == 0)
                        {
                            urlSegment += $"?{options[index]}";
                        }
                        else
                        {
                            urlSegment += $"&{options[index]}";
                        }
                    }
                }

                var response = await SendPost(urlSegment);
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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-start-upload-retraining-data?
        //
        [HttpPost]
        public async Task<ActionResult> StartUploadRetrainingData(string device_id,
                                                                  string Mode,
                                                                  string FileFormat,
                                                                  string CropHOffset,
                                                                  string CropVOffset,
                                                                  string CropHSize,
                                                                  string CropVSize,
                                                                  string NumberOfImages,
                                                                  string FrequencyOfImages,
                                                                  string MaxDetectionsPerFrame,
                                                                  string NumberOfInferencesPerMessage,
                                                                  string model_id)
        {
            try
            {
                string urlSegment = $"devices/{device_id}/images/collectstart";
                List<string> options = new List<string>();

                if (!string.IsNullOrEmpty(Mode))
                {
                    options.Add($"Mode={Mode}");
                }

                if (!string.IsNullOrEmpty(FileFormat))
                {
                    options.Add($"FileFormat={FileFormat}");
                }


                if (!string.IsNullOrEmpty(CropHOffset))
                {
                    options.Add($"CropHOffset={CropHOffset}");
                }

                if (!string.IsNullOrEmpty(CropVOffset))
                {
                    options.Add($"CropVOffset={CropVOffset}");
                }

                if (!string.IsNullOrEmpty(CropHSize))
                {
                    options.Add($"CropHSize={CropHSize}");
                }

                if (!string.IsNullOrEmpty(CropVSize))
                {
                    options.Add($"CropVSize={CropVSize}");
                }

                if (!string.IsNullOrEmpty(NumberOfImages))
                {
                    options.Add($"NumberOfImages={NumberOfImages}");
                }

                if (!string.IsNullOrEmpty(FrequencyOfImages))
                {
                    options.Add($"FrequencyOfImages={FrequencyOfImages}");
                }

                if (!string.IsNullOrEmpty(MaxDetectionsPerFrame))
                {
                    options.Add($"MaxDetectionsPerFrame={MaxDetectionsPerFrame}");
                }

                if (!string.IsNullOrEmpty(NumberOfInferencesPerMessage))
                {
                    options.Add($"NumberOfInferencesPerMessage={NumberOfInferencesPerMessage}");
                }

                if (!string.IsNullOrEmpty(model_id))
                {
                    options.Add($"model_id={model_id}");
                }

                if (options.Count > 0)
                {
                    for (int index = 0; index < options.Count; index++)
                    {
                        if (index == 0)
                        {
                            urlSegment += $"?{options[index]}";
                        }
                        else
                        {
                            urlSegment += $"&{options[index]}";
                        }

                    }
                }

                var response = await SendPost(urlSegment);
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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-stop-upload-inference-result?
        //
        [HttpPost]
        public async Task<ActionResult> StopUploadInferenceResult(string device_id)
        {
            try
            {
                string urlSegment = $"devices/{device_id}/inferenceresults/collectstop";
                var response = await SendPost(urlSegment);
                var jsonString = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    return Ok(Json(jsonString));
                }
                else
                {
                    var jsonData = JObject.Parse(jsonString);

                    if (jsonData["message"].ToString().Contains("AlreadyStopped"))
                    {
                        response.StatusCode = HttpStatusCode.Accepted;
                        return Accepted(Json(jsonString));
                    }
                    return StatusCode(StatusCodes.Status500InternalServerError, Json(jsonString));
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

        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/post-stop-upload-retraining-data?
        //
        [HttpPost]
        public async Task<ActionResult> StopUploadRetrainingData(string device_id)
        {
            try
            {
                string urlSegment = $"devices/{device_id}/images/collectstop";
                var response = await SendPost(urlSegment);
                var jsonString = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    return Ok(Json(jsonString));
                }
                else
                {
                    var jsonData = JObject.Parse(jsonString);

                    if (jsonData["message"].ToString().Contains("AlreadyStopped"))
                    {
                        response.StatusCode = HttpStatusCode.Accepted;
                        return Accepted(Json(jsonString));
                    }
                    return StatusCode(StatusCodes.Status500InternalServerError, Json(jsonString));
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

        #endregion

        #region DELETE
        //
        // https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/delete-delete-project?
        //
        [HttpDelete]
        public async Task<ActionResult> DeleteProject(string project_name)
        {
            try
            {
                string urlSegment = $"model_projects/{project_name}";
                var response = await SendDelete(urlSegment);
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

        public async Task<ActionResult> DeleteModel(string model_id)
        {
            try
            {
                string urlSegment = $"models/{model_id}";
                var response = await SendDelete(urlSegment);
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

        public async Task<ActionResult> DeleteDeployConfiguration(string config_id)
        {
            try
            {
                string urlSegment = $"deployconfigurations/{config_id}";
                var response = await SendDelete(urlSegment);
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
        #endregion

        //
        //https://apim-labstaging01.portal.azure-api.net/docs/services/v1/operations/put-deploy-by-configuration?
        //
        [HttpPut]
        public async Task<ActionResult> DeployByConfiguration(string config_id,
                                                              string device_ids,
                                                              string comment,
                                                              string replace_model_id)
        {
            try
            {
                string urlSegment = $"deployconfigurations/{config_id}?device_ids={device_ids}";
                List<string> options = new List<string>();

                if (!string.IsNullOrEmpty(comment))
                {
                    options.Add($"comment={comment}");
                }

                if (!string.IsNullOrEmpty(replace_model_id))
                {
                    options.Add($"replace_model_id={replace_model_id}");
                }


                if (options.Count > 0)
                {
                    for (int index = 0; index < options.Count; index++)
                    {
                        urlSegment += $"&{options[index]}";
                    }
                }

                var response = await SendPut(urlSegment);
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

