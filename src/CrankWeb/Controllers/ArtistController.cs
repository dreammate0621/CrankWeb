using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Crankdata.Models;
using MongoDB.Driver;
using Microsoft.AspNetCore.Mvc;
using CrankService.Models;
using MongoDB.Bson;
using NLog;
using System.Net.Http;
using System.IO;
using System.Net;
using Microsoft.AspNetCore.Authorization;
using CrankService.Utils;
using Microsoft.AspNetCore.Hosting;
using CrankWeb.Models;
using Microsoft.Extensions.Options;

namespace CrankService.Controllers
{
    [Authorize]
    public class ArtistController: Controller
    {
        CrankdataContext _artistContext = null;
        IMongoCollection<Artist> _artists = null;
        IMongoCollection<ArtistSummary> _artistSummaries = null;
        IMongoCollection<Event> _events = null;
        IMongoCollection<ArtistImage> _artistimages = null;
        private static Logger _logger = LogManager.GetCurrentClassLogger();
        private readonly IHostingEnvironment _hostingEnvironment;
        string _rootPath;
        private Configuration _configuration { get; }

        public ArtistController(IOptions<Configuration> settings, IHostingEnvironment hostingEnvironment)
        {
            _hostingEnvironment = hostingEnvironment;
            _configuration = settings.Value;
            _artistContext = new CrankdataContext(_configuration.MongoDB.ConnectionString, _configuration.MongoDB.Database);
            _rootPath = _hostingEnvironment.WebRootPath;
            _artists = _artistContext.Artists;
            _artistSummaries = _artistContext.ArtistSummaries;
            _events = _artistContext.Events;
            _artistimages = _artistContext.ArtistImages;
        }


        [HttpGet()]
        [Route("/api/v1/artists")]
        public async Task<IActionResult> GetByPageNumber(int pageNumber=1, int pageSize = 20)

        {
          
            FindOptions<Artist> options = new FindOptions<Artist> { Limit = pageSize,
                                                                    Skip = (pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0),
                                                                    Sort = Builders<Artist>.Sort.Ascending(a => a.Title) };
            try
            {
                var cursor = await _artists.FindAsync<Artist>(new BsonDocument(), options);
                _logger.Info("Getting all artists");
                Console.WriteLine("Getting all artists");
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                _logger.Error("{0} Exception caught. " + e.ToString());
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
                //return new ErrorModel(e.Message, e.StackTrace, 1);
            }

        }

