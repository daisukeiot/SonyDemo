using System.Collections.Generic;

namespace SonyIMX500.Models
{
    public class TraininImages
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public double Price { get; set; }
        public List<string> Photos { get; set; }
    }
}
