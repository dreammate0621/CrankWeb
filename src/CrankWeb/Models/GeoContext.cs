using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MongoDB.Driver;
using Crankdata.Models;

namespace GeoService.Models
{
    public class GeoContext
    {
        List<Country> countriesList = new List<Country>();
        const string connectionString = "mongodb://localhost";
        // Default port for mongo is 27000
        MongoClient mongoClient = new MongoClient(connectionString);
        IMongoDatabase database = null;

        public GeoContext()
        {

            // Use the server to access the 'test' database
            database = mongoClient.GetDatabase("crankdb");
            //IMongoCollection<Country> _countries = database.GetCollection<Country>("countries");

            /*_countries.Add(new Country() { Name = "United States of America", Id = "1", ISO2 = "US", ISO3 = "USA" });
            _countries.Add(new Country() { Name = "India", Id = "2", ISO2 = "IN", ISO3 = "IND" });
            _countries.Add(new Country() { Name = "Canada", Id = "3", ISO2 = "CA", ISO3 = "CAN" });
            _countries.Add(new Country() { Name = "Mexico", Id = "4", ISO2 = "MX", ISO3 = "MEX" });*/

        }

        public IMongoCollection<Country> Countries
        {
            get
            {
                 return database.GetCollection<Country>("countries");

                //if (database != null)
                //{
                //    IMongoCollection<Country> iMongoCollection = database.GetCollection<Country>("countries");
                //    //for (int i=0; i < iMongoCollection.Count; i++) {
                //     //   countriesList.Add(new Country() { id = "" });
                //    //}
                //    return iMongoCollection;
                //} else
                //{
                //    return null;
                //}
            }
        }
    }
}
