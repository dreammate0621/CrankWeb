using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Crankdata.Models;
using MongoDB.Driver;

namespace CrankService.Models
{
    public class UserPwdFilter
    {
        public ObjectId? Id { get; set; }
        public ObjectId? UserId { get; set; }
        public string Password { get; set; }

        public MongoDB.Driver.FilterDefinition<UserPwd> ToFilterDefinition()
        {
            var filterDefinition = Builders<UserPwd>.Filter.Empty; // new BsonDocument()
            if (Id.HasValue)
            {
                filterDefinition &=
                     Builders<UserPwd>.Filter.Where(r => r.Id.Equals(Id));
            }
            if (UserId.HasValue)
            {
                filterDefinition &=
                     Builders<UserPwd>.Filter.Where(r => r.UserId.Equals(UserId));
            }
            if (!string.IsNullOrEmpty(Password))
            {
                filterDefinition &=
                     Builders<UserPwd>.Filter.Where(r => r.Password.Equals(Password));
            }
            return filterDefinition;
        }
    }
}
