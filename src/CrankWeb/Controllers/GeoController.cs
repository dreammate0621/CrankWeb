using Crankdata.Models;
using CrankWeb.Models;
using GeoService.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GeoService.Controllers
{
    [Authorize]
    public class GeoController : Controller
    {
        CrankdataContext _countriesContext = null;// new CrankdataContext();
        IMongoCollection<Country> _countries = null;
        //private MongoDBConfig _mongoDBConfig { get; }
        private Configuration _configuration { get; }

        public GeoController(IOptions<Configuration> settings)
        {
            _configuration = settings.Value;
            _countriesContext = new CrankdataContext(_configuration.MongoDB.ConnectionString, _configuration.MongoDB.Database);
            _countries = _countriesContext.Countries;
        }


        [HttpGet()]
        [Route("/api/v1/geo/countries")]
        public async Task<IActionResult> Get()
        {
            try
            {
                var cursor = await _countries.FindAsync<Country>(new BsonDocument());
                return Ok(cursor.ToList());
            }
            catch(Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
            
        }

        [HttpPost()]
        [Route("/api/v1/geo/countries/search")]
        public async Task<IActionResult> Post([FromBody] CountryFilter filter)
        {
            try
            {
                var cursor = await _countries.FindAsync<Country>(filter.ToFilterDefinition());
                return Ok(cursor.ToList());
            } catch(Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        [HttpGet()]
        [Route("/api/v1/geo/countries/{id}")]
        public async Task<IActionResult> Get(string id)
        {
            try
            {
                CountryFilter filter = new CountryFilter();
                filter.id = id;

                var cursor = await _countries.FindAsync<Country>(filter.ToFilterDefinition());
                return Ok(cursor.ToList());
            } catch( Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }
    }
}
