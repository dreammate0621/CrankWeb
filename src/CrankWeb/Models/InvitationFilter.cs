using Crankdata.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CrankService.Models
{
    public class InvitationFilter
    {
        [BsonId]
        public ObjectId? Id { get; set; }
        public ObjectId? UserId { get; set; }
        public string Email { get; set; }
        public DateTime? SentDateTime { get; set; }
        public Guid? GUID { get; set; }
        public long? ExpiryInSecs { get; set; }
        public DateTime? registeredDateTime { get; set; }
        public bool? registered { get; set; }

        public MongoDB.Driver.FilterDefinition<Invitation> ToFilterDefinition()
        {
            var filterDefinition = Builders<Invitation>.Filter.Empty; // new BsonDocument()

            if (Id.HasValue)
            {
                filterDefinition &=
                     Builders<Invitation>.Filter.Where(i => i.Id.Equals(Id));
            }

            if (UserId.HasValue)
            {
                filterDefinition &=
                     Builders<Invitation>.Filter.Where(i => i.UserId.Equals(UserId));
            }

            if (!string.IsNullOrEmpty(Email))
            {
                filterDefinition &=
                     Builders<Invitation>.Filter.Where(i => i.Email.Contains(Email));
            }

            if (GUID.HasValue)
            {
                filterDefinition &=
                     Builders<Invitation>.Filter.Where(i => i.GUID.Equals(GUID));
            }

            return filterDefinition;
        }

    }
}
