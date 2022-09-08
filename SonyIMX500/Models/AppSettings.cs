namespace SonyIMX500.Models
{

    public class SonyApiSettings
    {
        public string BaseUrl { get; set; }
        public string AppGwValidation { get; set; }
        public string ClientId { get; set; }
    }

    public class BlobSettings
    {
        public string ConnectionString { get; set; }
    }

    public class CosmosDbSetings
    {
        public string ConnectionString { get; set; }
    }
    public class CustomVisionSettins
    {
        public string Endpoint { get; set; }
        public string AccessKey { get; set; }
    }

    public class AppSettings
    {
        public bool UseAAD { get; set; }
        public SonyApiSettings SonyApi {get;set;}
        public BlobSettings Blob { get; set; }
        public CustomVisionSettins CustomVision { get; set; }
        public CosmosDbSetings CosmosDb { get; set; }
    }
}
