using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Crankdata.Models;
using MongoDB.Driver;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CrankService.Models
{
    public class UserImageFilter
    {
        [BsonId]
        public ObjectId? Id { get; set; }
        public ObjectId? UserId { get; set; }


        public MongoDB.Driver.FilterDefinition<UserImage> ToFilterDefinition()
        {
            var filterDefinition = Builders<UserImage>.Filter.Empty; // new BsonDocument()

            if (Id.HasValue)
            {
                filterDefinition &=
                     Builders<UserImage>.Filter.Where(r => r.Id.Equals(Id));
            }

            if (UserId.HasValue)
            {
                filterDefinition &=
                     Builders<UserImage>.Filter.Where(r => r.UserId.Equals(UserId));
            }

            return filterDefinition;
        }
    }
}
