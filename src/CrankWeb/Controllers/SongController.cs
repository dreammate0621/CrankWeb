using Crankdata.Models;
using CrankService.Models;
using CrankWeb.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CrankService.Controllers
{
    [Authorize]
    public class SongController: Controller
    {
        CrankdataContext _songsContext = null;// new CrankdataContext();
        IMongoCollection<Song> _songs = null;
        private Configuration _configuration { get; }
        //private MongoDBConfig _mongoDBConfig { get; }
        public SongController(IOptions<Configuration> settings)
        {
            _configuration = settings.Value;
            _songsContext = new CrankdataContext(_configuration.MongoDB.ConnectionString, _configuration.MongoDB.Database);
            _songs = _songsContext.Songs;
        }

        [HttpGet()]
        [Route("/api/v1/songs/{pageNumber?}/{pageSize?}")]
        public async Task<IActionResult> GetByPageNumber(int pageNumber, int pageSize = 20)
        {
          
            FindOptions<Song> options = new FindOptions<Song> { Limit = pageSize, Skip = (pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0) };
            try
            {
                var cursor = await _songs.FindAsync<Song>(new BsonDocument(), options);
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        [HttpPost()]
        [Route("/api/v1/songs/search")]
        public async Task<IActionResult> Post([FromBody] SongViewModel viewModel)
        {
            try
            {
                SongFilter filter = getSongFilter(viewModel);
                var cursor = await _songs.FindAsync<Song>(filter.ToFilterDefinition());
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        [HttpGet()]
        [Route("/api/v1/songs/getById/{Id}")]
        public async Task<IActionResult> Get(string Id)
        {
            try
            {
                SongFilter filter = new SongFilter();
                filter.Id = ObjectId.Parse(Id);

                var cursor = await _songs.FindAsync<Song>(filter.ToFilterDefinition());
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        private SongFilter getSongFilter(SongViewModel viewModel)
        {
            SongFilter filter = new SongFilter();
            if (!string.IsNullOrEmpty(viewModel.Id))
            {
                filter.Id = ObjectId.Parse(viewModel.Id);
            }

            if (!string.IsNullOrEmpty(viewModel.Title))
            {
                filter.Title = viewModel.Title;
            }
            if (!string.IsNullOrEmpty(viewModel.Artist))
            {
                filter.Artist = viewModel.Artist;
            }

            if (!string.IsNullOrEmpty(viewModel.ArtistId))
            {
                filter.ArtistId = ObjectId.Parse(viewModel.ArtistId);
            }
            if (!string.IsNullOrEmpty(viewModel.Charts))
            {
                filter.Charts = viewModel.Charts;
            }
            if (!string.IsNullOrEmpty(viewModel.OrigTitle))
            {
                filter.OrigTitle = viewModel.OrigTitle;
            }

            if (!string.IsNullOrEmpty(viewModel.OrigLabels))
            {
                filter.OrigLabels = viewModel.OrigLabels;
            }

            // Double check 
            if (viewModel.Labels.Any())
            {
                foreach (string Label in viewModel.Labels)
                {
                    if (!string.IsNullOrEmpty(Label))
                    {
                        filter.Labels.Add(Label);
                    }

                }
            }
            // To do Created date
            if (!string.IsNullOrEmpty(viewModel.CreatedDate))
            {
                filter.CreatedDate = DateTime.Parse(viewModel.CreatedDate);

            }
            // Double check 
            if (viewModel.SubArtists.Any())
            {
                foreach (string SubArtist in viewModel.SubArtists)
                {
                    if (!string.IsNullOrEmpty(SubArtist))
                    {
                        filter.SubArtists.Add(SubArtist);
                    }

                }
            }

            if ( viewModel.Stats != null)
            {
                filter.Stats = viewModel.Stats;
            }

            return filter;
        }
    }
}
