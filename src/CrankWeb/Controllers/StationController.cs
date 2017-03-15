
using Crankdata.Models;
using CrankService.Models;
using CrankService.Utils;
using CrankWeb.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CrankService.Controllers
{
    [Authorize]
    public class StationController : Controller
    {
        CrankdataContext _stationsContext = new CrankdataContext();
        IMongoCollection<Event> _events = null;
        IMongoCollection<Station> _stations = null;
        IMongoCollection<StationSummary> _stationSummaries = null;
        IMongoCollection<StationImage> _stationImages = null;
        IMongoCollection<MetroAreaSummary> _metroAreaSummaries = null;
        IMongoCollection<MetroAreaMarketMap> _metroAreaMarketMaps = null;
        IMongoCollection<MetroArea> _metroAreas = null;
        IMongoCollection<Company> _companies = null;
        IMongoCollection<User> _users = null;



        private Configuration _configuration { get; }
        //private MongoDBConfig _mongoDBConfig { get; }
        string _rootPath;
        private readonly IHostingEnvironment _hostingEnvironment;

        public StationController(IOptions<Configuration> settings, IHostingEnvironment hostingEnvironment)
        {
            _hostingEnvironment = hostingEnvironment;
            _configuration = settings.Value;
            _stationsContext = new CrankdataContext(_configuration.MongoDB.ConnectionString, _configuration.MongoDB.Database);
            _events = _stationsContext.Events;
            _stations = _stationsContext.Stations;
            _rootPath = _hostingEnvironment.WebRootPath;
            _stationSummaries = _stationsContext.StationSummaries;
            _stationImages = _stationsContext.StationImages;
            _metroAreaSummaries = _stationsContext.MetroAreaSummaries;
            _metroAreaMarketMaps = _stationsContext.MetroAreaMarketMaps;
            _metroAreas = _stationsContext.MetroAreas;
            _users = _stationsContext.Users;
            _companies = _stationsContext.Companies;

        }


        [HttpGet()]
        [Route("/api/v1/stations")]
        public async Task<IActionResult> GetByPageNumber(int pageNumber = 1, int pageSize = 20)

        {

            FindOptions<StationSummary> options = new FindOptions<StationSummary> { Limit = pageSize, Skip = (pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0) };
            try
            {
                var cursor = await _stationSummaries.FindAsync<StationSummary>(new BsonDocument(), options);
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }

        }

        [HttpGet()]
        [Route("/api/v1/stations/digitals/{isIncludeInvitationDetail?}")]
        public async Task<IActionResult> GetDigitalsByPageNumber(int pageNumber = 1, int pageSize = 20, bool isIncludeInvitationDetail = false)

        {

            var filterDefinition = Builders<StationSummary>.Filter.Where(ss => ss.SType.ToLower().Contains("digital"));
            FindOptions<StationSummary> options = new FindOptions<StationSummary> { Limit = pageSize, Skip = (pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0) };
            try
            {
                var cursor = await _stationSummaries.FindAsync<StationSummary>(filterDefinition, options);

                var stations = cursor.ToList();

                // include company invite detil to list
                if (isIncludeInvitationDetail)
                {
                    foreach (var ss in stations)
                    {
                        var inviteDetail = await GetInvitationDetail(ss.Owner);
                        ss.CompanyId = inviteDetail.CompanyId;
                        ss.IsShowInviteLink = inviteDetail.IsSentInviation;
                        ss.CompanyAdmin = inviteDetail.CompanyAdmin;
                    }

                }
                return Ok(stations);
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }

        }

        [HttpGet()]
        [Route("/api/v1/stations/fms")]
        public async Task<IActionResult> GetFMByPageNumber(int pageNumber = 1, int pageSize = 20)
        {

            var filterDefinition = Builders<StationSummary>.Filter.Where(ss => ss.SType.ToLower().Contains("fm"));
            FindOptions<StationSummary> options = new FindOptions<StationSummary> { Limit = pageSize, Skip = (pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0) };
            try
            {
                var cursor = await _stationSummaries.FindAsync<StationSummary>(filterDefinition, options);
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }

        }

        // Get Radio stations for a given Event Venue
        [HttpGet()]
        [Route("/api/v1/stations/getStationsAroundEventVenue/{eventId}")]
        public async Task<IActionResult> GetStationsAroundEventVenue(string eventId)
        {
            try
            {
                EventFilter filter = new EventFilter();
                filter.Id = ObjectId.Parse(eventId);

                var cursor = await _events.FindAsync<Event>(filter.ToFilterDefinition());
                Event evnt = await cursor.FirstOrDefaultAsync<Event>();
                if (evnt != null)
                {
                    // Get MetroArea
                    string lowerCaseMA = evnt.EventVenue.MetroArea.Name.ToLower();
                    // Search MetroArea of Event in Station city and return all matching stations.
                    var filterDefinition = Builders<StationSummary>.Filter.Empty; // new BsonDocument()
                    if (!string.IsNullOrEmpty(lowerCaseMA))
                    {
                        filterDefinition &=
                             Builders<StationSummary>.Filter.Where(ss => ss.Market.ToLower().Contains(lowerCaseMA));
                    }

                    var cursorIn = await _stationSummaries.FindAsync<StationSummary>(filterDefinition);

                    return Ok(cursorIn.ToList());
                }
                else
                {
                    return NotFound(new ErrorModel("No stations around event venue " + eventId, "No stations around event venue " + eventId, 404));// "No event exists for eventId " + eventId);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        // Get Radio stations by Metro Ids
        [HttpPost()]
        [Route("/api/v1/stations/getByMetroIds")]
        public async Task<IActionResult> getByMetroIds([FromBody] ObjectIdListReq MetroIdList)
        {
            try
            {
                List<StationSummary> ssList = new List<StationSummary>();
                if (MetroIdList.Ids.Count > 0)
                {
                    int tempCt = 1;
                    var filterDefinition = Builders<StationSummary>.Filter.Empty;
                    foreach (string metroIdStr in MetroIdList.Ids)
                    {
                        ObjectId metroId = ObjectId.Parse(metroIdStr);
                        var maSummaryFilter = Builders<MetroAreaSummary>.Filter.Where(mas => mas.Id.Equals(metroId));
                        var masCursor = await _metroAreaSummaries.FindAsync<MetroAreaSummary>(maSummaryFilter);
                        MetroAreaSummary maSummary = await masCursor.FirstOrDefaultAsync<MetroAreaSummary>();
                        var mammFilter = Builders<MetroAreaMarketMap>.Filter.Where(mamm => mamm.MetroAreaId.Equals(metroId));
                        var mammCursor = await _metroAreaMarketMaps.FindAsync<MetroAreaMarketMap>(mammFilter);
                        MetroAreaMarketMap mamMap = await mammCursor.FirstOrDefaultAsync<MetroAreaMarketMap>();
                        if (tempCt == 1)
                        {
                            filterDefinition &= Builders<StationSummary>.Filter.Where(ss =>
                                ss.Market.ToLower().Contains(maSummary.Name.ToLower()) &&
                                ss.State.Equals(maSummary.State) &&
                                ss.Country.Equals(maSummary.Country));
                            filterDefinition |= Builders<StationSummary>.Filter.In(ss => ss.Market, mamMap.aliases);
                            filterDefinition &= Builders<StationSummary>.Filter.Where(ss =>
                                ss.State.Equals(maSummary.State) &&
                                ss.Country.Equals(maSummary.Country));
                            tempCt++;
                        }
                        else
                        {
                            filterDefinition |= Builders<StationSummary>.Filter.Where(
                                ss => ss.Market.ToLower().Contains(maSummary.Name.ToLower()) &&
                                ss.State.Equals(maSummary.State) &&
                                ss.Country.Equals(maSummary.Country));
                            filterDefinition |= Builders<StationSummary>.Filter.In(ss => ss.Market, mamMap.aliases);
                            filterDefinition &= Builders<StationSummary>.Filter.Where(ss =>
                                ss.State.Equals(maSummary.State) &&
                                ss.Country.Equals(maSummary.Country));
                        }
                    }

                    var cursorIn = await _stationSummaries.FindAsync<StationSummary>(filterDefinition);

                    ssList = cursorIn.ToList();
                }
                else
                {
                    return NotFound(new ErrorModel("Invalid input", "Invalid input", 404));// "No event exists for eventId " + eventId);
                }
                return Ok(ssList);
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        // Search Radio stations by Market area name
        //[HttpGet()]
        //[Route("/api/v1/stations/searchByMarket/{searchStr}")]
        //public async Task<IActionResult> searchByMarket(string searchStr)
        //{
        //    try
        //    {
        //        //List<StationSummary> ssList = new List<StationSummary>();
        //        List<string> ssList = new List<string>();
        //        if (searchStr != null)
        //        {
        //            var filterDefinition = Builders<StationSummary>.Filter.Where(ss => ss.Market.ToLower().Contains(searchStr.ToLower()));
        //            //var cursorIn = await _stationSummaries.FindAsync<StationSummary>(filterDefinition);
        //            var cursorIn = await _stationSummaries.DistinctAsync<string>("Market", filterDefinition);
        //            ssList = cursorIn.ToList();
        //        }
        //        else
        //        {
        //            return NotFound(new ErrorModel("Invalid input", "Invalid input", 404));// "No event exists for eventId " + eventId);
        //        }
        //        return Ok(ssList);
        //    }
        //    catch (Exception e)
        //    {
        //        Console.WriteLine("{0} Exception caught.", e);
        //        return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
        //    }
        //}

        //  Search Radio stations by Market area name
        [HttpGet()]
        [Route("/api/v1/stations/searchByMarketAndOwner/{market}/{owner}")]
        public async Task<IActionResult> searchByMarketAndOwner(string market, string owner)
        {
            try
            {
                IEnumerable<StationSummary> sL = new List<StationSummary>();

                var filterDefinition = Builders<StationSummary>.Filter.Empty;
                if (!string.IsNullOrEmpty(market))
                {
                    filterDefinition &= Builders<StationSummary>.Filter.Where(ss => ss.Market.ToLower().Contains(market.ToLower()));
                }

                if (!string.IsNullOrEmpty(owner))
                {
                    filterDefinition &= Builders<StationSummary>.Filter.Where(ss => ss.Owner.ToLower().Contains(owner.ToLower()));
                }
                var cursor = await _stationSummaries.FindAsync<StationSummary>(filterDefinition);//, options);

                List<StationSummary> asList = await cursor.ToListAsync<StationSummary>();
                foreach (StationSummary ss in asList)
                {
                    if (ss.Market != null)
                    {
                        string[] lowerCaseMarket = ss.Market.ToLower().Split(',');
                        var filterMAS = Builders<MetroAreaSummary>.Filter.Where(mas => mas.Name.ToLower().Contains(lowerCaseMarket[0]));
                        var cursorMAS = await _metroAreaSummaries.FindAsync<MetroAreaSummary>(filterMAS);//, options);
                        MetroAreaSummary maSummary = await cursorMAS.FirstOrDefaultAsync<MetroAreaSummary>();
                        if (maSummary != null)
                        {
                            ss.MetroAreaId = maSummary.Id;
                        }
                    }
                }
                sL = asList;
                return Ok(sL);
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        [HttpGet()]
        [Route("/api/v1/metroareas/searchByName/{searchStr}/{pageNumber?}/{pageSize?}")]
        public async Task<IActionResult> searchByMetroArea(string searchStr, int pageNumber = 1, int pageSize = 10)
        {
            try
            {

                List<MetroAreaSummary> ssList = new List<MetroAreaSummary>();
                if (searchStr != null)
                {
                    var filterDefinition = Builders<MetroAreaSummary>.Filter.Where(mas => mas.Name.ToLower().Contains(searchStr.ToLower()));

                    var options = new FindOptions<MetroAreaSummary, MetroAreaSummary>
                    {
                        Limit = pageSize,
                        Skip = (pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0)

                    };
                    var cursorIn = await _metroAreaSummaries.FindAsync<MetroAreaSummary>(filterDefinition, options);
                    //var cursorIn = await _stationSummaries.DistinctAsync<string>("Market", filterDefinition);
                    ssList = cursorIn.ToList();
                }
                else
                {
                    return NotFound(new ErrorModel("Invalid input", "Invalid input", 404));// "No event exists for eventId " + eventId);
                }
                return Ok(ssList);
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        [HttpGet()]
        [Route("/api/v1/metroareas/defineMarketMap")]
        public async Task<IActionResult> DefineMetroAreaMarketMap()
        {
            try
            {
                List<MetroAreaSummary> ssList = new List<MetroAreaSummary>();
                var cursorIn = await _metroAreaSummaries.FindAsync<MetroAreaSummary>(new BsonDocument());
                foreach (MetroAreaSummary mas in cursorIn.ToList())
                {
                    MetroAreaMarketMap mamm = new MetroAreaMarketMap();
                    mamm.MetroAreaId = mas.Id;
                    mamm.Name = mas.Name;
                    await _metroAreaMarketMaps.InsertOneAsync(mamm);
                }
                return Ok();
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        [HttpGet()]
        [Route("/api/v1/metroareas/getById/{id}")]
        public async Task<IActionResult> getMetroAreaById(string id)
        {
            try
            {
                var filterDefinition = Builders<MetroArea>.Filter.Where(ma => ma.Id.Equals(ObjectId.Parse(id)));
                var cursorIn = await _metroAreas.FindAsync<MetroArea>(filterDefinition);
                //var cursorIn = await _stationSummaries.DistinctAsync<string>("Market", filterDefinition);
                return Ok(await cursorIn.FirstOrDefaultAsync<MetroArea>());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        // Get Radio stations by Metro Ids
        [HttpPost()]
        [Route("/api/v1/metroareas/getByIds")]
        public async Task<IActionResult> getByMetroAreaIds([FromBody] ObjectIdListReq MetroIdList)
        {
            try
            {
                //IEnumerable<UserSummary> usL = new List<UserSummary>();

                IEnumerable<MetroAreaSummary> maL = new List<MetroAreaSummary>();
                if (MetroIdList.Ids.Count > 0)
                {
                    List<ObjectId> maObjIdList = new List<ObjectId>();
                    foreach (string metroIdStr in MetroIdList.Ids)
                    {
                        maObjIdList.Add(ObjectId.Parse(metroIdStr));
                    }
                    var filterDefinition = Builders<MetroAreaSummary>.Filter.In(mas => mas.Id, maObjIdList);
                    var masCursor = await _metroAreaSummaries.FindAsync<MetroAreaSummary>(filterDefinition);
                    List<MetroAreaSummary> maList = masCursor.ToList();
                    maL = maList.OrderBy(item => maObjIdList.IndexOf(item.Id));
                }
                else
                {
                    return NotFound(new ErrorModel("Invalid input", "Invalid input", 404));// "No event exists for eventId " + eventId);
                }
                return Ok(maL);
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        // Get all markets 
        [HttpGet()]
        [Route("/api/v1/stations/getAllMarkets")]
        public async Task<IActionResult> GetAllMarkets()
        {
            try
            {
                var filter = Builders<StationSummary>.Sort.Ascending("Market");
                //var options = new FindOptions<StationSummary, StationSummary> {
                //                                            Sort = Builders<StationSummary>.Sort.Ascending(s => s.Market) };
                var cursor = await _stationSummaries.DistinctAsync<string>("Market", new BsonDocument());
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        // Get a Stations by name and Type
        [HttpGet()]
        [Route("/api/v1/stations/searchByName/{name}/{type?}/{pageNumber?}/{pageSize?}")]
        public async Task<IActionResult> GetByName(string name, string type = "FM", int pageNumber = 1, int pageSize = 10)
        {
            try
            {

                string lowerCaseName = name.ToLower();
                string lowerCaseType = type.ToLower();

                var filterDefinition = Builders<StationSummary>.Filter.Empty; // new BsonDocument()
                if (!string.IsNullOrEmpty(lowerCaseName))
                {
                    filterDefinition &=
                         Builders<StationSummary>.Filter.Where(s => s.Name.ToLower().Contains(lowerCaseName));
                }

                if (!string.IsNullOrEmpty(lowerCaseType))
                {
                    filterDefinition &=
                         Builders<StationSummary>.Filter.Where(s => s.SType.ToLower().Contains(lowerCaseType));
                }

                var options = new FindOptions<StationSummary, StationSummary>
                {
                    Limit = pageSize,
                    Skip = (pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0),
                    Sort = Builders<StationSummary>.Sort.Ascending(s => s.Name)
                };
                List<StationNameSearchModel> stationNSMList = new List<StationNameSearchModel>();

                var cursor = await _stationSummaries.FindAsync<StationSummary>(filterDefinition, options);

                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        // Get a Stations by name and Type
        [AllowAnonymous]
        [HttpGet()]
        [Route("/api/v1/stations/searchbycallcode/{callcode}/{pageNumber?}/{pageSize?}")]
        public async Task<IActionResult> GetByCallcode(string callcode, string type = "FM", int pageNumber = 1, int pageSize = 10)
        {
            try
            {

                string lowerCaseName = callcode.ToLower();
                string lowerCaseType = type.ToLower();

                var filterDefinition = Builders<StationSummary>.Filter.Empty;
                if (!string.IsNullOrEmpty(lowerCaseName))
                {
                    filterDefinition &=
                         Builders<StationSummary>.Filter.Where(s => s.Callcode.ToLower().Contains(lowerCaseName));
                }

                if (!string.IsNullOrEmpty(lowerCaseType))
                {
                    filterDefinition &=
                         Builders<StationSummary>.Filter.Where(s => s.SType.ToLower().Contains(lowerCaseType));
                }

                //  var options = new FindOptions<StationSummary, StationSummary>
                // {

                // Sort = Builders<StationSummary>.Sort.Ascending(s => s.Name)
                //  };

                FindOptions<StationSummary> options = new FindOptions<StationSummary> { Limit = pageSize, Skip = (pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0) };

                var cursor = await _stationSummaries.FindAsync<StationSummary>(filterDefinition, options);

                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        //[HttpPost()]
        //[Route("/api/v1/stations/search")]
        //public async Task<IActionResult> Post([FromBody] StationViewModel viewModel)
        //{
        //    try
        //    {
        //        StationFilter filter = getStationFilter(viewModel);
        //        var cursor = await _stations.FindAsync<Station>(filter.ToFilterDefinition());
        //        return Ok(cursor.ToList());
        //    }
        //    catch (Exception e)
        //    {
        //        Console.WriteLine("{0} Exception caught.", e);
        //        return NotFound();
        //    }
        //}

        [HttpPost()]
        [Route("/api/v1/stations/getByIds/{isIncludeInvitationDetail?}")]
        public async Task<IActionResult> GetByIds([FromBody] ObjectIdListReq idsReq, bool isIncludeInvitationDetail = false)
        {
            try
            {
                IEnumerable<StationSummary> sL = new List<StationSummary>();
                if (idsReq.Ids.Count > 0)
                {

                    List<ObjectId> objIdList = new List<ObjectId>();
                    foreach (string id in idsReq.Ids)
                    {
                        objIdList.Add(ObjectId.Parse(id));
                    }

                    var filterDefinition = Builders<StationSummary>.Filter.In<ObjectId>(us => us.Id, objIdList);
                    var cursor = await _stationSummaries.FindAsync<StationSummary>(filterDefinition);//, options);

                    List<StationSummary> asList = await cursor.ToListAsync<StationSummary>();
                    foreach (StationSummary ss in asList)
                    {
                        if (ss.Market != null)
                        {
                            string[] lowerCaseMarket = ss.Market.ToLower().Split(',');
                            var filterMAS = Builders<MetroAreaSummary>.Filter.Where(mas => mas.Name.ToLower().Contains(lowerCaseMarket[0]));
                            var cursorMAS = await _metroAreaSummaries.FindAsync<MetroAreaSummary>(filterMAS);//, options);
                            MetroAreaSummary maSummary = await cursorMAS.FirstOrDefaultAsync<MetroAreaSummary>();
                            if (maSummary != null)
                            {
                                ss.MetroAreaId = maSummary.Id;
                            }
                        }

                        // include company invite detil to list
                        if (isIncludeInvitationDetail)
                        {
                            var inviteDetail = await GetInvitationDetail(ss.Owner);
                            ss.CompanyId = inviteDetail.CompanyId;
                            ss.IsShowInviteLink = inviteDetail.IsSentInviation;
                            ss.CompanyAdmin = inviteDetail.CompanyAdmin;
                        }
                    }


                    sL = asList.OrderBy(item => objIdList.IndexOf(item.Id));
                }
                return Ok(sL);
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        [HttpGet()]
        [Route("/api/v1/stations/{id}/images/{imageSize?}/{owner?}")]
        public async Task<ActionResult> GetImage(string id, string imageSize = "normal", string owner = "")
        {
            try
            {
                ObjectId StationId = ObjectId.Parse(id);
                var filterMain = Builders<StationImage>.Filter.Eq(si => si.StationId, StationId);

                var cursor = await _stationImages.FindAsync<StationImage>(filterMain);

                FileContentResult result = null;// new FileContentResult(FileUtil.readFile(_rootPath + "/images/DefaultStation.png"), "image/png");

                StationImage aiResult = cursor.ToList<StationImage>().FirstOrDefault<StationImage>();
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
                    var filterStationSummary = Builders<StationSummary>.Filter.Eq(si => si.Id, StationId);

                    var cursorSS = await _stationSummaries.FindAsync<StationSummary>(filterStationSummary);
                    StationSummary ss = await cursorSS.FirstOrDefaultAsync<StationSummary>();

                    string imageType = "Radio";
                    switch (ss.SType)
                    {
                        case "FM":
                            imageType = "Radio";
                            break;
                        case "Digital":
                            imageType = "Digital";
                            break;
                        default:
                            imageType = "Radio";
                            break;
                    }

                    string fileName = "/images/" + imageType + "-50.png";

                    // set image type according to owner

                    switch (owner.ToLower())
                    {
                        case "music choice":
                            imageType = "Music-Choice";
                            break;
                        case "viacom":
                            imageType = "MTV";
                            break;
                        case "siriusxm":
                            imageType = "sirius";
                            break;
                    }

                    switch (imageSize)
                    {
                        case "small":

                            fileName = "/images/" + imageType + "-31.png";
                            break;
                        case "large":
                            fileName = "/images/" + imageType + "-140.png";
                            break;
                        case "huge":
                            fileName = "/images/" + imageType + "-300.png";
                            break;
                        case "normal":
                            fileName = "/images/" + imageType + "-50.png";
                            break;
                    }

                    result = new FileContentResult(FileUtil.readFile(_rootPath + fileName), "image/png");
                }

                return result;
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }



        private StationFilter getStationFilter(StationViewModel viewModel)
        {
            StationFilter filter = new StationFilter();

            if (!string.IsNullOrEmpty(viewModel.Id))
            {
                filter.Id = ObjectId.Parse(viewModel.Id);
            }

            if (!string.IsNullOrEmpty(viewModel.Name))
            {
                filter.Name = viewModel.Name;
            }
            if (viewModel.Rank.HasValue)
            {
                filter.Rank = viewModel.Rank;
            }
            if (!string.IsNullOrEmpty(viewModel.Callcode))
            {
                filter.Callcode = viewModel.Callcode;
            }
            if (!string.IsNullOrEmpty(viewModel.SType))
            {
                filter.SType = viewModel.SType;
            }

            if (!string.IsNullOrEmpty(viewModel.Market))
            {
                filter.Market = viewModel.Market;
            }
            if (!string.IsNullOrEmpty(viewModel.Group))
            {
                filter.Group = viewModel.Group;
            }

            if (!string.IsNullOrEmpty(viewModel.ContactInfo))
            {
                filter.ContactInfo = viewModel.ContactInfo;
            }
            if (!string.IsNullOrEmpty(viewModel.Frequency))
            {
                filter.Frequency = viewModel.Frequency;
            }
            if (!string.IsNullOrEmpty(viewModel.Format))
            {
                filter.Format = viewModel.Format;
            }
            if (!string.IsNullOrEmpty(viewModel.Owner))
            {
                filter.Owner = viewModel.Owner;
            }
            if (!string.IsNullOrEmpty(viewModel.AQH))
            {
                filter.AQH = viewModel.AQH;
            }

            if (!string.IsNullOrEmpty(viewModel.Phone))
            {
                filter.Phone = viewModel.Phone;
            }

            if (!string.IsNullOrEmpty(viewModel.Alias))
            {
                filter.Alias = viewModel.Alias;
            }


            return filter;
        }

        [HttpGet()]
        [Route("/api/v1/stations/getById/{Id}")]
        public async Task<IActionResult> Get(string Id)
        {
            try
            {
                StationFilter filter = new StationFilter();
                filter.Id = ObjectId.Parse(Id);

                var cursor = await _stations.FindAsync<Station>(filter.ToFilterDefinition());
                return Ok(await cursor.FirstOrDefaultAsync<Station>());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }


        [NonAction]
        private async Task<DigitalInvite> GetInvitationDetail(string companyName)
        {
            DigitalInvite inviteInfo = new DigitalInvite();
            try
            {
                if (!string.IsNullOrEmpty(companyName))
                {
                    // Check for station owner company
                    var companyFilter = Builders<Company>.Filter.Where(cs => cs.Name.ToLower() == companyName.ToLower());
                    companyFilter |= Builders<Company>.Filter.Where(cs => cs.OtherNames.Contains(companyName));

                    var cursor = await _companies.FindAsync<Company>(companyFilter);
                    var company = cursor.FirstOrDefault<Company>();

                    inviteInfo.CompanyId = company.Id;
                    inviteInfo.IsSentInviation = !company.HasApiKeySent;

                    // if no company found or already invitation has been sent
                    if (company == null || company.HasApiKeySent)
                    {
                        return inviteInfo;
                    }

                    // find company default admin
                    if (company.Admins.Count > 0)
                    {
                        var userFilter = Builders<User>.Filter.Where(u => u.Id.Equals(company.Admins[0]));
                        var userCursor = await _users.FindAsync<User>(userFilter);
                        var userDetail = userCursor.FirstOrDefault<User>();

                        if (userDetail != null)
                        {
                            inviteInfo.CompanyAdmin = userDetail;
                        }
                    }

                    return inviteInfo;
                }

                inviteInfo.IsSentInviation = false;
                return inviteInfo;
            }

            catch (Exception ex)
            {
                inviteInfo.IsSentInviation = false;
                return inviteInfo;
            }
        }


    }
}