        [HttpPost()]
        [Route("/api/v1/artists/search")]
        public async Task<IActionResult> Post([FromBody] ArtistViewModel viewModel)
        {
            try
            {
                ArtistFilter filter = getArtistFilter(viewModel);
                var cursor = await _artists.FindAsync<Artist>(filter.ToFilterDefinition());
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        [HttpGet()]
        [Route("/api/v1/artists/{id}/events/{sortOrder?}")]
        public async Task<IActionResult> GetEvents(string id, string sortOrder="Ascending")
        {
            try
            {
                ObjectId ArtistId = ObjectId.Parse(id);


                var filterPerformance = Builders<Performance>.Filter.Where(p => p.ArtistId.Equals(ArtistId));
                var filterEvent = Builders<Event>.Filter.Where(e => e.StartDate.HasValue && e.StartDate > DateTime.Today);
                filterEvent &= Builders<Event>.Filter.ElemMatch<Performance>(e => e.Performance, filterPerformance);

                var options = new FindOptions<Event, Event> { Sort = Builders<Event>.Sort.Ascending(e => e.StartDate)};
                var cursor = await _events.FindAsync<Event>(filterEvent, options);

                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        [HttpGet()]
        [Route("/api/v1/artists/getById/{id}")]
        public async Task<IActionResult> Get(string id)
        {
            try
            {
                ArtistFilter filter = new ArtistFilter();
                filter.Id = ObjectId.Parse(id);

                var cursor = await _artists.FindAsync<Artist>(filter.ToFilterDefinition());
                return Ok(await cursor.FirstOrDefaultAsync<Artist>());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        [HttpGet()]
        [Route("/api/v1/artists/{id}/images/{imageSize?}")]
        public async Task<ActionResult> GetImage(string id, string imageSize="normal")
        {
            try
            {
                ObjectId ArtistId = ObjectId.Parse(id);
                var filterSub = Builders<ImageThumbnail>.Filter.Where(i => i.Size.Equals(imageSize));
                var filterMain = Builders<ArtistImage>.Filter.Eq(ai => ai.ArtistId, ArtistId);

                var projection = Builders<ArtistImage>.Projection
                    .Include(ai => ai.ArtistId)
                    .ElemMatch(ai => ai.Images, filterSub);

                var options = new FindOptions<ArtistImage, ArtistImage> { Projection = projection };
                var cursor = await _artistimages.FindAsync<ArtistImage>(filterMain, options);

                FileContentResult result = null;

                ArtistImage aiResult = cursor.ToList<ArtistImage>().FirstOrDefault<ArtistImage>();
                if (aiResult != null && aiResult.Images != null && aiResult.Images.Count > 0)
                {
                    byte[] imgData = aiResult.Images[0].data;
                    if (imgData != null && imgData.Length > 200)
                    {
                        result = new FileContentResult(imgData, "image/png");
                    }
                }
                // Result still null
                if (result == null)
                {
                    string fileName = "/images/Artist-50.png";
                    switch (imageSize)
                    {
                        case "small":
                            fileName = "/images/Artist-31.png";
                            break;
                        case "large":
                            fileName = "/images/Artist-140.png";
                            break;
                        case "huge":
                            fileName = "/images/Artist-300.png";
                            break;
                        case "normal":
                            fileName = "/images/Artist-50.png";
                            break;
                    }
                    result = new FileContentResult(FileUtil.readFile(_rootPath + fileName), "image/png");
                }

                return result;
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));
            }
        }

        // Get a Artist by more than one Ids
        [HttpPost()]
        [Route("/api/v1/artists/getByIds")]
        public async Task<IActionResult> GetByIds([FromBody] ObjectIdListReq artistIdReq)
        {
            try
            {
                IEnumerable<ArtistSummary> usL = new List<ArtistSummary>();
                //List<ArtistSummary> asList = new List<ArtistSummary>();
                if (artistIdReq.Ids.Count > 0)
                {

                    List<ObjectId> artistObjIdList = new List<ObjectId>();
                    foreach (string id in artistIdReq.Ids)
                    {
                        artistObjIdList.Add(ObjectId.Parse(id));
                    }

                    //var filterDefinition = Builders<UserSummary>.Filter.Empty; // new BsonDocument()
                    var filterDefinition = Builders<ArtistSummary>.Filter.In<ObjectId>(us => us.Id, artistObjIdList);
                    var cursor = await _artistSummaries.FindAsync<ArtistSummary>(filterDefinition);//, options);

                    List<ArtistSummary> asList = await cursor.ToListAsync<ArtistSummary>();
                    usL = asList.OrderBy(item => artistObjIdList.IndexOf(item.Id));
                }
                return Ok(usL);
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }

        }

        // Get a Artist by name
        [HttpGet()]
        [Route("/api/v1/artists/searchByName/{name}")]
        public async Task<IActionResult> GetByName(string name, int pageNumber = 1, int pageSize = 10)
        {
            try
            {

            
                var filterDefinition = Builders<ArtistSummary>.Filter.Empty; // new BsonDocument()
                if (!string.IsNullOrEmpty(name))
                {
                    string lowerCaseName = name.ToLower();
                    filterDefinition &=
                         Builders<ArtistSummary>.Filter.Where(r => r.FirstName.ToLower().Contains(lowerCaseName));
                    filterDefinition |=
                         Builders<ArtistSummary>.Filter.Where(r => r.LastName.ToLower().Contains(lowerCaseName));
                    filterDefinition |=
                         Builders<ArtistSummary>.Filter.Where(r => r.MiddleName.ToLower().Contains(lowerCaseName));
                    filterDefinition |=
                         Builders<ArtistSummary>.Filter.Where(r => r.SortName.ToLower().Contains(lowerCaseName));
                    filterDefinition |=
                         Builders<ArtistSummary>.Filter.Where(r => r.Title.ToLower().Contains(lowerCaseName));
                }


                var options = new FindOptions<ArtistSummary, ArtistSummary>
                {
                    Limit = pageSize,
                    Skip = (pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0),
                    Sort = Builders<ArtistSummary>.Sort.Ascending(a => a.Title)};

                var cursor = await _artistSummaries.FindAsync< ArtistSummary>(filterDefinition, options);

                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        private ArtistFilter getArtistFilter(ArtistViewModel viewModel)
        {
            ArtistFilter filter = new ArtistFilter();

            if (!string.IsNullOrEmpty(viewModel.Id))
            {
                filter.Id = ObjectId.Parse(viewModel.Id);
            }
            if (!string.IsNullOrEmpty(viewModel.Mbid))
            {
                filter.Mbid = Guid.Parse(viewModel.Mbid);
            }
            if (!string.IsNullOrEmpty(viewModel.Title))
            {
                filter.Title = viewModel.Title;
            }
            if (!string.IsNullOrEmpty(viewModel.FirstName))
            {
                filter.FirstName = viewModel.FirstName;
            }
            if (!string.IsNullOrEmpty(viewModel.MiddleName))
            {
                filter.MiddleName = viewModel.MiddleName;
            }
            if (!string.IsNullOrEmpty(viewModel.LastName))
            {
                filter.LastName = viewModel.LastName;
            }
            if (!string.IsNullOrEmpty(viewModel.SortName))
            {
                filter.SortName = viewModel.SortName;
            }
            if (!string.IsNullOrEmpty(viewModel.SType))
            {
                filter.SType = viewModel.SType;
            }
            if (!string.IsNullOrEmpty(viewModel.Gender))
            {
                filter.Gender = viewModel.Gender;
            }
            if (!string.IsNullOrEmpty(viewModel.Location))
            {
                filter.Location = viewModel.Location;
            }
            if (!string.IsNullOrEmpty(viewModel.IPICode))
            {
                filter.IPICode = viewModel.IPICode;
            }
            if (!string.IsNullOrEmpty(viewModel.ISNICode))
            {
                filter.ISNICode = viewModel.ISNICode;
            }
            if (!string.IsNullOrEmpty(viewModel.Description))
            {
                filter.Description = viewModel.Description;
            }
            if (!string.IsNullOrEmpty(viewModel.Bio))
            {
                filter.Bio = viewModel.Bio;
            }
            if (!string.IsNullOrEmpty(viewModel.Alias))
            {
                filter.Alias = viewModel.Alias;
            }

            return filter;
        }
    }
}
