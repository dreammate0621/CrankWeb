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
using MongoDB.Driver.GeoJsonObjectModel;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CrankService.Controllers
{
    [Authorize]
    public class EventController : Controller
    {
        CrankdataContext _eventsContext = null;// new CrankdataContext();
        IMongoCollection<Event> _events = null;
        IMongoCollection<EventSummary> _eventSummaries = null;
        IMongoCollection<Venue> _venues = null;
        IMongoCollection<VenueSummary> _venueSummaries = null;
        IMongoCollection<EventExtras> _eventExtras = null;
        IMongoCollection<UserDetail> _userDetails = null;
        IMongoCollection<VenueImage> _venueImages = null;
        private readonly IHostingEnvironment _hostingEnvironment;
        //private MongoDBConfig _mongoDBConfig { get; }
        private Configuration _configuration { get; }
        string _rootPath;

        public EventController(IOptions<Configuration> settings, IHostingEnvironment hostingEnvironment)
        {
            _hostingEnvironment = hostingEnvironment;
            _rootPath = _hostingEnvironment.WebRootPath;
            _configuration = settings.Value;
            _eventsContext = new CrankdataContext(_configuration.MongoDB.ConnectionString, _configuration.MongoDB.Database);
            _events = _eventsContext.Events;
            _eventSummaries = _eventsContext.EventSummaries;
            _venues = _eventsContext.Venues;
            _venueSummaries = _eventsContext.VenueSummaries;
            _eventExtras = _eventsContext.EventExtras;
            _userDetails = _eventsContext.UserDetails;
            _venueImages = _eventsContext.VenueImages;
        }


        [HttpGet()]
        [Route("/api/v1/events/{pageNumber?}/{pageSize?}")]
        public async Task<IActionResult> GetByPageNumber(int pageNumber, int pageSize=20)

        {
          
            FindOptions<EventSummary> options = new FindOptions<EventSummary> { Limit = pageSize, Skip = (pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0) };
            try
            {
                var cursor = await _eventSummaries.FindAsync<EventSummary>(new BsonDocument(), options);
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }

        }

        [HttpGet()]
        [Route("/api/v1/venues")]
        public async Task<IActionResult> GetVenuesByPageNumber(int pageNumber=1, int pageSize = 20)

        {
            
            FindOptions<VenueSummary> options = new FindOptions<VenueSummary> { Limit = pageSize, Skip = (pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0) };
            try
            {
                var cursor = await _venueSummaries.FindAsync<VenueSummary>(new BsonDocument(), options);
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        [HttpGet()]
        [Route("/api/v1/venues/{id}/images/{imageSize?}")]
        public async Task<ActionResult> GetVenueImage(string id, string imageSize = "normal")
        {
            try
            {
                ObjectId VenueId = ObjectId.Parse(id);
                var filterSub = Builders<ImageThumbnail>.Filter.Where(i => i.Size.Equals(imageSize));
                var filterMain = Builders<VenueImage>.Filter.Eq(vi => vi.VenueId, VenueId);

                var projection = Builders<VenueImage>.Projection
                    .Include(vi => vi.VenueId)
                    .ElemMatch(vi => vi.Images, filterSub);

                var options = new FindOptions<VenueImage, VenueImage> { Projection = projection };
                var cursor = await _venueImages.FindAsync<VenueImage>(filterMain, options);

                FileContentResult result = null;

                VenueImage viResult = cursor.ToList<VenueImage>().FirstOrDefault<VenueImage>();
                if (viResult != null && viResult.Images != null && viResult.Images.Count > 0)
                {
                    byte[] imgData = viResult.Images[0].data;
                    if (imgData != null && imgData.Length > 200)
                    {
                        result = new FileContentResult(imgData, "image/png");
                    }
                }
                // Result still null
                if (result == null)
                {
                    string fileName = "";
                    //switch (imageSize)
                    //{
                    //    case "small":
                    //        fileName = "/images/Venue-31.png";
                    //        break;
                    //    case "large":
                    //        fileName = "/images/Venue-140.png";
                    //        break;
                    //    case "huge":
                    //        fileName = "/images/Venue-300.png";
                    //        break;
                    //    case "normal":
                    //        fileName = "/images/Venue-50.png";
                    //        break;
                    //}
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

        [HttpPost()]
        [Route("/api/v1/venues/{id}/uploadImage/{imageSize?}")]
        public async Task<ActionResult> UploadImage(string id, string imageSize = "normal")
        {

            byte[] fileData = null;
            try
            {
                if (Request.Form.Files[0] != null)
                {
                    Stream stream = Request.Form.Files[0].OpenReadStream();
                    var binaryReader = new BinaryReader(stream);
                    fileData = binaryReader.ReadBytes((int)stream.Length);
                    VenueImage newUImage = new VenueImage();
                    newUImage.VenueId = ObjectId.Parse(id);
                    ImageThumbnail itNail = new ImageThumbnail();
                    itNail.data = fileData;
                    itNail.Source = "Uploaded";
                    itNail.Size = imageSize;
                    itNail.LastLoaded = DateTime.Now;
                    newUImage.Images.Add(itNail);


                    // Check if Venue image already exists
                    ObjectId VenueId = ObjectId.Parse(id);
                    var filter = Builders<VenueImage>.Filter.Where(ci => ci.VenueId.Equals(VenueId));
                    var findCursor = await _venueImages.FindAsync<VenueImage>(filter);
                    VenueImage ui = findCursor.FirstOrDefault<VenueImage>();
                    if (ui != null)
                    {
                        for (int i = 0; i < ui.Images.Count; i++)
                        {
                            if (ui.Images[i] != null && ui.Images[i].Size.Equals(imageSize))
                            {
                                ui.Images[i] = itNail;
                            }
                        }
                        var result = await _venueImages.ReplaceOneAsync(filter, ui);
                        return Ok(ui);
                    }
                    else
                    {
                        await _venueImages.InsertOneAsync(newUImage);
                        // Created new Image
                        return StatusCode(201, "Added new image");
                    }
                }
                else
                {
                    // Return, invalid input
                    return BadRequest(new ErrorModel("There is no file to upload", "There is no file to upload", 400)); //StatusCode(400, "Invalid input");
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                // 500, internal server error
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));// StatusCode(500, e.Message);
            }
        }


        [HttpPost()]
        [Route("/api/v1/events/getByIds")]
        public async Task<IActionResult> GetEventsByIds([FromBody] ObjectIdListReq idsReq)
        {
            try
            {
                IEnumerable<EventSummary> sL = new List<EventSummary>();
                if (idsReq.Ids.Count > 0)
                {

                    List<ObjectId> objIdList = new List<ObjectId>();
                    foreach (string id in idsReq.Ids)
                    {
                        objIdList.Add(ObjectId.Parse(id));
                    }

                    var filterDefinition = Builders<EventSummary>.Filter.In<ObjectId>(us => us.Id, objIdList);
                    var cursor = await _eventSummaries.FindAsync<EventSummary>(filterDefinition);//, options);

                    List<EventSummary> asList = await cursor.ToListAsync<EventSummary>();
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

        [HttpPost()]
        [Route("/api/v1/venues/getByIds")]
        public async Task<IActionResult> GetVenuesByIds([FromBody] ObjectIdListReq idsReq)
        {
            try
            {
                IEnumerable<VenueSummary> sL = new List<VenueSummary>();
                if (idsReq.Ids.Count > 0)
                {

                    List<ObjectId> objIdList = new List<ObjectId>();
                    foreach (string id in idsReq.Ids)
                    {
                        objIdList.Add(ObjectId.Parse(id));
                    }

                    var filterDefinition = Builders<VenueSummary>.Filter.In<ObjectId>(us => us.Id, objIdList);
                    var cursor = await _venueSummaries.FindAsync<VenueSummary>(filterDefinition);//, options);

                    List<VenueSummary> asList = await cursor.ToListAsync<VenueSummary>();
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

        // Get Event Summeries for given artists
        [HttpPost()]
        [Route("/api/v1/events/getEventsOfArtists")]
        public async Task<IActionResult> GetEventSummariesForGivenArtists([FromBody] List<string> artistList)
        {
            try
            {
                // Get Event Summaries for all artists in ascending order of date
                if (artistList != null && artistList.Count > 0)
                {
                    var filterPerformance = Builders<PerformanceSummary>.Filter.Empty;
                    int tempCt = 1;
                    foreach (string artistIdStr in artistList)
                    {
                        ObjectId artistId = ObjectId.Parse(artistIdStr);
                        if (tempCt == 1)
                        {
                            filterPerformance &= Builders<PerformanceSummary>.Filter.Where(p => p.ArtistId.Equals(artistId));
                            tempCt++;
                        }
                        else
                        {
                            filterPerformance |= Builders<PerformanceSummary>.Filter.Where(p => p.ArtistId.Equals(artistId));
                        }

                    }
                    var filterEvent = Builders<EventSummary>.Filter.Where(e => e.StartDate.HasValue && e.StartDate > DateTime.Now);
                    filterEvent &= Builders<EventSummary>.Filter.ElemMatch<PerformanceSummary>(e => e.Performance, filterPerformance);

                    var options = new FindOptions<EventSummary, EventSummary> { Sort = Builders<EventSummary>.Sort.Ascending(e => e.StartDate) };
                    var cursorSub = await _eventSummaries.FindAsync<EventSummary>(filterEvent, options);
                    List<EventSummary> eventList = cursorSub.ToList<EventSummary>();
                    return Ok(eventList);
                }
                else
                {
                    return BadRequest(new ErrorModel("Artist List Empty", "Artist List Empty", 400));// 
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));
            }

        }

        [HttpPost()]
        [Route("/api/v1/events/search")]
        public async Task<IActionResult> Post([FromBody] EventViewModel viewModel)
        {
            try
            {
                EventFilter filter = getEventFilter(viewModel);
                var cursor = await _events.FindAsync<Event>(filter.ToFilterDefinition());
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace));
            }
        }
        private EventFilter getEventFilter(EventViewModel viewModel)
        {
            EventFilter filter = new EventFilter();

            if (!string.IsNullOrEmpty(viewModel.Id))
            {
                filter.Id = ObjectId.Parse(viewModel.Id);
            }

            if (!string.IsNullOrEmpty(viewModel.Name))
            {
                filter.Name = viewModel.Name;
            }
            if (!string.IsNullOrEmpty(viewModel.EventType))
            {
                filter.EventType = viewModel.EventType;
            }
            if (viewModel.Popularity.HasValue)
            {
                filter.Popularity = viewModel.Popularity;
            }

            if (!string.IsNullOrEmpty(viewModel.AgeRestriction))
            {
                filter.AgeRestriction = viewModel.AgeRestriction;
            }
            if (!string.IsNullOrEmpty(viewModel.City))
            {
                filter.City = viewModel.City;
            }
            return filter;
        }

        [HttpGet()]
        [Route("/api/v1/events/getById/{Id}")]
        public async Task<IActionResult> Get(string Id)
        {
            try
            {
                EventFilter filter = new EventFilter();
                filter.Id = ObjectId.Parse(Id);

                var cursor = await _events.FindAsync<Event>(filter.ToFilterDefinition());
                return Ok(await cursor.FirstOrDefaultAsync<Event>());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        [HttpGet()]
        [Route("/api/v1/venues/getById/{Id}")]
        public async Task<IActionResult> GetVenueById(string Id)
        {
            try
            {
                var filterVenue = Builders<VenueSummary>.Filter.Where(vs => vs.Id.Equals(ObjectId.Parse(Id)));

                var cursor = await _venueSummaries.FindAsync<VenueSummary>(filterVenue);
                return Ok(await cursor.FirstOrDefaultAsync<VenueSummary>());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        [HttpGet()]
        [Route("/api/v1/events/{id}/extras/{pageNumber?}")]
        public async Task<IActionResult> GetEventExtrasByEventId(string id, int pageNumber = 1)

        {
            ObjectId eventId = ObjectId.Parse(id);
            //int pageSize = 20;
            var filter = Builders<EventExtras>.Filter.Where(ee => ee.EventId.Equals(eventId));
            //FindOptions<EventExtras> options = new FindOptions<EventExtras> { Limit = pageSize, Skip = (pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0) };
            try
            {
                var cursor = await _eventExtras.FindAsync<EventExtras>(filter);//, options);
                return Ok(cursor.FirstOrDefault<EventExtras>());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }

        }

        [HttpGet()]
        [Route("/api/v1/events/extras/{pageNumber?}/{pageSize?}")]
        public async Task<IActionResult> GetEventExtras(string id, int pageNumber = 1, int pageSize = 20)

        {
            //ObjectId eventId = ObjectId.Parse(id);
      
            //var filter = Builders<EventExtras>.Filter.Where(ee => ee.EventId.Equals(eventId));
            FindOptions<EventExtras> options = new FindOptions<EventExtras> { Limit = pageSize, Skip = (pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0) };
            try
            {
                var cursor = await _eventExtras.FindAsync<EventExtras>(new BsonDocument(), options);
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }

        }
        [HttpPost()]
        [Route("/api/v1/events/extras")]
        public async Task<IActionResult> CreateEventExtras([FromBody] EventExtrasViewModel eevModel)
        {
            try
            {
                ObjectId eventId = ObjectId.Parse(eevModel.EventId);
                var filter = Builders<EventExtras>.Filter.Where(ee => ee.EventId.Equals(eventId));
                var findCursor = await _eventExtras.FindAsync<EventExtras>(filter);
                if (findCursor.Any<EventExtras>())
                {
                    // EventExtras already exist
                    // I canuse 422 Unprocessable Entity or 409 Conflict or 403 forbidden. But will use 409 for now
                    Console.WriteLine("Event Extras already exists for id " + eevModel.Id);
                    return StatusCode(409);
                }
                EventExtras insertEE = GetEventExtras(eevModel, false);
                await _eventExtras.InsertOneAsync(insertEE);
                // Created new EventExtras
                return StatusCode(201, insertEE);
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                // 500, internal server error
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));// StatusCode(500, e.Message);
            }
        }

        [HttpPut()]
        [Route("/api/v1/events/extras")]
        // Update user 
        public async Task<IActionResult> UpdateEventExtras([FromBody] EventExtrasViewModel eevModel)
        {

            try
            {
                ObjectId Id = ObjectId.Parse(eevModel.Id);
                var filter = Builders<EventExtras>.Filter.Where(ee => ee.Id.Equals(Id));
                var findCursor = await _eventExtras.FindAsync<EventExtras>(filter);
                EventExtras foundEE = await findCursor.FirstOrDefaultAsync<EventExtras>();
                if (foundEE != null)
                {
                    EventExtras updateEE = GetEventExtras(eevModel, true);
                    updateEE.Id = foundEE.Id;
                    var result = await _eventExtras.ReplaceOneAsync(filter, updateEE);
                    return Ok();
                }
                else
                {
                    // User does not exist for update. 404 Not Found
                    return NotFound(new ErrorModel("No user exists to update", "No user exists to update", 404));// return StatusCode(404);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                // 500, internal server error
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));// StatusCode(500, e.Message);
            }
        }

        private EventExtras GetEventExtras(EventExtrasViewModel eevModel, bool isUpdate)
        {
            EventExtras ee = new EventExtras();

            if (isUpdate)
            {
                //ee = foundEE;
                ee.Id = ObjectId.Parse(eevModel.Id);
            }
            ee.EventId = ObjectId.Parse(eevModel.EventId);

            //ee.SubMarkets = new List<ObjectId>();
            //if (eevModel.SubMarkets != null) {
            //    foreach(string marketStr in eevModel.SubMarkets) {
            //        ee.SubMarkets.Add(ObjectId.Parse(marketStr));
            //    }
            //}
            if (eevModel.Associations.Count > 0)
            {
                foreach (AssociationInfoViewModel avm in eevModel.Associations)
                {
                    AssociationInfo ai = new AssociationInfo();
                    ai.AssignedBy = ObjectId.Parse(avm.AssignedBy);
                    ai.AssignedTo = ObjectId.Parse(avm.AssignedTo);
                    ai.AssignedAs = avm.AssignedAs;
                    //if (!isUpdate)
                    //{
                    // There is an issue here about created date. Need to fix..TODO
                    //} 
                    if (avm.CreatedDate != null)
                    {
                        ai.CreatedDate = avm.CreatedDate;
                    }
                    else
                    {
                        ai.CreatedDate = DateTime.Now;
                    }
                    if (isUpdate)
                    {
                        ai.LastUpdatedDate = avm.LastUpdatedDate;
                    }
                    else
                    {
                        ai.LastUpdatedDate = DateTime.Now;
                    }
                    ee.Associations.Add(ai);
                }
            }

            if (eevModel.MarketPromotions != null && eevModel.MarketPromotions.Count > 0)
            {
                foreach (MarketPromotionInfoViewModel mpvm in eevModel.MarketPromotions)
                {
                    MarketPromotionInfo mpi = new MarketPromotionInfo();
                    if (mpvm.MetroAreaId != null)
                    {
                        mpi.MetroAreaId = ObjectId.Parse(mpvm.MetroAreaId);
                    }

                    if (mpvm.PromoStations != null && mpvm.PromoStations.Count > 0)
                    {
                        //List<PromoStationInfo> psList = new List<PromoStationInfo>();
                        foreach (PromoStationInfoViewModel psivm in mpvm.PromoStations)
                        {
                            PromoStationInfo psi = new PromoStationInfo();
                            if (psivm.StationId != null)
                            {
                                psi.StationId = ObjectId.Parse(psivm.StationId);

                            }
                            if (psivm.SelectedBy != null && psivm.SelectedBy.Count > 0)
                            {
                                psi.SelectedBy = new List<ObjectId>();
                                foreach (string stationStr in psivm.SelectedBy)
                                {
                                    psi.SelectedBy.Add(ObjectId.Parse(stationStr));
                                }
                            }
                            if (psivm.Promotions != null && psivm.Promotions.Count > 0)
                            {
                                psi.Promotions = new List<PromotionInfo>();
                                foreach (PromotionInfoViewModel pivm in psivm.Promotions)
                                {
                                    PromotionInfo pi = new PromotionInfo();
                                    pi.Type = pivm.Type;
                                    pi.PromoInstances = new List<PromotionInstanceInfo>();
                                    foreach (PromotionInstanceInfoViewModel piivm in pivm.PromoInstances)
                                    {
                                        PromotionInstanceInfo pii = new PromotionInstanceInfo();
                                        pii.TypeCount = piivm.TypeCount;
                                        pii.AssignedBy = ObjectId.Parse(piivm.AssignedBy);
                                        if (piivm.CreatedDate != null)
                                        {
                                            pii.CreatedDate = piivm.CreatedDate;
                                        }
                                        else
                                        {
                                            pii.CreatedDate = DateTime.Now;
                                        }
                                        if (!isUpdate)
                                        {
                                            pii.LastUpdatedDate = DateTime.Now;
                                        }
                                        else
                                        {
                                            pii.LastUpdatedDate = piivm.LastUpdatedDate;
                                        }
                                        pi.PromoInstances.Add(pii);
                                    }
                                    psi.Promotions.Add(pi);
                                }
                            }
                            mpi.PromoStations.Add(psi);
                        }
                        //mpi.PromoStations = psList;
                    }
                    ee.MarketPromotions.Add(mpi);
                }
            }

            //if (eevModel.SubMarkets != null && eevModel.SubMarkets.Count > 0)
            //{
            //    foreach (MarketInfoViewModel mvm in eevModel.SubMarkets)
            //    {
            //        MarketInfo mi = new MarketInfo();
            //        mi.MetroAreadId = ObjectId.Parse(mvm.MetroAreadId);
            //        mi.SelectedStations = new List<ObjectId>();
            //        foreach (string selStation in mvm.SelectedStations)
            //        {
            //            mi.SelectedStations.Add(ObjectId.Parse(selStation));
            //        }
            //        if (!isUpdate)
            //        {
            //            mi.CreatedDate = DateTime.Now;
            //        }
            //        mi.LastUpdatedDate = DateTime.Now;
            //        ee.SubMarkets.Add(mi);
            //    }
            //}
            return ee;
        }

        // Get a EventSummary by name
        [HttpGet()]
        [Route("/api/v1/events/searchByName/{name}")]
        public async Task<IActionResult> GetEventsByName(string name)
        {
            try
            {
                var filterDefinition = Builders<EventSummary>.Filter.Empty; // new BsonDocument()
                if (!string.IsNullOrEmpty(name))
                {
                    string lowerCaseName = name.ToLower();
                    filterDefinition &=
                         Builders<EventSummary>.Filter.Where(es => es.Name.ToLower().Contains(lowerCaseName));
                }
                var options = new FindOptions<EventSummary, EventSummary> { Sort = Builders<EventSummary>.Sort.Ascending(es => es.Name) };
                var cursor = await _eventSummaries.FindAsync<EventSummary>(filterDefinition, options);
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        // Get a VenueSummary by name
        [HttpGet()]
        [Route("/api/v1/venues/searchByName/{name}/{pageNumber?}/{pageSize?}")]
        public async Task<IActionResult> GetVenuesByName(string name, int pageNumber = 1, int pageSize = 10)
        {
            try
            {
            
                var filterDefinition = Builders<VenueSummary>.Filter.Empty; // new BsonDocument()
                if (!string.IsNullOrEmpty(name))
                {
                    string lowerCaseName = name.ToLower();
                    filterDefinition &=
                         Builders<VenueSummary>.Filter.Where(vs => vs.Name.ToLower().Contains(lowerCaseName));
                }
                var options = new FindOptions<VenueSummary, VenueSummary>
                {
                    Limit = pageSize,
                    Skip = (pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0),
                    Sort = Builders<VenueSummary>.Sort.Ascending(vs => vs.Name)
                };
                var cursor = await _venueSummaries.FindAsync<VenueSummary>(filterDefinition, options);
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        [HttpPost()]
        [Route("/api/v1/events")]
        public async Task<IActionResult> CreateEvent([FromBody] EventViewModel evModel)
        {
            try
            {
                await _events.InsertOneAsync(GetNewEvent(evModel));
                // Created new EventExtras
                return StatusCode(201);
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                // 500, internal server error
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));
            }
        }

        private Event GetNewEvent(EventViewModel eModel)
        {
            Event eventLocal = new Event();

            eventLocal.Name = eModel.Name;
            eventLocal.EventType = eModel.EventType;
            if (eModel.Popularity.HasValue)
            {
                eventLocal.Popularity = eModel.Popularity;
            }
            eventLocal.StartDate = DateTime.Parse(eModel.StartDate).Date;
            eventLocal.AgeRestriction = eModel.AgeRestriction;
            eventLocal.City = eModel.City;
            if (eModel.Lng.HasValue && eModel.Lat.HasValue)
            {
                eventLocal.LngLat = new GeoJson2DCoordinates(eModel.Lng.Value, eModel.Lat.Value);
            }
            if (eModel.EventVenue != null)
            {
                eventLocal.EventVenue = new Venue();
                eventLocal.EventVenue.Name = eModel.EventVenue.Name;
                eventLocal.EventVenue.Street = eModel.EventVenue.Street;
                if (eModel.EventVenue.Lng.HasValue && eModel.EventVenue.Lat.HasValue)
                {
                    eventLocal.EventVenue.LngLat = new GeoJson2DCoordinates(eModel.EventVenue.Lng.Value, eModel.EventVenue.Lat.Value);
                }
                eventLocal.EventVenue.Phone = eModel.EventVenue.Phone;
                eventLocal.EventVenue.Website = eModel.EventVenue.Website;
                eventLocal.EventVenue.City = eModel.EventVenue.City;
                eventLocal.EventVenue.State = eModel.EventVenue.State;
                eventLocal.EventVenue.Capacity = eModel.EventVenue.Capacity;
                eventLocal.EventVenue.Description = eModel.EventVenue.Description;
                if (eModel.EventVenue.MetroArea != null)
                {
                    eventLocal.EventVenue.MetroArea = new MetroArea();
                    eventLocal.EventVenue.MetroArea.Name = eModel.EventVenue.MetroArea.Name;
                    eventLocal.EventVenue.MetroArea.State = eModel.EventVenue.MetroArea.State;
                    eventLocal.EventVenue.MetroArea.Country = eModel.EventVenue.MetroArea.Country;
                }
            }
            if (eModel.Performance != null && eModel.Performance.Count > 0)
            {
                eventLocal.Performance = new List<Performance>();
                foreach (PerformanceViewModel pvm in eModel.Performance)
                {
                    Performance p = new Performance();
                    p.ArtistName = pvm.ArtistName;
                    p.Billing = pvm.Billing;
                    p.BillingIndex = pvm.BillingIndex;
                    eventLocal.Performance.Add(p);
                }
            }

            return eventLocal;
        }

        [HttpPut()]
        [Route("/api/v1/events")]
        // Update user 
        public async Task<IActionResult> UpdateEvent([FromBody] EventViewModel evModel)
        {

            try
            {
                ObjectId Id = ObjectId.Parse(evModel.Id);
                var filter = Builders<Event>.Filter.Where(ee => ee.Id.Equals(Id));
                var findCursor = await _events.FindAsync<Event>(filter);
                Event foundE = await findCursor.FirstOrDefaultAsync<Event>();
                if (foundE != null)
                {
                    Event updateE = getUpdatableEvent(evModel);
                    updateE.Id = foundE.Id;
                    var result = await _events.ReplaceOneAsync(filter, updateE);
                    return Ok();
                }
                else
                {
                    return StatusCode(404, new ErrorModel("Event does not exist", "Event does not exist", 404));
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                // 500, internal server error
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));// StatusCode(500, e.Message);
            }
        }

        private Event getUpdatableEvent(EventViewModel eModel)
        {
            Event eventLocal = new Event();
            eventLocal.Id = ObjectId.Parse(eModel.Id);
            eventLocal.Name = eModel.Name;
            eventLocal.EventType = eModel.EventType;
            if (eModel.Popularity.HasValue)
            {
                eventLocal.Popularity = eModel.Popularity;
            }
            eventLocal.StartDate = DateTime.Parse(eModel.StartDate).Date;
            eventLocal.AgeRestriction = eModel.AgeRestriction;
            eventLocal.City = eModel.City;
            if (eModel.Lng.HasValue && eModel.Lat.HasValue)
            {
                eventLocal.LngLat = new GeoJson2DCoordinates(eModel.Lng.Value, eModel.Lat.Value);
            }
            if (eModel.EventVenue != null)
            {

                eventLocal.EventVenue = new Venue();
                eventLocal.EventVenue.Id = ObjectId.Parse(eModel.EventVenue.Id);
                eventLocal.EventVenue.Name = eModel.EventVenue.Name;
                eventLocal.EventVenue.Street = eModel.EventVenue.Street;
                if (eModel.EventVenue.Lng.HasValue && eModel.EventVenue.Lat.HasValue)
                {
                    eventLocal.EventVenue.LngLat = new GeoJson2DCoordinates(eModel.EventVenue.Lng.Value, eModel.EventVenue.Lat.Value);
                }
                eventLocal.EventVenue.Phone = eModel.EventVenue.Phone;
                eventLocal.EventVenue.Website = eModel.EventVenue.Website;
                eventLocal.EventVenue.City = eModel.EventVenue.City;
                eventLocal.EventVenue.State = eModel.EventVenue.State;
                if (eModel.EventVenue.Capacity.HasValue)
                {
                    eventLocal.EventVenue.Capacity = eModel.EventVenue.Capacity.Value;

                }
                eventLocal.EventVenue.Description = eModel.EventVenue.Description;
                if (eModel.EventVenue.MetroArea != null)
                {
                    eventLocal.EventVenue.MetroArea = new MetroArea();
                    eventLocal.EventVenue.MetroArea.Id = ObjectId.Parse(eModel.EventVenue.MetroArea.Id);
                    eventLocal.EventVenue.MetroArea.Name = eModel.EventVenue.MetroArea.Name;
                    eventLocal.EventVenue.MetroArea.State = eModel.EventVenue.MetroArea.State;
                    eventLocal.EventVenue.MetroArea.Country = eModel.EventVenue.MetroArea.Country;
                }
            }
            if (eModel.Performance != null && eModel.Performance.Count > 0)
            {
                eventLocal.Performance = new List<Performance>();
                foreach (PerformanceViewModel pvm in eModel.Performance)
                {
                    Performance p = new Performance();
                    p.ArtistId = ObjectId.Parse(pvm.ArtistId);
                    p.ArtistName = pvm.ArtistName;
                    p.Billing = pvm.Billing;
                    p.BillingIndex = pvm.BillingIndex;
                    eventLocal.Performance.Add(p);
                }
            }

            return eventLocal;
        }
    }
}
