using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MongoDB.Driver;
using Crankdata.Models;

namespace GeoService.Models
{
    public class CountryFilter
    {
        public string id { get; set; }
        public string fips { get; set; }
        public string iso2 { get; set; }
        public string iso3 { get; set; }
        public string un { get; set; }
        public string name { get; set; }
        public long? area { get; set; }
        public long? pop2005 { get; set; }
        public long? region { get; set; }
        public long? subregion { get; set; }
        //public string lat { get; set; }
        //public string lon { get; set; }
        public decimal? lon { get; set; }
        public decimal? lat { get; set; }
        public string geom { get; set; }

        public FilterDefinition<Country> ToFilterDefinition()
        {
            var filterDefinition = Builders<Country>.Filter.Empty; // new BsonDocument()

            if (!string.IsNullOrEmpty(id))
            {
               filterDefinition &=
                    Builders<Country>.Filter.Where(r => r.id.Equals(id));
            }

            if (!string.IsNullOrEmpty(iso2))
            {
                filterDefinition &=
                     Builders<Country>.Filter.Where(r => r.iso2.Equals(iso2));
            }

            if (!string.IsNullOrEmpty(iso3))
            {
                filterDefinition &=
                     Builders<Country>.Filter.Where(r => r.iso3.Equals(iso3));
            }

            if (!string.IsNullOrEmpty(name))
            {
                filterDefinition &=
                     Builders<Country>.Filter.Where(r => r.name.Contains(name));
            }

            if (region.HasValue)
            {
                filterDefinition &=
                     Builders<Country>.Filter.Eq(r => r.region, region.Value);
            }

            if (subregion.HasValue)
            {
                filterDefinition &=
                     Builders<Country>.Filter.Eq(r => r.subregion, subregion.Value);
            }

            if (lat.HasValue)
            {
                filterDefinition &=
                     Builders<Country>.Filter.Eq(r => r.lat, lat.Value);
            }

            if (lon.HasValue)
            {
                filterDefinition &=
                     Builders<Country>.Filter.Eq(r => r.lon, lon.Value);
            }

            return filterDefinition;
        }
    }
}