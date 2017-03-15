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
    public class ArtistImageFilter
    {
        [BsonId]
        public ObjectId? Id { get; set; }
        public ObjectId? ArtistId { get; set; }
        public string ImageSize { get; set; }


        public MongoDB.Driver.FilterDefinition<ArtistImage> ToFilterDefinition()
        {
            var filterDefinition = Builders<ArtistImage>.Filter.Empty; // new BsonDocument()

            if (Id.HasValue)
            {
                filterDefinition &=
                     Builders<ArtistImage>.Filter.Where(r => r.Id.Equals(Id));
            }

            if (ArtistId.HasValue)
            {
                filterDefinition &=
                     Builders<ArtistImage>.Filter.Where(r => r.ArtistId.Equals(ArtistId));
            }

            /*var builder = Builders<ImageThumbnail>.Filter;

            var filter1 = builder.Eq(it => it.Size, ImageSize) & builder.Lte(ss => ss.SpinStat.Rank, 10);
            var filter = Builders<Song>.Filter.ElemMatch(s => s.Stats, filter1);
            var song = songs.Find(filter).ToList();

            foreach (var song1 in song)
            {
                //Linq query
                var stat = song1.Stats.Where(ss => ss.Format == "Active Rock").FirstOrDefault();

                Console.WriteLine("Song: {0}, Format:{1}, Rank:{2}", song1.Artist, stat.Format, stat.SpinStat.Rank);
            }



            if (!string.IsNullOrEmpty(ImageSize))
            {
                filterDefinition &=
                     Builders<ArtistImage>.Filter.Where(r => r.Images.Any<ImageThumbnail>Equals(ArtistId));
            }

    */
            return filterDefinition;
        }
    }
}
