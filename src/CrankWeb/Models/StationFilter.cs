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
    public class StationFilter
    {
        public ObjectId? Id { get; set; }

        public string Name { get; set; }
        public int? Rank { get; set; }
        public string Callcode { get; set; }
        public string SType { get; set; }
        public string Market { get; set; }
        public string Group { get; set; }
        public string ContactInfo { get; set; }
        public string Frequency { get; set; }
        public string Format { get; set; }
        public string Owner { get; set; }
        public string AQH { get; set; }
        [BsonDateTimeOptions(DateOnly = true)]
        public DateTime? FirstMonitored { get; set; }
        public string Phone { get; set; }
        public string Alias { get; set; }

        public MongoDB.Driver.FilterDefinition<Station> ToFilterDefinition()
        {
            var filterDefinition = Builders<Station>.Filter.Empty; // new BsonDocument()

            if (Id.HasValue)
            {
                filterDefinition &=
                     Builders<Station>.Filter.Where(r => r.Id.Equals(Id));
            }

            if (!string.IsNullOrEmpty(Name))
            {
                filterDefinition &=
                     Builders<Station>.Filter.Where(r => r.Name.Contains(Name));
            }
            if (Rank.HasValue)
            {
                filterDefinition &=
                     Builders<Station>.Filter.Where(r => r.Rank.Equals(Rank));
            }
            if (!string.IsNullOrEmpty(Callcode))
            {
                filterDefinition &=
                     Builders<Station>.Filter.Where(r => r.Callcode.Equals(Callcode));
            }
            if (!string.IsNullOrEmpty(SType))
            {
                filterDefinition &=
                     Builders<Station>.Filter.Where(r => r.SType.Equals(SType));
            }

            if (!string.IsNullOrEmpty(Market))
            {
                filterDefinition &=
                     Builders<Station>.Filter.Where(r => r.Market.Contains(Market));
            }
            if (!string.IsNullOrEmpty(Group))
            {
                filterDefinition &=
                     Builders<Station>.Filter.Where(r => r.Group.Contains(Group));
            }

            if (!string.IsNullOrEmpty(ContactInfo))
            {
                filterDefinition &=
                     Builders<Station>.Filter.Where(r => r.ContactInfo.Contains(ContactInfo));
            }
            if (!string.IsNullOrEmpty(Frequency))
            {
                filterDefinition &=
                     Builders<Station>.Filter.Where(r => r.Frequency.Equals(Frequency));
            }
            if (!string.IsNullOrEmpty(Format))
            {
                filterDefinition &=
                     Builders<Station>.Filter.Where(r => r.Format.Equals(Format));
            }
            if (!string.IsNullOrEmpty(Owner))
            {
                filterDefinition &=
                     Builders<Station>.Filter.Where(r => r.Owner.Equals(Owner));
            }
            if (!string.IsNullOrEmpty(AQH))
            {
                filterDefinition &=
                     Builders<Station>.Filter.Where(r => r.AQH.Equals(AQH));
            }

            if (!string.IsNullOrEmpty(Phone))
            {
                filterDefinition &=
                     Builders<Station>.Filter.Where(r => r.Phone.Equals(Phone));
            }
            
            if (FirstMonitored.HasValue)
            {
                DateTime currentTime = DateTime.Now;
                filterDefinition &= Builders<Station>.Filter.Where(r => r.FirstMonitored <= currentTime);

            }
            if (!string.IsNullOrEmpty(Alias))
            {
                filterDefinition &=
                     Builders<Station>.Filter.Where(r => r.Alias.Equals(Alias));
            }
            return filterDefinition;
        }
    }
}