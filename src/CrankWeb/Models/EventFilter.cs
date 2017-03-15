using Crankdata.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;
using MongoDB.Driver.GeoJsonObjectModel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;


namespace CrankService.Models
{
    public class EventFilter
    {
        public ObjectId? Id { get; set; }

        public string Name { get; set; }

        public string EventType { get; set; }

        public double? Popularity { get; set; }

        //public DateTime? StartDateTime { get; set; }
        //public DateTime? StartDate { get; set; }
        //public TimeSpan? StartTime { get; set; }

        public string AgeRestriction { get; set; }
        public string City { get; set; }

        //public GeoJson2DCoordinates LngLat { get; set; }
        //public Venue EventVenue { get; set; }
        //public Performance performance { get; set; }

        public MongoDB.Driver.FilterDefinition<Event> ToFilterDefinition()
        {
            var filterDefinition = Builders<Event>.Filter.Empty; // new BsonDocument()

            if (Id.HasValue)
            {
                filterDefinition &=
                     Builders<Event>.Filter.Where(r => r.Id.Equals(Id));
            }

            if (!string.IsNullOrEmpty(Name))
            {
                filterDefinition &=
                     Builders<Event>.Filter.Where(r => r.Name.Contains(Name));
            }
            if (!string.IsNullOrEmpty(EventType))
            {
                filterDefinition &=
                     Builders<Event>.Filter.Where(r => r.EventType.Contains(EventType));
            }
            if (Popularity.HasValue)
            {
                filterDefinition &=
                     Builders<Event>.Filter.Where(r => r.Popularity.Equals(Popularity));
            }
            if (!string.IsNullOrEmpty(AgeRestriction))
            {
                filterDefinition &=
                     Builders<Event>.Filter.Where(r => r.AgeRestriction.Equals(AgeRestriction));
            }
            if (!string.IsNullOrEmpty(City))
            {
                filterDefinition &=
                     Builders<Event>.Filter.Where(r => r.City.Equals(City));
            }

            return filterDefinition;
        }

    }
}
