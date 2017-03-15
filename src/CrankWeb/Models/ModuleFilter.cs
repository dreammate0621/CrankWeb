using Crankdata.Models;
using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CrankService.Models
{
    public class ModuleFilter
    {
        public ObjectId? Id { get; set; }
        public string Name { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsExpandable { get; set; }
        public DateTime? CreatedDate { get; set; }

        public MongoDB.Driver.FilterDefinition<Module> ToFilterDefinition()
        {
            var filterDefinition = Builders<Module>.Filter.Empty; // new BsonDocument()
            if (Id.HasValue)
            {
                filterDefinition &=
                     Builders<Module>.Filter.Where(m => m.Id.Equals(Id));
            }

            if (!string.IsNullOrEmpty(Name))
            {
                filterDefinition &=
                     Builders<Module>.Filter.Where(m => m.Name.Equals(Name));
            }

            if (IsActive.HasValue)
            {
                filterDefinition &=
                     Builders<Module>.Filter.Where(m => m.IsActive.Equals(IsActive));
            }
            if (IsExpandable.HasValue)
            {
                filterDefinition &=
                     Builders<Module>.Filter.Where(m => m.IsExpandable.Equals(IsExpandable));
            }

            return filterDefinition;
        }
    }
}
