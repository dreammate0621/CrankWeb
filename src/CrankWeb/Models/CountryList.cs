using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GeoService.Models
{
    public class CountryList
    {
        public IEnumerable<CountryViewModel> Country { get; set; }
        public CountryFilter Filters { get; set; }
    }

    public class CountryViewModel
    {
        public string id { get; set; }
        public string fips { get; set; }
        public string iso2 { get; set; }
        public string iso3 { get; set; }
        public string un { get; set; }
        public string name { get; set; }
        public string area { get; set; }
        public string pop2005 { get; set; }
        public string region { get; set; }
        public string subregion { get; set; }
        public string lon { get; set; }
        public string lat { get; set; }
        public string geom { get; set; }
    }
}
