using Crankdata.Models;
using CrankService.Models;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CrankService.Utils;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using System.Security.Claims;
using Microsoft.AspNetCore.Http.Authentication;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Hosting;
using System.Configuration;
using CrankWeb.Models;
using Microsoft.Extensions.Options;
using System.Collections;
using System.Diagnostics;

namespace CrankService.Controllers
{
    [Authorize]
    public class UserController : Controller
    {
        CrankdataContext _crankContext = null;
        IMongoCollection<User> _users = null;
        IMongoCollection<UserDetail> _userDetails = null;
        IMongoCollection<UserSummary> _userSummaries = null;
        IMongoCollection<UserPwd> _userPwds = null;
        IMongoCollection<UserImage> _userImages = null;
        IMongoCollection<Invitation> _userInvitations = null;
        IMongoCollection<EventExtras> _eventExtras = null;
        IMongoCollection<EventSummary> _eventSummaries = null;
        IMongoCollection<Station> _stations = null;
        IMongoCollection<StationSummary> _stationSummaries = null;
        IMongoCollection<CompanySummary> _companySummaries = null;
        IMongoCollection<APIAccessKey> _apiAccessKeys = null;

        IMongoCollection<Company> _companies = null;
        private ObjectId _invalidObjId = ObjectId.Parse("000000000000000000000000");

        private readonly IHostingEnvironment _hostingEnvironment;
        //private MongoDBConfig _mongoDBConfig { get; }
        private Configuration _configuration { get; set; }
        string _rootPath;
        public UserController(IOptions<Configuration> settings, IHostingEnvironment hostingEnvironment)
        {
            _hostingEnvironment = hostingEnvironment;
            _configuration = settings.Value;
            _crankContext = new CrankdataContext(_configuration.MongoDB.ConnectionString, _configuration.MongoDB.Database);
            _rootPath = _hostingEnvironment.WebRootPath;
            _users = _crankContext.Users;
            _userDetails = _crankContext.UserDetails;
            _userSummaries = _crankContext.UserSummaries;
            _userPwds = _crankContext.UserPwds;
            _userImages = _crankContext.UserImages;
            _userInvitations = _crankContext.Invitations;
            _eventExtras = _crankContext.EventExtras;
            _eventSummaries = _crankContext.EventSummaries;
            _stations = _crankContext.Stations;
            _companySummaries = _crankContext.CompanySummaries;
            _stationSummaries = _crankContext.StationSummaries;
            _companies = _crankContext.Companies;
            _apiAccessKeys = _crankContext.APIAccessKeys;
        }

        public async Task<List<EventSummary>> GetMyAssignedEvents(UserDetail userFromDB)

        {
            List<EventSummary> returnList = new List<EventSummary>();
            var filterAI = Builders<AssociationInfo>.Filter.Where(ai => ai.AssignedTo.Equals(userFromDB.Id));
            var filterEE = Builders<EventExtras>.Filter.ElemMatch<AssociationInfo>(ee => ee.Associations, filterAI);

            var projection = Builders<EventExtras>.Projection
                .Include(ee => ee.EventId)
                .Exclude(ee => ee.Id);
            var options = new FindOptions<EventExtras, EventExtras> { Projection = projection };
            var cursor = await _eventExtras.FindAsync<EventExtras>(filterEE, options);
            List<EventExtras> eeList = await cursor.ToListAsync<EventExtras>();
            List<ObjectId> eventIdList = new List<ObjectId>();
            foreach (EventExtras ee in eeList)
            {
                eventIdList.Add(ee.EventId);
            }
            if (eventIdList.Count > 0)
            {

                var filterSub = Builders<PerformanceSummary>.Filter.Where(ps => ps.ArtistId != _invalidObjId);
                var projectionES = Builders<EventSummary>.Projection
                .Include(es => es.Id)
                .Include(es => es.Name)
                .Include(es => es.EventVenue)
                .Include(es => es.StartDate)
                .Include(es => es.City)
                .ElemMatch(es => es.Performance, filterSub);
                var optionsES = new FindOptions<EventSummary, EventSummary>
                {
                    Projection = projectionES,
                    Sort = Builders<EventSummary>.Sort.Ascending(e => e.StartDate)
                };

                var filterES = Builders<EventSummary>.Filter.In<ObjectId>(es => es.Id, eventIdList);
                filterES &= Builders<EventSummary>.Filter.Where(e => e.StartDate.HasValue && e.StartDate > DateTime.Today);

                var cursorES = await _eventSummaries.FindAsync<EventSummary>(filterES, optionsES);

                returnList = cursorES.ToList<EventSummary>();
            }

            return returnList;
        }

        [HttpGet()]
        [Route("/api/v1/users/getMyTeams")]
        public async Task<IActionResult> getMyTeams()

