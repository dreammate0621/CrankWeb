using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Crankdata.Models;
using MongoDB.Driver;

namespace CrankService.Models
{
    public class CompanyFilter
    {
        public ObjectId? Id { get; set; }
        public string Name { get; set; }

        public MongoDB.Driver.FilterDefinition<Company> ToFilterDefinition()
        {
            var filterDefinition = Builders<Company>.Filter.Empty; // new BsonDocument()
            if (Id.HasValue)
            {
                filterDefinition &=
                     Builders<Company>.Filter.Where(r => r.Id.Equals(Id));
            }

            if (!string.IsNullOrEmpty(Name))
            {
                filterDefinition &=
                     Builders<Company>.Filter.Where(r => r.Name.Contains(Name));
                filterDefinition |=
                     Builders<Company>.Filter.Where(r => r.OtherNames.Contains(Name));
            }


            return filterDefinition;
        }
    }
}
