using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Linq;
using SonyIMX500.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SonyIMX500.Controllers
{
    [Authorize]
    public class CosmosDb : Controller
    {
        private readonly ILogger<CosmosDb> _logger;
        private readonly AppSettings _appSettings;
        private CosmosClient _cosmosClient;
        private Container _cosmosContainer;
        private static readonly string _dbname = "SmartCameras";
        private static readonly string _containerName = "InferenceResult";

        public IActionResult Index()
        {
            return View();
        }
        public CosmosDb(IOptions<AppSettings> optionsAccessor, ILogger<CosmosDb> logger)
        {
            _appSettings = optionsAccessor.Value;
            _logger = logger;
            _cosmosClient = new CosmosClient(_appSettings.CosmosDb.ConnectionString);
            _cosmosContainer = _cosmosClient.GetContainer(_dbname, _containerName);
        }

        [HttpGet]
        //public async Task<IActionResult> loadData(string threshold, string recordCount, string deviceId)
        public async Task<IActionResult> loadData(string threshold, string recordCount)
        {
            var responses = new List<COSMOS_DB_DATA>();
            COSMOS_DB_DATA response = null;
            double thresholdValue = Convert.ToDouble(threshold) / 100;

            try
            {
                string query;
                string queryCondition = "IS_DEFINED(c.Inferences[0]['1']) = true";

                //if (deviceId.Equals("*"))
                //{
                //    queryCondition += $" AND c.DeviceID = {deviceId}";
                //}

                if (recordCount.Equals("0"))
                {
                    query = $"SELECT * FROM c WHERE {queryCondition} order by c._ts desc";
                }
                else
                {
                    query = $"SELECT TOP {recordCount} * FROM c WHERE {queryCondition} order by c._ts desc";
                }

                QueryDefinition queryDef = new QueryDefinition(query);

                //FeedIterator<INFERENCE_RESULT> iterator = _cosmosContainer.GetItemQueryIterator<INFERENCE_RESULT>(query);

                var iterator = _cosmosContainer.GetItemQueryIterator<dynamic>(query);

                while (iterator.HasMoreResults)
                {
                    var inferenceResults = await iterator.ReadNextAsync();

                    foreach (var result in inferenceResults)
                    {
                        
                        string device_Id = String.Empty;
                        bool image = false;
                        string model_id = String.Empty; ;
                        Int64 ts = 0;
                        string id = string.Empty;

                        if (result.ContainsKey("DeviceID"))
                        {
                            device_Id = (string)result["DeviceID"];
                        }

                        if (result.ContainsKey("Image"))
                        {
                            image = (bool)result["Image"];
                        }

                        if (result.ContainsKey("ModelID"))
                        {
                            model_id = (string)result["ModelID"];
                        }

                        if (result.ContainsKey("_ts"))
                        {
                            ts = result["_ts"];
                        }

                        if (result.ContainsKey("id"))
                        {
                            id = result["id"];
                        }

                        if (result.ContainsKey("Inferences"))
                        {
                            foreach (JObject inference in result["Inferences"])
                            {
                                string T = inference["T"].ToString();

                                foreach (var item in inference)
                                {
                                    if (item.Key != "T")
                                    {
                                        double p = (double)item.Value["P"];

                                        if ((p < thresholdValue) || (p > 1))
                                        {
                                            continue;
                                        }

                                        response = new COSMOS_DB_DATA();
                                        response.Id = id;
                                        response.Ts = ts;
                                        response.Device_ID = device_Id;
                                        response.Model_ID = model_id;
                                        response.Image = image;

                                        response.P = string.Format("{0:P1}", p);
                                        response.C = item.Value["C"].ToString();
                                        response.T = T;
                                        response.Coord = $"({item.Value["X"]},{item.Value["Y"]}) - ({item.Value["x"]},{item.Value["y"]})";

                                        responses.Add(response);
                                    }
                                }
                            }
                        }
                    }
                    //FeedResponse<INFERENCE_RESULT> inferenceResults = await iterator.ReadNextAsync();
                    //_logger.LogInformation($"Test");

                    //foreach (INFERENCE_RESULT inferenceResult in inferenceResults)
                    //{
                    //    _logger.LogInformation($"Test");
                    //}
                }    

            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in {System.Reflection.MethodBase.GetCurrentMethod().Name}() {ex.Message}");
                System.Diagnostics.Trace.TraceError($"Excetion in {System.Reflection.MethodBase.GetCurrentMethod().Name}() {ex.Message}");
                return BadRequest(ex.Message);
            }
            return Ok(Json(JsonConvert.SerializeObject(responses)));
        }

        public class COSMOS_DB_DATA
        {
            public Int64 Ts{ get; set; }
            public string Id { get; set; }
            public string Device_ID { get; set; }
            public string Model_ID { get; set; }
            public bool Image { get; set; }
            public string T { get; set; }
            public string C { get; set; }
            public string P { get; set; }
            public string Coord { get; set; }
        }
        public class INFERENCE_RESULT
        {
            public string DeviceID { get; set; }
            public string ModelID { get; set; }
            public bool Image { get; set; }
            //public string Inferences { get; set; }
        }
    }
}
