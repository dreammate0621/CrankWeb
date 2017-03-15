using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Crankdata.Models;
using MongoDB.Driver;

namespace CrankService.Models
{
    public class SongFilter
    {
        public ObjectId? Id { get; set; }
        public string Title { get; set; }
        public string Artist { get; set; }
        public ObjectId? ArtistId { get; set; }
        public string Charts { get; set; }
        public string OrigTitle { get; set; }
        public string OrigLabels { get; set; }

        public SortedSet<string> Labels { get; set; } = new SortedSet<string>();

        public DateTime? CreatedDate { get; set; } = DateTime.Now;

        public SortedSet<string> SubArtists { get; set; } = new SortedSet<string>();

        public SongStats Stats { get; set; } = new SongStats();

        public MongoDB.Driver.FilterDefinition<Song> ToFilterDefinition()
        {
            var filterDefinition = Builders<Song>.Filter.Empty; // new BsonDocument()
            if ( Id.HasValue)
            {
                filterDefinition &=
                     Builders<Song>.Filter.Where(r => r.Id.Equals(Id));
            }

            if (!string.IsNullOrEmpty(Title))
            {
                filterDefinition &=
                     Builders<Song>.Filter.Where(r => r.Title.Contains(Title));
            }
            if (!string.IsNullOrEmpty(Artist))
            {
                filterDefinition &=
                     Builders<Song>.Filter.Where(r => r.Artist.Contains(Artist));
            }

            if (ArtistId.HasValue)
            {
                filterDefinition &=
                     Builders<Song>.Filter.Where(r => r.ArtistId.Equals(ArtistId));
            }
            if (!string.IsNullOrEmpty(Charts))
            {
                filterDefinition &=
                     Builders<Song>.Filter.Where(r => r.Charts.Contains(Charts));
            }
            if (!string.IsNullOrEmpty(OrigTitle))
            {
                filterDefinition &=
                     Builders<Song>.Filter.Where(r => r.OrigTitle.Contains(OrigTitle));
            }

            if (!string.IsNullOrEmpty(OrigLabels))
            {
                filterDefinition &=
                     Builders<Song>.Filter.Where(r => r.OrigLabels.Contains(OrigLabels));
            }

            // Double check 
            if (Labels.Any())
            {
                foreach (string Label in Labels)
                {

                    if (!string.IsNullOrEmpty(Label))
                    {
                        filterDefinition &=
                             Builders<Song>.Filter.Where(r => r.Labels.Contains(Label));
                    }

                }
            }
            // To do Created date
            if(CreatedDate.HasValue)
            {
                DateTime currentTime = DateTime.Now;
                filterDefinition &= Builders<Song>.Filter.Where(r => r.CreatedDate <= currentTime);

            }
            // Double check 
            if (SubArtists.Any())
            {
                foreach (string SubArtist in SubArtists)
                {
                    if (!string.IsNullOrEmpty(SubArtist))
                    {
                        filterDefinition &=
                             Builders<Song>.Filter.Where(r => r.SubArtists.Contains(SubArtist));
                    }

                }
            }

            // To do songStats
            /*if(!string.IsNullOrEmpty(Stats.Format))
            {
                filterDefinition &=
                        //Builders<Song>.Filter.Where("Stats.Format".Contains(Stats.Format));
                        //Builders<Song>.Filter.Where(r => r.Stats.fContains(Stats.Format));
                        Builders<Song>.Filter.ElemMatch<SongStats>(r => r.Stats, Stats.Format);
            }
            */
            
            return filterDefinition;
        }
    }
}