        {
            try
            {
                // Get Logged in user Id
                ClaimsPrincipal principal = HttpContext.User;
                string pid = principal.FindFirst("Id").Value;
                // Get Logged in user Id
                ObjectId usrObjId = ObjectId.Parse(pid);

                // Get Artists/Rosters of all teams I belong to
                var filterUsrDetail = Builders<UserDetail>.Filter.AnyEq<ObjectId>(ud => ud.Team, usrObjId);

                //var filterUsrDetail = Builders<UserDetail>.Filter.Where(ud => ud.Team.Contains(usrObjId));
                var projection = Builders<UserDetail>.Projection
                    .Include(ee => ee.Id);

                var options = new FindOptions<UserDetail, UserDetail> { Projection = projection };
                var cursorUD = await _userDetails.FindAsync<UserDetail>(filterUsrDetail, options);
                List<UserDetail> udList = await cursorUD.ToListAsync<UserDetail>();

                HashSet<ObjectId> userIds = new HashSet<ObjectId>();
                foreach (UserDetail ud in udList)
                {
                    userIds.Add(ud.Id);
                }
                return Ok(userIds);
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace));
            }
        }

        // Get Event Summaries of all the teams that I am part off and my own artists list
        [HttpGet()]
        [Route("/api/v1/users/getMyProfileEvents/{isIncludeWeeklyPromoHistory?}")]
        public async Task<IActionResult> GetMyProfileEvents(bool isIncludeWeeklyPromoHistory = false)
        {
            IEnumerable<EventSummary> finalESList = new List<EventSummary>();
            List<EventSummary> userEvents = new List<EventSummary>();
            try
            {
                // Get Logged in user Id
                ClaimsPrincipal principal = HttpContext.User;
                string pid = principal.FindFirst("Id").Value;
                // Get Logged in user Id
                ObjectId usrObjId = ObjectId.Parse(pid);

                // Get all artists Id for logged in user
                UserDetailFilter filter = new UserDetailFilter();
                filter.Id = usrObjId;
                var cursorMain = await _userDetails.FindAsync<UserDetail>(filter.ToFilterDefinition());
                UserDetail userFromDB = await cursorMain.FirstOrDefaultAsync<UserDetail>();

                // Get Events Assigned to this User
                List<EventSummary> assignedEvents = await GetMyAssignedEvents(userFromDB);

                if (userFromDB != null)
                {
                    switch (userFromDB.UserType)
                    {
                        case "artist_manager":
                            // Get Artist Manager Events
                            userEvents = await getArtistManagerEvents(userFromDB);
                            break;
                        case "label":
                            // Get Artist Manager Events
                            userEvents = await getArtistManagerEvents(userFromDB);
                            break;
                        case "radio_manager":
                            // Get Artist Manager Events
                            userEvents = await getRadioManagerEvents(userFromDB);
                            break;
                        case "promoter":

                            var artists = new List<ObjectId>();
                            var eventIds = new List<ObjectId>();

                            if (assignedEvents != null && assignedEvents.Count > 0)
                            {
                                // getting assigned event artistids

                                artists = assignedEvents.Select(e => e.Performance).Select(p => p[0].ArtistId).Distinct<ObjectId>().ToList();

                                // event Ids
                                eventIds = assignedEvents.Select(e => e.Id).ToList();
                            }

                            // Get promoter Manager Events
                            userEvents = await getPromoterEvents(userFromDB, artists, eventIds);
                            break;
                        case "agent":
                        default:
                            break;
                    }


                    // Get My Team Events
                    //  List<EventSummary> myTeamEvents = await getMyTeamEvents(userFromDB);

                    //  userEvents.AddRange(myTeamEvents);
                    // no need for promoter becuse its already included with promoter events
                    if (userFromDB.UserType != "promoter")
                    {
                        userEvents.AddRange(assignedEvents);
                    }

                    // Set edit able true for user  events 
                    userEvents.ForEach(e => e.isEditable = true);

                    finalESList = userEvents.Distinct<EventSummary>(new EventSummaryComparer<EventSummary>()).OrderBy(es => es.StartDate);

                    // getting  extra  with event
                    foreach (var item in finalESList)
                    {
                        await getEventExtra(item, isIncludeWeeklyPromoHistory);
                        // sum  of event all type promotions
                        if (isIncludeWeeklyPromoHistory)
                        {
                            var interViewCount = item.weeklyPromoHistory.Sum(p => p.InterviewPromotionCount);
                            var appearanceCount = item.weeklyPromoHistory.Sum(p => p.AppearancePromotionCount);
                            var metnGreetCount = item.weeklyPromoHistory.Sum(p => p.MeetnGreetPromotionCount);
                            var ticketCount = item.weeklyPromoHistory.Sum(p => p.TicketPromotionCount);
                            item.TotalPromotionCount = (interViewCount + appearanceCount + metnGreetCount + ticketCount);
                        }
                    }
                }
                return Ok(finalESList);
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace));
            }
        }

        private async Task getEventExtra(EventSummary eventObj, bool isIncludeWeeklyPromoHistory = false)
        {

            var filterExtra = Builders<EventExtras>.Filter.Where(ee => ee.EventId.Equals(eventObj.Id));

            try
            {
                var cursor = await _eventExtras.FindAsync<EventExtras>(filterExtra);
                var eventExtra = cursor.FirstOrDefault<EventExtras>();
                if (eventExtra != null)
                {
                    eventObj.Associations = eventExtra.Associations.Count().ToString();

                    if (isIncludeWeeklyPromoHistory)
                    {
                        // getting first happened promotion
                        var startingDate = getStartDateForFindHistory(eventExtra);
                        var firstSudayDate = new DateTime();
                        var weeks = new List<DateTime>();
                        if (startingDate != null)
                        {
                            // getting first sunday date after/before first promotion happened
                            firstSudayDate = findClosestSudayToStartedDate(startingDate.Value);
                            weeks = findWeeksBetweenTwoDates(firstSudayDate, eventObj.StartDate.Value);
                        }
                        // adding week to weekly promotion list
                        foreach (var week in weeks)
                        {
                            eventObj.weeklyPromoHistory.Add(new WeeklyPromotionHistory() { StartWeekDate = week });
                        }
                    }

                    //getting event promotions 
                    foreach (var promoMarket in eventExtra.MarketPromotions)
                    {
                        promoMarket.PromoStations.ForEach(ps =>
                       {
                           if (isIncludeWeeklyPromoHistory)
                           {
                               // getting weekly promotion
                               getWeeklyPromotionHistory(ps, eventObj);
                           }
                           eventObj.HasTicket = eventObj.HasTicket ? true : ps.Promotions.FirstOrDefault(p => p.Type.Equals("ticket")) == null ? false : true;
                           eventObj.HasMeetNGreet = eventObj.HasMeetNGreet ? true : ps.Promotions.FirstOrDefault(p => p.Type.Equals("meetngreet")) == null ? false : true;
                           eventObj.HasInterview = eventObj.HasInterview ? true : ps.Promotions.FirstOrDefault(p => p.Type.Equals("interview")) == null ? false : true;
                           eventObj.HasAppearnce = eventObj.HasAppearnce ? true : ps.Promotions.FirstOrDefault(p => p.Type.Equals("appearance")) == null ? false : true;

                       });
                    }

                }
            }
            catch (Exception e)
            {
            }

        }

        private void getWeeklyPromotionHistory(PromoStationInfo ps, EventSummary eventObj)
        {
            var pormotionStation = new PromoStationInfo();
            pormotionStation.StationId = ps.StationId;
            pormotionStation.SelectedBy = ps.SelectedBy;

            // itrate through all the promotions to get promotion history week wise
            foreach (var weeklyPromotion in eventObj.weeklyPromoHistory)
            {
                foreach (var p in ps.Promotions)
                {

                    // fetching promotion count with in week 
                    var promotion = p.PromoInstances.Where(promo => promo.CreatedDate >= weeklyPromotion.StartWeekDate && promo.CreatedDate <= weeklyPromotion.StartWeekDate.AddDays(7));

                    if (promotion != null && promotion.Count() > 0)
                    {
                        // if station is added to week
                        var stationExisted = weeklyPromotion.PormotionStations.Where(s => s.StationId.Equals(ps.StationId)).FirstOrDefault();

                        if (stationExisted != null)
                        {
                            stationExisted.Promotions.Add(new PromotionInfo() { Type = p.Type, PromoInstances = promotion.ToList() });
                        }
                        else
                        {
                            // adding station to weekly promotion
                            pormotionStation.Promotions.Add(new PromotionInfo() { Type = p.Type, PromoInstances = promotion.ToList() });
                            weeklyPromotion.PormotionStations.Add(pormotionStation);
                        }
                        // getting count of promotions for the week 
                        switch (p.Type)
                        {
                            case "ticket":
                                foreach (var item in promotion)
                                {
                                    weeklyPromotion.TicketPromotionCount += item.TypeCount.HasValue ? item.TypeCount.Value : 0;
                                }
                                break;
                            case "meetngreet":
                                foreach (var item in promotion)
                                {
                                    weeklyPromotion.MeetnGreetPromotionCount += item.TypeCount.HasValue ? item.TypeCount.Value : 0;
                                }
                                break;
                            case "interview":
                                foreach (var item in promotion)
                                {
                                    weeklyPromotion.InterviewPromotionCount += item.TypeCount.HasValue ? item.TypeCount.Value : 0;
                                }
                                break;
                            case "appearance":
                                foreach (var item in promotion)
                                {
                                    weeklyPromotion.AppearancePromotionCount += item.TypeCount.HasValue ? item.TypeCount.Value : 0;
                                }
                                break;
                        }

                    }

                }
            }
        }

        private DateTime? getStartDateForFindHistory(EventExtras eventExtra)
        {
            if (eventExtra.MarketPromotions.Count == 0)
            {
                return null;
            }

            DateTime? startDate = null;
            var marketWihPromotion = eventExtra.MarketPromotions.FirstOrDefault(p => p.PromoStations.Count > 0);
            if (marketWihPromotion != null)
            {
                var promotionStation = marketWihPromotion.PromoStations.FirstOrDefault(p => p.Promotions.Count() > 0);
                startDate = promotionStation.Promotions[0].PromoInstances[0].CreatedDate;
            }
            return startDate;
        }

        private DateTime findClosestSudayToStartedDate(DateTime date)
        {

            return date.AddDays(-((int)date.DayOfWeek));
        }

        private List<DateTime> findWeeksBetweenTwoDates(DateTime startDate, DateTime endDate)
        {
            List<DateTime> weeks = new List<DateTime>();
            var firstWeekDate = startDate;
            weeks.Add(startDate);
            while (startDate < endDate)
            {
                startDate = startDate.AddDays(7);
                if (startDate >= endDate)
                {
                    if (firstWeekDate.AddDays(7) != startDate)
                    { weeks.Add(endDate); }

                    break;
                }
                weeks.Add(startDate);
            }

            return weeks;
        }

        public async Task<List<EventSummary>> getArtistManagerEvents(UserDetail userFromDB)
        {
            List<EventSummary> esList = new List<EventSummary>();

            // Get Event Summaries for all artists in ascending order of date
            if (userFromDB != null && userFromDB.Artists != null && userFromDB.Artists.Count > 0)
            {
                var filterPerformance = Builders<PerformanceSummary>.Filter.Empty;
                filterPerformance &= Builders<PerformanceSummary>.Filter.In(p => p.ArtistId, userFromDB.Artists);
                var filterEvent = Builders<EventSummary>.Filter.Where(e => e.StartDate.HasValue && e.StartDate > DateTime.Today);
                filterEvent &= Builders<EventSummary>.Filter.ElemMatch<PerformanceSummary>(e => e.Performance, filterPerformance);
                var filterSub = Builders<PerformanceSummary>.Filter.Where(ps => ps.ArtistId != _invalidObjId);
                var projectionES = Builders<EventSummary>.Projection
                    .Include(es => es.Id)
                    .Include(es => es.Name)
                    .Include(es => es.EventVenue)
                    .Include(es => es.StartDate)
                    .Include(es => es.City)
                    .Include(es => es.LngLat)
                    .ElemMatch(es => es.Performance, filterSub);

                var options = new FindOptions<EventSummary, EventSummary>
                {
                    Projection = projectionES,
                    Sort = Builders<EventSummary>.Sort.Ascending(e => e.StartDate)
                };
                var cursorSub = await _eventSummaries.FindAsync<EventSummary>(filterEvent, options);
                esList = cursorSub.ToList<EventSummary>();
            }
            return esList;
        }

        public async Task<List<EventSummary>> getPromoterEvents(UserDetail userFromDB, List<ObjectId> associatedArtists, List<ObjectId> associatedEvents)
        {
            List<EventSummary> esList = new List<EventSummary>();

            if (userFromDB != null && userFromDB.Venues != null && userFromDB.Venues.Count > 0)
            {
                var filterEvent = Builders<EventSummary>.Filter.Empty;
                filterEvent &= Builders<EventSummary>.Filter.In(e => e.EventVenue.Id, userFromDB.Venues);
                filterEvent &= Builders<EventSummary>.Filter.Where(e => e.StartDate.HasValue && e.StartDate > DateTime.Today);

                var filterSub = Builders<PerformanceSummary>.Filter.Where(ps => ps.ArtistId != _invalidObjId);
                var projectionES = Builders<EventSummary>.Projection
                    .Include(es => es.Id)
                    .ElemMatch(es => es.Performance, filterSub);

                //.Include(es => es.Name)
                //    .Include(es => es.EventVenue)
                //    .Include(es => es.StartDate)
                //    .Include(es => es.City)
                //    .Include(es => es.LngLat)
                //Sort = Builders<EventSummary>.Sort.Ascending(e => e.StartDate)

                var options = new FindOptions<EventSummary, EventSummary>
                {
                    Projection = projectionES,

                };
                var cursorSub = await _eventSummaries.FindAsync<EventSummary>(filterEvent, options);
                esList = cursorSub.ToList<EventSummary>();
            }

            // getting all the artists that have event on promoter venue 
            var artists = esList.Select(e => e.Performance).Select(p => p[0].ArtistId).Distinct<ObjectId>().ToList();

            if (artists != null && artists.Count > 0)
            {
                // combine all associated events artists and on venues event artists
                associatedArtists.AddRange(artists);
            }

            // getting all the events for collected artists
            var artistsEvents = await getArtistEvents(associatedArtists);

            // set display false for the events that are not related to current user 
            artistsEvents.ForEach(e => { e.IsDisplay = userFromDB.Venues.Contains(e.EventVenue.Id) || associatedEvents.Contains(e.Id); });


            return artistsEvents;
        }
        // get all events for artists
        public async Task<List<EventSummary>> getArtistEvents(List<ObjectId> artists)
        {
            List<EventSummary> esList = new List<EventSummary>();

            // Get Event Summaries for all artists in ascending order of date
            if (artists != null && artists.Count > 0)
            {
                var filterPerformance = Builders<PerformanceSummary>.Filter.Empty;
                filterPerformance &= Builders<PerformanceSummary>.Filter.In(p => p.ArtistId, artists);
                var filterEvent = Builders<EventSummary>.Filter.Where(e => e.StartDate.HasValue && e.StartDate > DateTime.Today);
                filterEvent &= Builders<EventSummary>.Filter.ElemMatch<PerformanceSummary>(e => e.Performance, filterPerformance);
                var filterSub = Builders<PerformanceSummary>.Filter.Where(ps => ps.ArtistId != _invalidObjId);
                var projectionES = Builders<EventSummary>.Projection
                    .Include(es => es.Id)
                    .Include(es => es.Name)
                    .Include(es => es.EventVenue)
                    .Include(es => es.StartDate)
                    .Include(es => es.City)
                    .Include(es => es.LngLat)
                    .ElemMatch(es => es.Performance, filterSub);

                var options = new FindOptions<EventSummary, EventSummary>
                {
                    Projection = projectionES,
                    Sort = Builders<EventSummary>.Sort.Ascending(e => e.StartDate)
                };
                var cursorSub = await _eventSummaries.FindAsync<EventSummary>(filterEvent, options);
                esList = cursorSub.ToList<EventSummary>();
            }
            return esList;
        }

        public async Task<List<EventSummary>> getRadioManagerEvents(UserDetail userFromDB)
        {
            List<EventSummary> esList = new List<EventSummary>();

            //HashSet<ObjectId> hashVenueIds = new HashSet<ObjectId>();
            // Get Event Summaries for all Stations in ascending order of date
            if (userFromDB != null && userFromDB.Stations != null && userFromDB.Stations.Count > 0)
            {
                var filterEvent = Builders<EventSummary>.Filter.Empty;
                int tempCt = 1;
                foreach (ObjectId stationId in userFromDB.Stations.Distinct<ObjectId>())
                {
                    StationFilter filter = new StationFilter();
                    filter.Id = stationId;
                    var cursor = await _stations.FindAsync<Station>(filter.ToFilterDefinition());
                    Station station = await cursor.FirstOrDefaultAsync<Station>();
                    if (station != null && station.Market != null)
                    {
                        string[] lowerCaseMarket = station.Market.ToLower().Split(',');

                        if (tempCt == 1)
                        {
                            filterEvent &= Builders<EventSummary>.Filter.Where(e => e.EventVenue.MetroArea.Name.ToLower().Contains(lowerCaseMarket[0]));
                            tempCt++;
                        }
                        else
                        {
                            filterEvent |= Builders<EventSummary>.Filter.Where(e => e.EventVenue.MetroArea.Name.ToLower().Contains(lowerCaseMarket[0]));
                        }
                    }
                }

                var filterSub = Builders<PerformanceSummary>.Filter.Where(ps => ps.ArtistId != _invalidObjId);
                var projection = Builders<EventSummary>.Projection
                    .Include(es => es.Id)
                    .Include(es => es.Name)
                    .Include(es => es.EventVenue)
                    .Include(es => es.StartDate)
                    .Include(es => es.City)
                    .Include(es => es.LngLat)
                    .ElemMatch(es => es.Performance, filterSub);

                filterEvent &= Builders<EventSummary>.Filter.Where(e => e.StartDate.HasValue && e.StartDate > DateTime.Today);

                var options = new FindOptions<EventSummary, EventSummary>
                {
                    Projection = projection,
                    Sort = Builders<EventSummary>.Sort.Ascending(e => e.StartDate)
                };
                var cursorSub = await _eventSummaries.FindAsync<EventSummary>(filterEvent, options);
                esList = cursorSub.ToList<EventSummary>();
            }
            return esList;
        }

        public async Task<List<EventSummary>> getMyTeamEvents(UserDetail userFromDB)
        {
            List<EventSummary> esList = new List<EventSummary>();

            var filterUsrDetail = Builders<UserDetail>.Filter.AnyEq<ObjectId>(ud => ud.Team, userFromDB.Id);
            var projection = Builders<UserDetail>.Projection
                .Include(ee => ee.Artists)
                .Exclude(ee => ee.Id);

            var optionsUD = new FindOptions<UserDetail, UserDetail> { Projection = projection };
            var cursorUD = await _userDetails.FindAsync<UserDetail>(filterUsrDetail, optionsUD);
            List<UserDetail> udList = cursorUD.ToList<UserDetail>();
            // To remove dupliate
            HashSet<ObjectId> hashArtistIds = new HashSet<ObjectId>();
            foreach (UserDetail ud in udList)
            {
                if (ud.Artists != null && ud.Artists.Count > 0)
                {
                    foreach (ObjectId objArtId in ud.Artists)
                    {
                        hashArtistIds.Add(objArtId);
                    }
                }
            }
            if (hashArtistIds.Count > 0)
            {
                var filterPerformance = Builders<PerformanceSummary>.Filter.Empty;
                int tempCt = 1;
                foreach (ObjectId artistId in hashArtistIds)
                {
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
                var filterEvent = Builders<EventSummary>.Filter.Where(e => e.StartDate.HasValue && e.StartDate > DateTime.Today);
                filterEvent &= Builders<EventSummary>.Filter.ElemMatch<PerformanceSummary>(e => e.Performance, filterPerformance);

                filterPerformance &= Builders<PerformanceSummary>.Filter.Where(ps => ps.ArtistId != _invalidObjId);
                var projectionES = Builders<EventSummary>.Projection
                    .Include(es => es.Id)
                    .Include(es => es.Name)
                    .Include(es => es.EventVenue)
                    .Include(es => es.StartDate)
                    .Include(es => es.City)
                    .Include(es => es.LngLat)
                    .ElemMatch(es => es.Performance, filterPerformance);
                var optionsES = new FindOptions<EventSummary, EventSummary>
                {
                    Projection = projectionES,
                    Sort = Builders<EventSummary>.Sort.Ascending(e => e.StartDate)
                };
                var cursorSub = await _eventSummaries.FindAsync<EventSummary>(filterEvent, optionsES);
                esList = cursorSub.ToList<EventSummary>();
            }
            return esList;
        }

        [HttpPost]
        [Route("/api/v1/events/getByStationIds")]
        public async Task<IActionResult> getByStationIds([FromBody] ObjectIdListReq stationsList)
        {
            try
            {
                List<EventSummary> esList = new List<EventSummary>();

                // Get Event Summaries for all Stations in ascending order of date
                if (stationsList != null && stationsList.Ids.Count > 0)
                {
                    var filterEvent = Builders<EventSummary>.Filter.Empty;
                    List<ObjectId> stationObjIdList = new List<ObjectId>();
                    int tempCt = 1;
                    foreach (string stationIdStr in stationsList.Ids)
                    {
                        StationFilter filter = new StationFilter();
                        filter.Id = ObjectId.Parse(stationIdStr);
                        var cursor = await _stations.FindAsync<Station>(filter.ToFilterDefinition());
                        Station station = await cursor.FirstOrDefaultAsync<Station>();
                        if (station != null && station.Market != null)
                        {
                            string[] lowerCaseMarket = station.Market.ToLower().Split(',');

                            if (tempCt == 1)
                            {
                                filterEvent &= Builders<EventSummary>.Filter.Where(e => e.EventVenue.MetroArea.Name.ToLower().Contains(lowerCaseMarket[0]));
                                tempCt++;
                            }
                            else
                            {
                                filterEvent |= Builders<EventSummary>.Filter.Where(e => e.EventVenue.MetroArea.Name.ToLower().Contains(lowerCaseMarket[0]));
                            }
                        }
                    }

                    var filterSub = Builders<PerformanceSummary>.Filter.Where(ps => ps.ArtistId != _invalidObjId);
                    var projection = Builders<EventSummary>.Projection
                        .Include(es => es.Id)
                        .Include(es => es.Name)
                        .Include(es => es.EventVenue)
                        .Include(es => es.StartDate)
                        .Include(es => es.City)
                        .Include(es => es.LngLat)
                        .ElemMatch(es => es.Performance, filterSub);

                    filterEvent &= Builders<EventSummary>.Filter.Where(e => e.StartDate.HasValue && e.StartDate > DateTime.Today);

                    var options = new FindOptions<EventSummary, EventSummary>
                    {
                        Projection = projection,
                        Sort = Builders<EventSummary>.Sort.Ascending(e => e.StartDate)
                    };
                    var cursorSub = await _eventSummaries.FindAsync<EventSummary>(filterEvent, options);
                    esList = cursorSub.ToList<EventSummary>();
                }
                else
                {
                    return StatusCode(404, new ErrorModel("Input is empty/invalid", "Input is empty / invalid", 404));// StatusCode(422, e.Message);
                }
                return Ok(esList);
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));// StatusCode(422, e.Message);
            }
        }

        [HttpPost, AllowAnonymous]
        [Route("/api/v1/users/login")]
        public async Task<IActionResult> Login([FromBody] LoginModel lModel)
        {

            //HttpContext.User
            // Bad request
            int retStatusCode = 400;
            try
            {
                UserDetailFilter filter = new UserDetailFilter();
                filter.Userid = lModel.UserId;

                var cursor = await _userDetails.FindAsync<UserDetail>(filter.ToFilterDefinition());
                UserDetail userFromDb = await cursor.FirstOrDefaultAsync<UserDetail>();
                if (userFromDb != null)
                {
                    if (userFromDb.IsLocked)
                    {
                        // User is locked and cannot log in.
                        return StatusCode(403, new ErrorModel("Exceeded number of login attempts. User is locked",
                            "Exceeded number of login attempts. User is locked", 403));  // Forbidden
                    }
                    UserPwdFilter pwdFilter = new UserPwdFilter();
                    pwdFilter.UserId = userFromDb.Id;

                    var pwdCursor = await _userPwds.FindAsync<UserPwd>(pwdFilter.ToFilterDefinition());
                    UserPwd userPwdFromDb = await pwdCursor.FirstOrDefaultAsync<UserPwd>();

                    if (userPwdFromDb != null)
                    {

                        string hashed = getPasswordHash(lModel.Password);
                        if (userPwdFromDb.Password.Equals(hashed))
                        {
                            // Create Cookie and return in response
                            // Get ClaimsPrincipal
                            ClaimsPrincipal userPrincipal = getClaimsPrincipal(userFromDb);
                            await HttpContext.Authentication.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, userPrincipal,
                                                                        new AuthenticationProperties
                                                                        {
                                                                            ExpiresUtc = DateTime.UtcNow.AddMinutes(8 * 60),
                                                                            IsPersistent = false,
                                                                            AllowRefresh = false
                                                                        });


                            //update User object with LastLogin set to Current time
                            userFromDb.LastLogin = DateTime.Now;
                            userFromDb.LoginAttemptCount = 0;
                            var result = await _userDetails.ReplaceOneAsync(filter.ToFilterDefinition(), userFromDb);

                            UserSummary userSummary = new UserSummary();
                            userSummary.Id = userFromDb.Id;
                            userSummary.Email = userFromDb.Email;
                            userSummary.FirstName = userFromDb.FirstName;
                            userSummary.LastName = userFromDb.LastName;
                            userSummary.Location = userFromDb.Location;
                            userSummary.UserType = userFromDb.UserType;
                            userSummary.CompanyId = userFromDb.CompanyId;

                            userSummary.IsActive = userFromDb.IsActive;

                            var filterCompany = Builders<CompanySummary>.Filter.Where(c => c.Id.Equals(userSummary.CompanyId));
                            var cursorCompany = await _companySummaries.FindAsync<CompanySummary>(filterCompany);//, options);
                            CompanySummary cs = await cursorCompany.FirstOrDefaultAsync<CompanySummary>();
                            if (cs != null && cs.Name != null)
                            {
                                userSummary.CompanyName = cs.Name;
                            }

                            retStatusCode = 200;
                            return Ok(userSummary);
                        }
                        else
                        {
                            //update User object with loginAttemptCount
                            userFromDb.LoginAttemptCount++;
                            if (userFromDb.LoginAttemptCount > 3)
                            {
                                userFromDb.IsLocked = true;
                            }
                            var result = await _userDetails.ReplaceOneAsync(filter.ToFilterDefinition(), userFromDb);
                            return StatusCode(403, new ErrorModel("Invalid User/Password", "Invalid User/Password", 403));//retStatusCode = 403; // Forbidden
                        }
                    }
                    return StatusCode(400, new ErrorModel("Invalid User/Password", "Invalid User/Password", 400));
                }
                else
                {
                    Console.WriteLine("User" + lModel.UserId + " does not exist in system");
                    // UnAuthorised 
                    return StatusCode(401, new ErrorModel("User is not registered", "User is not registered", 401));
                }
            }
            catch (Exception e)
            {
                // Should account for 400- Bad request and 401 - Unauthorized

                Console.WriteLine("{0} Exception caught.", e);
                // Uprocessable entity
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));// StatusCode(422, e.Message);
            }
        }

        [HttpGet()]
        [Route("/api/v1/users/logout")]
        public async Task<IActionResult> Logout()
        {
            try
            {
                // Read cookie, invalidate cookie and update database
                // Create Cookie and return in response
                await HttpContext.Authentication.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return Ok();

            }
            catch (Exception e)
            {
                // Should account for 400- Bad request and 401 - Unauthorized

                Console.WriteLine("{0} Exception caught.", e);
                // Uprocessable entity
                return StatusCode(422, new ErrorModel(e.Message, e.StackTrace, 422));//StatusCode(422, e.Message);
            }
        }

        private ClaimsPrincipal getClaimsPrincipal(UserDetail userDetail)
        {
            //const string Issuer = "http://crankdev1.cranklive.com";

            var claims = new List<Claim> {
                //new Claim(ClaimTypes.Name, user.FirstName, ClaimValueTypes.String),
                //new Claim(ClaimTypes.Surname, user.LastName, ClaimValueTypes.String),
                new Claim(ClaimTypes.Email, userDetail.Email, ClaimValueTypes.String),
                new Claim("UserId", userDetail.Userid, ClaimValueTypes.String),
                new Claim("Id", userDetail.Id.ToString(), ClaimValueTypes.String),
                new Claim("UserType", userDetail.UserType, ClaimValueTypes.String),
                new Claim("IsSuperUser", userDetail.IsSuperUser.ToString(), ClaimValueTypes.String),
            };
            var userIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

            var userPrincipal = new ClaimsPrincipal(userIdentity);

            return userPrincipal;
        }

        private string getPasswordHash(string password)
        {
            string retval = null;
            // Get password, encrypt it and check against the Database
            byte[] salt = new byte[128 / 8];
            //using (var rng = RandomNumberGenerator.Create())
            //{
            //    rng.GetBytes(salt);
            //}
            salt = Encoding.Unicode.GetBytes("CrankMedi@2016!!");
            //Console.WriteLine($"Salt: {Convert.ToBase64String(salt)}");
            // derive a 256-bit subkey (use HMACSHA1 with 10,000 iterations)
            retval = Convert.ToBase64String(KeyDerivation.Pbkdf2(
                password: password,
                salt: salt,
                prf: KeyDerivationPrf.HMACSHA1,
                iterationCount: 10000,
                numBytesRequested: 256 / 8));

            return retval;
        }

        [HttpPost()]
        [Route("/api/v1/users/pwds")]
        public async Task<IActionResult> CreatePassword([FromBody] UserPwdReqModel upvModel)
        {
            try
            {
                UserPwdFilter filter = new UserPwdFilter();
                filter.UserId = ObjectId.Parse(upvModel.UserId);
                var findCursor = await _userPwds.FindAsync<UserPwd>(filter.ToFilterDefinition());
                if (findCursor.Any<UserPwd>())
                {
                    // User already exist
                    // I canuse 422 Unprocessable Entity or 409 Conflict or 403 forbidden. But will use 409 for now
                    Console.WriteLine("Password already exists for id " + upvModel.Id);
                    //return StatusCode(409);
                    return NotFound(new ErrorModel("Password already exists", "Password already exists"));
                }
                await _userPwds.InsertOneAsync(getUserPwd(upvModel, getPasswordHash(upvModel.Password)));
                // Created new Password
                return StatusCode(201);
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                // 500, internal server error
                return NotFound(new ErrorModel(e.Message, e.StackTrace));// StatusCode(500, e.Message);
            }
        }

        [HttpPut()]
        [Route("/api/v1/users/pwds")]
        // Update user 
        public async Task<IActionResult> UpdateUserPwd([FromBody] UserPwdReqModel upvModel)
        {
            try
            {
                // Find user by Id
                UserPwdFilter pwdFilter = new UserPwdFilter();
                pwdFilter.UserId = ObjectId.Parse(upvModel.UserId);
                var findCursor = await _userPwds.FindAsync<UserPwd>(pwdFilter.ToFilterDefinition());
                UserPwd foundUserPwd = await findCursor.FirstOrDefaultAsync<UserPwd>();
                if (foundUserPwd != null)
                {
                    UserPwd updateUserPwd = getUserPwd(upvModel, getPasswordHash(upvModel.Password));
                    updateUserPwd.Id = foundUserPwd.Id;
                    var result = await _userPwds.ReplaceOneAsync(pwdFilter.ToFilterDefinition(), updateUserPwd);
                    return Ok();
                }
                else
                {
                    // User does not exist for update. 404 Not Found
                    return NotFound(new ErrorModel("User is not registered", "User is not registered"));
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));// StatusCode(500, e.Message);
            }
        }

        private UserPwd getUserPwd(UserPwdReqModel upvModel, string hashedPwd)
        {
            UserPwd uPwd = new UserPwd();
            uPwd.UserId = ObjectId.Parse(upvModel.UserId);
            uPwd.Password = hashedPwd;
            uPwd.updatedDate = DateTime.Now;

            return uPwd;
        }

        [HttpGet()]
        [Route("/api/v1/users")]
        public async Task<IActionResult> GetByPageNumber(int pageNumber = 1, int pageSize = 20)
        {

            FindOptions<UserSummary> options = new FindOptions<UserSummary>
            {
                Limit = pageSize,
                Skip = (pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0),
                Sort = Builders<UserSummary>.Sort.Ascending(u => u.LastName)
            };
            try
            {
                var cursor = await _userSummaries.FindAsync<UserSummary>(new BsonDocument(), options);

                List<UserSummary> asList = await cursor.ToListAsync<UserSummary>();
                //Getting company names
                foreach (UserSummary us in asList)
                {
                    var filterCompany = Builders<CompanySummary>.Filter.Where(c => c.Id.Equals(us.CompanyId));
                    var cursorCompany = await _companySummaries.FindAsync<CompanySummary>(filterCompany);//, options);
                    CompanySummary cs = await cursorCompany.FirstOrDefaultAsync<CompanySummary>();
                    if (cs != null && cs.Name != null)
                    {
                        us.CompanyName = cs.Name;
                    }
                }
                return Ok(asList);
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace));
            }
        }

        [HttpPost()]
        [Route("/api/v1/users/search")]
        public async Task<IActionResult> Post([FromBody] UserReqModel userReqModel)
        {
            try
            {
                var cursor = await _userDetails.FindAsync<UserDetail>(getUserFilter(userReqModel).ToFilterDefinition());
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace));
            }
        }

        // Get a user by name
        [HttpGet()]
        [Route("/api/v1/users/searchByName/{name}/{pageNumber?}/{pageSize?}")]
        public async Task<IActionResult> GetByName(string name, int pageNumber = 1, int pageSize = 10)
        {
            try
            {


                string lowerCaseName = name.ToLower();

                var filterDefinition = Builders<UserSummary>.Filter.Empty; // new BsonDocument()
                if (!string.IsNullOrEmpty(lowerCaseName))
                {
                    filterDefinition &=
                         Builders<UserSummary>.Filter.Where(r => r.FirstName.ToLower().Contains(lowerCaseName));
                    filterDefinition |=
                         Builders<UserSummary>.Filter.Where(r => r.LastName.ToLower().Contains(lowerCaseName));
                }


                var options = new FindOptions<UserSummary, UserSummary> { Limit = pageSize, Skip = (pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0), Sort = Builders<UserSummary>.Sort.Ascending(u => u.LastName) };

                var cursor = await _userSummaries.FindAsync<UserSummary>(filterDefinition, options);
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace));
            }
        }

        // Get a user by type
        [HttpGet()]
        [Route("/api/v1/users/searchByType/{type?}")]
        public async Task<IActionResult> GetByType(string type = "artist_manager")
        {
            try
            {
                string lowerCaseType = type.ToLower();

                var filterDefinition = Builders<UserSummary>.Filter.Empty; // new BsonDocument()
                if (!string.IsNullOrEmpty(lowerCaseType))
                {
                    filterDefinition &=
                         Builders<UserSummary>.Filter.Where(r => r.UserType.ToLower().Contains(lowerCaseType));
                }


                var options = new FindOptions<UserSummary, UserSummary> { Sort = Builders<UserSummary>.Sort.Ascending(u => u.LastName) };

                var cursor = await _userSummaries.FindAsync<UserSummary>(filterDefinition, options);
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace));
            }
        }
        // Get a user by ObjectId
        [HttpGet()]
        [Route("/api/v1/users/getById/{id}")]
        public async Task<IActionResult> Get(string id)
        {
            try
            {
                // Code with out company name 
                UserDetailFilter filter = new UserDetailFilter();
                filter.Id = ObjectId.Parse(id);
                var cursor = await _userDetails.FindAsync<UserDetail>(filter.ToFilterDefinition());
                return Ok(await cursor.FirstOrDefaultAsync<UserDetail>());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace));
            }
        }

        [HttpPost()]
        [Route("/api/v1/users")]
        // Add new user
        public async Task<IActionResult> CreateUser([FromBody] UserReqModel userReqModel)
        {
            try
            {
                // Check if User already exists using Email address
                UserDetailFilter filter = new UserDetailFilter();
                filter.Userid = userReqModel.Userid;
                var findCursor = await _userDetails.FindAsync<UserDetail>(filter.ToFilterDefinition());
                if (findCursor.Any<UserDetail>())
                {
                    // User already exist
                    // I canuse 422 Unprocessable Entity or 409 Conflict or 403 forbidden. But will use 409 for now
                    return StatusCode(409, new ErrorModel("User with same UserID exists", "User with same UserID exists", 409));
                }
                // Add user
                UserDetail ud = await getUserDetail(userReqModel);
                await _userDetails.InsertOneAsync(ud);
                // Add password for the user
                UserPwd uPwd = new UserPwd();
                uPwd.UserId = ud.Id;
                uPwd.Password = getPasswordHash(userReqModel.Password);
                await _userPwds.InsertOneAsync(uPwd);
                // Created new user
                return StatusCode(201);
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                // 500, internal server error
                //return NotFound(new ErrorModel(e.Message, e.StackTrace));//StatusCode(500, e.Message);
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));
            }
        }

        private UserDetailFilter getUserFilter(UserReqModel userReqModel)
        {
            UserDetailFilter newUserFilter = new UserDetailFilter();
            if (!string.IsNullOrEmpty(userReqModel.Id))
            {
                newUserFilter.Id = ObjectId.Parse(userReqModel.Id);
            }

            newUserFilter.Userid = userReqModel.Userid;
            newUserFilter.Email = userReqModel.Email;
            newUserFilter.IsSuperUser = userReqModel.IsSuperUser;
            newUserFilter.FirstName = userReqModel.FirstName;
            newUserFilter.LastName = userReqModel.LastName;
            newUserFilter.IsActive = userReqModel.IsActive;
            newUserFilter.LoginAttemptCount = userReqModel.LoginAttemptCount;
            newUserFilter.LastLogin = DateTime.Parse(userReqModel.LastLogin);
            newUserFilter.JoinDate = DateTime.Parse(userReqModel.JoinDate);
            newUserFilter.UserType = userReqModel.UserType;
            newUserFilter.IsStaff = userReqModel.IsStaff;
            newUserFilter.Location = userReqModel.Location;
            newUserFilter.CompanyId = ObjectId.Parse(userReqModel.CompanyId);

            if (userReqModel.Venues.Any())
            {
                newUserFilter.Venues = new SortedSet<ObjectId>();
                foreach (string Venue in userReqModel.Venues)
                {
                    newUserFilter.Venues.Add(ObjectId.Parse(Venue));
                }
            }
            if (userReqModel.Artists.Any())
            {
                newUserFilter.Artists = new SortedSet<ObjectId>();
                foreach (string Artist in userReqModel.Artists)
                {
                    newUserFilter.Artists.Add(ObjectId.Parse(Artist));
                }
            }
            if (userReqModel.Stations.Any())
            {
                newUserFilter.Stations = new SortedSet<ObjectId>();
                foreach (string Station in userReqModel.Stations)
                {
                    newUserFilter.Stations.Add(ObjectId.Parse(Station));
                }
            }
            if (userReqModel.Events.Any())
            {
                newUserFilter.Events = new SortedSet<ObjectId>();
                foreach (string Event in userReqModel.Events)
                {
                    newUserFilter.Events.Add(ObjectId.Parse(Event));
                }
            }
            if (userReqModel.Team.Any())
            {
                newUserFilter.Team = new SortedSet<ObjectId>();
                foreach (string userInTeam in userReqModel.Team)
                {
                    newUserFilter.Team.Add(ObjectId.Parse(userInTeam));
                }
            }
            if (userReqModel.ConnectedUsers.Any())
            {
                newUserFilter.ConnectedUsers = new SortedSet<ObjectId>();
                foreach (string userInConn in userReqModel.ConnectedUsers)
                {
                    newUserFilter.ConnectedUsers.Add(ObjectId.Parse(userInConn));
                }
            }
            if (userReqModel.Digitals.Any())
            {
                newUserFilter.Digitals = new SortedSet<ObjectId>();
                foreach (string Station in userReqModel.Digitals)
                {
                    newUserFilter.Digitals.Add(ObjectId.Parse(Station));
                }
            }
            if (userReqModel.Modules.Any())
            {
                newUserFilter.Modules = new SortedSet<ObjectId>();
                foreach (string Module in userReqModel.Modules)
                {
                    newUserFilter.Modules.Add(ObjectId.Parse(Module));
                }
            }

            return newUserFilter;
        }

        private async Task<UserDetail> getUserDetail(UserReqModel userReqModel)
        {
            UserDetail newUser = new UserDetail();
            if (!string.IsNullOrEmpty(userReqModel.Id))
            {
                newUser.Id = ObjectId.Parse(userReqModel.Id);
            }
            // Creating list of stations
            SortedSet<ObjectId> Stations = new SortedSet<ObjectId>();
            if (!string.IsNullOrEmpty(userReqModel.StationId))
            {
                // if station id is valid 
                try
                {
                    Stations.Add(ObjectId.Parse(userReqModel.StationId));
                    // getting station info 
                    var station = await GetStationById(userReqModel.StationId);

                    if (station != null)
                    {
                        // getting all the stations in same market and have same owner 
                        var relatedStation = await searchByMarketAndOwner(station.Market, station.Owner);

                        if (relatedStation != null && relatedStation.Count > 0)
                        {

                            foreach (var item in relatedStation)
                            {
                                Stations.Add(item.Id);
                            }

                        }
                    }


                }
                catch
                {

                }
            }
            newUser.Userid = userReqModel.Userid;
            //newUser.Password = userViewModel.Password;
            newUser.Email = userReqModel.Email;
            newUser.IsSuperUser = userReqModel.IsSuperUser;
            newUser.FirstName = userReqModel.FirstName;
            newUser.LastName = userReqModel.LastName;
            newUser.IsActive = userReqModel.IsActive;
            newUser.LoginAttemptCount = userReqModel.LoginAttemptCount;
            // Adding station to radio user
            if (!string.IsNullOrEmpty(userReqModel.StationId) && Stations.Count > 0)
            {
                newUser.Stations = Stations;
            }
            if (!string.IsNullOrEmpty(userReqModel.LastLogin))
            {
                newUser.LastLogin = DateTime.Parse(userReqModel.LastLogin);
            }
            if (!string.IsNullOrEmpty(userReqModel.JoinDate))
            {
                newUser.JoinDate = DateTime.Parse(userReqModel.JoinDate);
            }
            newUser.UserType = userReqModel.UserType;
            newUser.IsStaff = userReqModel.IsStaff;
            newUser.Location = userReqModel.Location;
            if (!string.IsNullOrEmpty(userReqModel.CompanyId))
            {
                newUser.CompanyId = ObjectId.Parse(userReqModel.CompanyId);
            }

            if (userReqModel.Venues.Any())
            {
                newUser.Venues = new SortedSet<ObjectId>();
                foreach (string Venue in userReqModel.Venues)
                {
                    newUser.Venues.Add(ObjectId.Parse(Venue));
                }
            }
            if (userReqModel.Artists.Any())
            {
                newUser.Artists = new SortedSet<ObjectId>();
                foreach (string Artist in userReqModel.Artists)
                {
                    newUser.Artists.Add(ObjectId.Parse(Artist));
                }
            }
            if (userReqModel.Stations.Any())
            {
                newUser.Stations = new SortedSet<ObjectId>();
                foreach (string Station in userReqModel.Stations)
                {
                    newUser.Stations.Add(ObjectId.Parse(Station));
                }
            }
            if (userReqModel.Events.Any())
            {
                newUser.Events = new SortedSet<ObjectId>();
                foreach (string Event in userReqModel.Events)
                {
                    newUser.Events.Add(ObjectId.Parse(Event));
                }
            }
            if (userReqModel.Team.Any())
            {
                newUser.Team = new SortedSet<ObjectId>();
                foreach (string userInTeam in userReqModel.Team)
                {
                    newUser.Team.Add(ObjectId.Parse(userInTeam));
                }
            }
            if (userReqModel.ConnectedUsers.Any())
            {
                newUser.ConnectedUsers = new SortedSet<ObjectId>();
                foreach (string userInConn in userReqModel.ConnectedUsers)
                {
                    newUser.ConnectedUsers.Add(ObjectId.Parse(userInConn));
                }
            }
            if (userReqModel.Digitals.Any())
            {
                newUser.Digitals = new SortedSet<ObjectId>();
                foreach (string Station in userReqModel.Digitals)
                {
                    newUser.Digitals.Add(ObjectId.Parse(Station));
                }
            }
            if (userReqModel.Modules.Any())
            {
                newUser.Modules = new SortedSet<ObjectId>();
                foreach (string Module in userReqModel.Modules)
                {
                    newUser.Modules.Add(ObjectId.Parse(Module));
                }
            }
            return newUser;
        }


        // get station by id
        [NonAction]
        private async Task<Station> GetStationById(string Id)
        {
            try
            {
                StationFilter filter = new StationFilter();
                filter.Id = ObjectId.Parse(Id);
                var cursor = await _stations.FindAsync<Station>(filter.ToFilterDefinition());
                return await cursor.FirstOrDefaultAsync<Station>();
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return null;
            }
        }

        // getting  stations that have same owner and market
        [NonAction]
        private async Task<List<StationSummary>> searchByMarketAndOwner(string market, string owner)
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

                sL = asList;
                return sL.ToList();
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return null;
            }
        }

        [HttpPut()]
        [Route("/api/v1/users")]
        // Update user 
        public async Task<IActionResult> UpdateUser([FromBody] UserReqModel userReqModel)
        {
            try
            {
                UserDetail updateUser = await getUserDetail(userReqModel);
                // Find user by Id
                UserDetailFilter filter = new UserDetailFilter();
                filter.Id = updateUser.Id;
                var findCursor = await _userDetails.FindAsync<UserDetail>(filter.ToFilterDefinition());
                if (findCursor.Any<UserDetail>())
                {
                    var result = await _userDetails.ReplaceOneAsync(filter.ToFilterDefinition(), updateUser);
                    return Ok(updateUser);
                }
                else
                {
                    // User does not exist for update. 404 Not Found
                    //return StatusCode(404);
                    return StatusCode(404, new ErrorModel("User is not registered", "User is not registered", 404));// StatusCode(500, e.Message);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace));// StatusCode(500, e.Message);
            }
        }

        [HttpGet()]
        [Route("/api/v1/users/{id}/getImage/{imageSize?}")]
        public async Task<ActionResult> GetImage(string id, string imageSize = "normal")
        {
            try
            {

                ObjectId UserId = ObjectId.Parse(id);
                var filterMain = Builders<UserImage>.Filter.Eq(ui => ui.UserId, UserId);

                var cursor = await _userImages.FindAsync<UserImage>(filterMain);

                FileContentResult result = null;
                UserImage uiResult = cursor.ToList<UserImage>().FirstOrDefault<UserImage>();

                if (uiResult != null && uiResult.Image != null)
                {
                    byte[] imgData = uiResult.Image.data;
                    if (imgData != null && imgData.Length > 200)
                    {
                        result = new FileContentResult(imgData, "image/png");
                    }
                }
                if (result == null)
                {
                    //string fileName = "";
                    //switch (imageSize)
                    //{
                    //    case "small":
                    //        fileName = "/images/User-31.png";
                    //        break;
                    //    case "large":
                    //        fileName = "/images/User-140.png";
                    //        break;
                    //    case "huge":
                    //        fileName = "/images/User-300.png";
                    //        break;
                    //    case "normal":
                    //        fileName = "/images/User-50.png";
                    //        break;
                    //}

                    return NotFound();
                    //result = new FileContentResult(FileUtil.readFile(_rootPath + fileName), "image/png");
                }
                else
                {
                    return result;
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));// StatusCode(500, e.Message);
            }
        }

        [HttpPost()]
        [Route("/api/v1/users/getByIds")]
        public async Task<IActionResult> GetByIds([FromBody] ObjectIdListReq objIdsReq)
        {
            try
            {
                IEnumerable<UserSummary> usL = new List<UserSummary>();
                if (objIdsReq.Ids.Count > 0)
                {

                    List<ObjectId> objectIdList = new List<ObjectId>();
                    foreach (string id in objIdsReq.Ids)
                    {
                        objectIdList.Add(ObjectId.Parse(id));
                    }

                    //var filterDefinition = Builders<UserSummary>.Filter.Empty; // new BsonDocument()
                    var filterDefinition = Builders<UserSummary>.Filter.In<ObjectId>(us => us.Id, objectIdList);
                    var cursor = await _userSummaries.FindAsync<UserSummary>(filterDefinition);//, options);

                    List<UserSummary> asList = await cursor.ToListAsync<UserSummary>();
                    usL = asList.OrderBy(item => objectIdList.IndexOf(item.Id));
                    foreach (UserSummary us in usL)
                    {
                        var filterCompany = Builders<CompanySummary>.Filter.Where(c => c.Id.Equals(us.CompanyId));
                        var cursorCompany = await _companySummaries.FindAsync<CompanySummary>(filterCompany);//, options);
                        CompanySummary cs = await cursorCompany.FirstOrDefaultAsync<CompanySummary>();
                        if (cs != null && cs.Name != null)
                        {
                            us.CompanyName = cs.Name;
                        }
                    }
                }
                return Ok(usL);
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }



        [HttpPost()]
        [Route("/api/v1/users/{id}/uploadImage/")]
        public async Task<ActionResult> UploadImage(string id)
        {

            byte[] fileData = null;
            try
            {
                if (Request.Form.Files[0] != null)
                {
                    Stream stream = Request.Form.Files[0].OpenReadStream();
                    var binaryReader = new BinaryReader(stream);
                    fileData = binaryReader.ReadBytes((int)stream.Length);
                    UserImage newUImage = new UserImage();
                    newUImage.UserId = ObjectId.Parse(id);
                    newUImage.Image = new ImageThumbnail();
                    newUImage.Image.data = fileData;
                    newUImage.Image.Source = "Uploaded";


                    // Check if User already exists using Email address
                    UserImageFilter filter = new UserImageFilter();
                    filter.UserId = ObjectId.Parse(id);
                    var findCursor = await _userImages.FindAsync<UserImage>(filter.ToFilterDefinition());
                    UserImage ui = findCursor.FirstOrDefault<UserImage>();
                    if (ui != null)
                    {
                        ui.Image.data = fileData;
                        ui.Image.Source = "Uploaded";
                        var result = await _userImages.ReplaceOneAsync(filter.ToFilterDefinition(), ui);
                        return Ok(ui);
                    }
                    else
                    {
                        await _userImages.InsertOneAsync(newUImage);
                        // Created new Image
                        return StatusCode(201, "Added new image");
                    }
                }
                else
                {
                    // Return, invalid input
                    return StatusCode(400, new ErrorModel("Invalid input", "Invalid input", 400)); //StatusCode(400, "Invalid input");
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                // 500, internal server error
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));// StatusCode(500, e.Message);
            }
        }

        // Upload cropped image with base64string 
        [HttpPost()]
        [Route("/api/v1/users/{id}/uploadImageBase64/")]
        public async Task<ActionResult> UploadImageBase64(string id)
        {

            byte[] fileData = null;
            try
            {
                if (Request.Form.Keys.Count > 0)
                {
                    var imageBase64 = Request.Form["imagebase64"];
                    if (!string.IsNullOrEmpty(imageBase64))
                    {

                        fileData = Convert.FromBase64String(imageBase64);
                        UserImage newUImage = new UserImage();
                        newUImage.UserId = ObjectId.Parse(id);
                        newUImage.Image = new ImageThumbnail();
                        newUImage.Image.data = fileData;
                        newUImage.Image.Source = "Uploaded";


                        // Check if User already exists using Email address
                        UserImageFilter filter = new UserImageFilter();
                        filter.UserId = ObjectId.Parse(id);
                        var findCursor = await _userImages.FindAsync<UserImage>(filter.ToFilterDefinition());
                        UserImage ui = findCursor.FirstOrDefault<UserImage>();
                        if (ui != null)
                        {
                            ui.Image.data = fileData;
                            ui.Image.Source = "Uploaded";
                            var result = await _userImages.ReplaceOneAsync(filter.ToFilterDefinition(), ui);
                            return Ok(ui);
                        }
                        else
                        {
                            await _userImages.InsertOneAsync(newUImage);
                            // Created new Image
                            return StatusCode(201, "Added new image");
                        }
                    }
                    else
                    {
                        // Removeing user image 
                        UserImage newUImage = new UserImage();
                        newUImage.UserId = ObjectId.Parse(id);

                        // find existed image 
                        UserImageFilter filter = new UserImageFilter();
                        filter.UserId = ObjectId.Parse(id);
                        var findCursor = await _userImages.FindAsync<UserImage>(filter.ToFilterDefinition());
                        UserImage ui = findCursor.FirstOrDefault<UserImage>();
                        if (ui != null)
                        {
                            ui.Image.data = null;
                            ui.Image.Source = "Uploaded";
                            var result = await _userImages.ReplaceOneAsync(filter.ToFilterDefinition(), ui);
                            return Ok(ui);
                        }

                        // Return, invalid input
                        return StatusCode(400, new ErrorModel("Invalid input", "Invalid input", 400)); //StatusCode(400, "Invalid input");
                    }
                }
                else
                {
                    // Return, invalid input
                    return StatusCode(400, new ErrorModel("Invalid input", "Invalid input", 400)); //StatusCode(400, "Invalid input");
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                // 500, internal server error
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));// StatusCode(500, e.Message);
            }
        }

        [HttpDelete()]
        [Route("/api/v1/users")]
        // Update user 
        public IActionResult DeleteUser(string UserId)
        {
            // 405 Method not allowed
            return StatusCode(405);
        }

        /*[HttpPatch()]
        [Route("/api/v1/users")]
        // Update user 
        public async Task<IActionResult> PatchUser([FromBody] UserViewModel userViewModel)
        {
                        try
                        {
                            User updateUser = getUser(userViewModel);
                            // Find user by Id
                            UserFilter filter = new UserFilter();
                            filter.Id = updateUser.Id;
                            var findCursor = await _users.FindAsync<User>(filter.ToFilterDefinition());
                            List<User> foundUsers = findCursor.ToList<User>();
                            if (foundUsers.Any())
                            {
                                //List<User> foundUsers = findCursor.ToList<User>();
                                foreach (User eachUser in foundUsers)
                                {
                                    // Update all the users that match Id. There should be only one though
                                    // Going to break after first one
                                    copyUser(updateUser, eachUser);
                                    var result = await _users.ReplaceOneAsync(filter.ToFilterDefinition(), eachUser);
                                    return Ok(eachUser.ToJson());
                                }
                                // Should never come here
                                return StatusCode(500);
                            }
                            else
                            {
                                // User does not exist for update. 404 Not Found
                                return StatusCode(404);
                            }
                        }
                        catch (Exception e)
                        {
                            Console.WriteLine("{0} Exception caught.", e);
                            return StatusCode(500);
                        }
        }*/

        private void copyUserDetail(UserDetail source, UserDetail dest)
        {
            dest.Id = source.Id;
            dest.Userid = source.Userid;
            //dest.Password = source.Password;
            dest.Email = source.Email;
            dest.IsSuperUser = source.IsSuperUser;
            dest.FirstName = source.FirstName;
            dest.LastName = source.LastName;
            dest.IsActive = source.IsActive;
            dest.LoginAttemptCount = source.LoginAttemptCount;
            dest.LastLogin = source.LastLogin;
            dest.JoinDate = source.JoinDate;
            dest.UserType = source.UserType;
            dest.IsStaff = source.IsStaff;
            dest.Location = source.Location;
            dest.CompanyId = source.CompanyId;
            dest.Venues = source.Venues;
            dest.Artists = source.Artists;
            dest.Stations = source.Stations;
            dest.Events = source.Events;
            dest.Team = source.Team;
            dest.ConnectedUsers = source.ConnectedUsers;
            dest.Digitals = source.Digitals;
            dest.Modules = source.Modules;
        }


        [HttpPost()]
        [Route("/api/v1/users/invite")]
        // Invite User to register
        public async Task<IActionResult> Invite([FromBody] UserReqModel userViewModel)
        {
            try
            {
                // Check if User already exists using Email address
                UserDetailFilter filter = new UserDetailFilter();
                filter.Id = ObjectId.Parse(userViewModel.Id);
                var findCursor = await _userDetails.FindAsync<UserDetail>(filter.ToFilterDefinition());
                UserDetail existingUser = await findCursor.FirstOrDefaultAsync<UserDetail>();
                if (existingUser != null)
                {
                    Invitation newInv = new Invitation();
                    newInv.UserId = ObjectId.Parse(userViewModel.Id);
                    newInv.GUID = Guid.NewGuid();
                    newInv.ExpiryInSecs = 24 * 7 * 60 * 60; // 7 days
                    newInv.SentDateTime = DateTime.Now; // Current time
                    newInv.Email = userViewModel.Email;
                    string inviteURL = _configuration.HostName.HostURLPrefix + "/#/register/" + newInv.GUID;

                    byte[] byteArray = FileUtil.readFile(_rootPath + "/" + _configuration.Email.Invite.Template);
                    string messageStr = System.Text.Encoding.UTF8.GetString(byteArray);
                    UserDetail loggedInUser = await getLoggedInUser();
                    Company loggedInUserCompany = await getCompany(loggedInUser.CompanyId);
                    messageStr = string.Format(messageStr, loggedInUser.FirstName + " " + loggedInUser.LastName, loggedInUserCompany.Name, inviteURL);


                    // Send email
                    bool success = await EmailUtil.SendEmailAsync(_configuration.Email.Invite.FromEmail, newInv.Email,
                                                    _configuration.Email.Invite.Subject, messageStr, true);
                    if (!success)
                    {
                        Console.WriteLine("{0} Could not send email to ", newInv.Email);
                        return NotFound(new ErrorModel("Could not send email to " + newInv.Email,
                            "Could not send email to " + newInv.Email, 404));
                    }
                    else
                    {
                        await _userInvitations.InsertOneAsync(newInv);
                        return Ok(success);
                    }
                }
                else
                {
                    // Send invitations only to users who exist in system
                    string errMsg = "User " + userViewModel.FirstName + "," + userViewModel.LastName
                                      + " does not exist in system to send invitation email to " + userViewModel.Email;
                    Console.WriteLine(errMsg);
                    return StatusCode(500, new ErrorModel(errMsg, errMsg, 500));// StatusCode(500);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                // 500, internal server error
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));// StatusCode(500, e.Message);
            }
        }

        // Invite from digitalplatform
        [HttpPost]
        [Route("/api/v1/users/invite/digital")]
        public async Task<IActionResult> InviteDigital([FromBody] DigitalInviteReqModel model)
        {
            if (!string.IsNullOrEmpty(model.UserEmail))
            {

                try
                {
                    //current logged in user detail
                    var currentUser = await getLoggedInUser();
                    var parsedCompanyId = ObjectId.Parse(model.CompanyId);
                    var currentCompany = await getCompany(parsedCompanyId);
                    string messageStr = string.Empty;
                    byte[] byteArray = null;
                    string sentForm = _configuration.Email.Invite.FromEmail;

                    // creating invitation detail for user
                    Invitation newInv = new Invitation();
                 
                    newInv.GUID = Guid.NewGuid();
                    newInv.UserId = currentUser.Id;// this will be updated by invited user id later when invited user found in crank database
                    newInv.ExpiryInSecs = 24 * 7 * 60 * 60; // 7 days
                    newInv.SentDateTime = DateTime.Now; // Current time
                    newInv.ComapnyId = ObjectId.Parse(model.CompanyId);
                    newInv.registered = false;
                    newInv.Email = model.UserEmail;

                    // check invited user registered with crank or not
                    var userFilter = Builders<User>.Filter.Where(u => u.Userid.ToLower() == model.UserEmail.ToLower());
                    var userCursor = await _users.FindAsync<User>(userFilter);
                    var userDetail = userCursor.FirstOrDefault<User>();

                    var companyFilter = Builders<Company>.Filter.Where(c => c.Id.Equals(parsedCompanyId));

                    // if invited user registered with crank
                    if (userDetail != null)
                    {
                        newInv.UserId = userDetail.Id;
                        newInv.registered = true;

                        // check invited user is admin for inviting company or not
                        var companyHasUser = currentCompany.Admins.Contains(userDetail.Id);

                        // if invited user is not admin for company then add user as comapny admin
                        if (!companyHasUser)
                        {
                            currentCompany.Admins.Add(userDetail.Id);
                        }

                        // generating API access key for user
                        var accessKey = await GenerateAPIkey(currentUser.Id, userDetail.Id, model.UserEmail, "Promotion", currentCompany.Id);

                        byteArray = FileUtil.readFile(_rootPath + "/" + _configuration.Email.API.Template);
                        messageStr = System.Text.Encoding.UTF8.GetString(byteArray);
                        messageStr = string.Format(messageStr, accessKey.APIKey, accessKey.UserName, accessKey.Password, currentCompany.Name);
                        sentForm = _configuration.Email.API.FromEmail;

                    }
                    //  if user is not register with crank 
                    else
                    {
                       
                        // send register 
                        string inviteURL = _configuration.HostName.HostURLPrefix + "/#/register/" + newInv.GUID + "/true";

                        byteArray = FileUtil.readFile(_rootPath + "/" + _configuration.Email.Invite.Template);
                        messageStr = System.Text.Encoding.UTF8.GetString(byteArray);
                        messageStr = string.Format(messageStr, currentUser.FirstName + " " + currentUser.LastName, currentCompany.Name, inviteURL);

                    }
                    // Send email
                    bool success = await EmailUtil.SendEmailAsync(sentForm, newInv.Email,
                                                _configuration.Email.Invite.Subject, messageStr, true);

                    // Update company
                    currentCompany.HasApiKeySent = true;
                    await _companies.ReplaceOneAsync(companyFilter, currentCompany);

                    // insert new invitation 
                    await _userInvitations.InsertOneAsync(newInv);
                }

                catch (Exception e)
                {
                    Console.WriteLine("Fail to send invitation to {0}",model.UserEmail);

                    return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));// StatusCode(500, e.Message);

                }

            }

            return Ok(true);
        }

        // Generating Api Access key
        [NonAction]
        private async Task<APIAccessKey> GenerateAPIkey(ObjectId sentBy, ObjectId sentTo, string email,string endpoint,ObjectId sentByCompanyId)
        {

            APIAccessKey apiDetail = new APIAccessKey();

            apiDetail.APIKey = Guid.NewGuid();
            apiDetail.UserName = email;
            apiDetail.Password = Guid.NewGuid().ToString();
            apiDetail.CompanyId = sentByCompanyId;
            apiDetail.APIs.Add(new API() { Endpoint = endpoint, SentByUserId = sentBy, SentToUserId = sentTo, IssueDate = new DateTime() });
            await _apiAccessKeys.InsertOneAsync(apiDetail);
            return apiDetail;
        }

        [NonAction]
        private async Task<UserDetail> getLoggedInUser()
        {
            // Get Logged in user Id
            ClaimsPrincipal principal = HttpContext.User;
            string pid = principal.FindFirst("Id").Value;
            // Get Logged in user Id
            ObjectId loggedInUsrObjId = ObjectId.Parse(pid);
            var filterDefinition = Builders<UserDetail>.Filter.Where(ud => ud.Id.Equals(loggedInUsrObjId));
            var findCursor = await _userDetails.FindAsync<UserDetail>(filterDefinition);
            UserDetail existingUser = await findCursor.FirstOrDefaultAsync<UserDetail>();

            return existingUser;
        }
        [NonAction]
        private async Task<Company> getCompany(ObjectId id)
        {
            var filterDefinition = Builders<Company>.Filter.Where(c => c.Id.Equals(id));
            var findCursor = await _companies.FindAsync<Company>(filterDefinition);
            Company company = await findCursor.FirstOrDefaultAsync<Company>();
            return company;
        }

        [AllowAnonymous]
        [HttpPost()]
        [Route("/api/v1/users/register/{guid?}/{isDigitalInvite?}")]
        // Invite User to register
        public async Task<IActionResult> Register([FromBody] UserReqModel userReqModel, string guid,bool isDigitalInvite=false)
        {
            StatusCodeResult stResult = StatusCode(409);
            UserDetail newUser = null;
            string regCompleteURL = _configuration.HostName.HostURLPrefix;
            string userCompanyName = string.Empty;
            string mailContent = string.Empty;

            byte[] byteArray = null;
            string messageStr = string.Empty;

            try
            {
                // If user is registering via invitation
                if (!string.IsNullOrEmpty(guid))
                {
                    // Find invitation that matches guid
                    InvitationFilter invFilter = new InvitationFilter();
                    invFilter.GUID = Guid.Parse(guid);
                    var invCursor = await _userInvitations.FindAsync<Invitation>(invFilter.ToFilterDefinition());
                    Invitation foundInv = await invCursor.FirstOrDefaultAsync<Invitation>();
                    if (foundInv != null) // No invitation
                    {
                        // Check if token is not expired
                        DateTime tempDateTime = foundInv.SentDateTime;
                        tempDateTime = tempDateTime.AddSeconds(foundInv.ExpiryInSecs);

                        DateTime currentDateTime = DateTime.Now;
                        // If token still valid
                        if (currentDateTime < tempDateTime)
                        {
                            // Find matching user
                            UserDetailFilter uFilter = new UserDetailFilter();
                            uFilter.Id = foundInv.UserId;
                            var findCursor = await _userDetails.FindAsync<UserDetail>(uFilter.ToFilterDefinition());
                            UserDetail foundUser = await findCursor.FirstOrDefaultAsync<UserDetail>();
                            // User found and is inactive
                            if (foundUser != null && !foundUser.IsActive && !isDigitalInvite)
                            {
                                // Copy new data onto existing user
                                newUser = await getUserDetail(userReqModel);
                                newUser.Id = foundUser.Id;
                                newUser.IsActive = true;
                                // Replace existing user with new User details
                                await _userDetails.ReplaceOneAsync(uFilter.ToFilterDefinition(), newUser);

                                Company userCompany = await getCompany(newUser.CompanyId);
                                userCompanyName = userCompany.Name;
                                mailContent = " Thank you for joining CRANK";
                                // Update the Invitation too
                                foundInv.registered = true;
                                foundInv.registeredDateTime = DateTime.Now;
                                var result = await _userInvitations.ReplaceOneAsync(invFilter.ToFilterDefinition(), foundInv);
                                stResult = Ok();
                            }
                            // user is invited from digital
                            if (isDigitalInvite)
                            {
                                // register user 
                                newUser = await getUserDetail(userReqModel);
                                newUser.IsActive = true;
                                await _userDetails.InsertOneAsync(newUser);
                                
                                mailContent = " Thank you for joining CRANK";
                               
                                Company userCompany = null;
                                // Add user to company admin list
                                if (foundInv.ComapnyId != null)
                                {
                                     userCompany = await getCompany(foundInv.ComapnyId);
                                    var companyFilter = Builders<Company>.Filter.Where(c => c.Id == userCompany.Id);
                                    userCompany.Admins.Add(newUser.Id);
                                    userCompanyName = userCompany.Name;
                                    userCompany.HasApiKeySent = true;
                                    await _companies.ReplaceOneAsync(companyFilter, userCompany);
                                }

                              // Generate API Access Key
                                var accessKey = await GenerateAPIkey(foundInv.UserId, newUser.Id, newUser.Userid, "Promotion",( userCompany!=null? userCompany.Id : _invalidObjId));

                                // send API  Access key to user
                                byteArray = FileUtil.readFile(_rootPath + "/" + _configuration.Email.API.Template);

                                messageStr = System.Text.Encoding.UTF8.GetString(byteArray);
                                messageStr = string.Format(messageStr, accessKey.APIKey, accessKey.UserName, accessKey.Password, userCompanyName);

                                bool successAPIKey = await EmailUtil.SendEmailAsync(_configuration.Email.API.FromEmail, newUser.Email, _configuration.Email.API.Subject, messageStr, true);

                                // update invitation status 
                                foundInv.UserId = newUser.Id;
                                foundInv.registered = true;
                                foundInv.registeredDateTime = DateTime.Now;
                                await _userInvitations.ReplaceOneAsync(invFilter.ToFilterDefinition(), foundInv);

                                stResult = Ok();
                            }
                        }
                    }
                }
                else
                {
                    // Check if User already exists using UserId
                    UserDetailFilter filter = new UserDetailFilter();
                    filter.Userid = userReqModel.Userid;
                    var findCursor = await _userDetails.FindAsync<UserDetail>(filter.ToFilterDefinition());
                    if (findCursor.Any<UserDetail>())
                    {
                        // User already exist
                        // I canuse 422 Unprocessable Entity or 409 Conflict or 403 forbidden. But will use 409 for now
                        return StatusCode(409, new ErrorModel("User with given UserId exists", "User with given UserId exists", 409));
                    }

                    newUser = await getUserDetail(userReqModel);
                    newUser.IsActive = true;
                    // if user  wants to register new company
                    var companyFilter = Builders<Company>.Filter.Empty;

                    if (!string.IsNullOrEmpty(userReqModel.CompanyId))
                    {
                        companyFilter &= Builders<Company>.Filter.Where(cs => cs.Id.Equals(ObjectId.Parse(userReqModel.CompanyId)));
                    }

                    if (!string.IsNullOrEmpty(userReqModel.CompanyName))
                    {
                        companyFilter &= Builders<Company>.Filter.Where(cs => cs.Name.Equals(userReqModel.CompanyName));
                    }

                    var cursor = await _companies.FindAsync<Company>(companyFilter);
                    var companyDetail = cursor.FirstOrDefault();

                    if (companyDetail == null)
                    {
                        // Adding New Company
                        var company = new Company() { Name = userReqModel.CompanyName, CreatedDate = DateTime.Now, isActive = true, LastUpdatedDate = DateTime.Now };
                        await _companies.InsertOneAsync(company);
                        companyDetail = company;
                    }

                    newUser.CompanyId = companyDetail.Id;
                    userCompanyName = companyDetail.Name;

                    await _userDetails.InsertOneAsync(newUser);

                    // Add new created user into company admin list
                    if (!string.IsNullOrEmpty(userReqModel.CompanyName) && string.IsNullOrEmpty(userReqModel.CompanyId))
                    {
                        companyDetail.Admins.Add(newUser.Id);
                        var companyFilterReplace = Builders<Company>.Filter.Where(cs => cs.Id.Equals(companyDetail.Id));
                        await _companies.ReplaceOneAsync(companyFilterReplace, companyDetail);
                    }

                    // Add password for the user
                    UserPwd uPwd = new UserPwd();
                    uPwd.UserId = newUser.Id;
                    uPwd.Password = getPasswordHash(userReqModel.Password);
                    await _userPwds.InsertOneAsync(uPwd);

                    mailContent = " Thank you for becoming a member of Crank";

                    stResult = Ok();

                }

                // send welcome email

                // getting HTML template for email
                byteArray = FileUtil.readFile(_rootPath + "/" + _configuration.Email.RegComplete.Template);

                 messageStr = System.Text.Encoding.UTF8.GetString(byteArray);
                messageStr = string.Format(messageStr, newUser.FirstName + " " + newUser.LastName,(" at " + userCompanyName), regCompleteURL, mailContent);
                bool success = await EmailUtil.SendEmailAsync(_configuration.Email.RegComplete.FromEmail, newUser.Email,
                                                _configuration.Email.RegComplete.Subject, messageStr, true);
                if (!success)
                {
                    Console.WriteLine("{0} Could not send Registration completion email to ", newUser.Email);
                }

                return stResult;
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                // 500, internal server error
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));// StatusCode(500, e.Message);
            }
        }
    }
}

