namespace SonyIMX500.Models
{

    public class SonyApiSettings
    {
        public string BaseUrl { get; set; }
        public string AppGwValidation { get; set; }
    }

    public class BlobSettings
    {
        public string ConnectionString { get; set; }
    }
    public class AppSettings
    {
        public SonyApiSettings SonyApi {get;set;}
        public BlobSettings Blob { get; set; }
    }
}
