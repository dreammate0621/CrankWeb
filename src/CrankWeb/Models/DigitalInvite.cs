using Crankdata.Models;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CrankWeb.Models
{
    public class DigitalInvite
    {
        public bool IsSentInviation { get; set; }
        public User CompanyAdmin { get; set; }
        public ObjectId CompanyId { get; set; }

    }
}
