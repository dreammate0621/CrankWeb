using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Crankdata.Models;
using MongoDB.Driver;

namespace CrankService.Models
{
    public class UserDetailFilter
    {
        public ObjectId? Id { get; set; }
        public string Userid { get; set; }
        public string Email { get; set; }
        public bool IsSuperUser { get; set; }
        public DateTime? LastLogin { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public bool IsActive { get; set; }
        public double? LoginAttemptCount { get; set; }
        public DateTime? JoinDate { get; set; }
        public string UserType { get; set; }
        public bool IsStaff { get; set; }
        public string Location { get; set; }
        public ObjectId? CompanyId { get; set; }
       
        public SortedSet<ObjectId> Venues { get; set; } = new SortedSet<ObjectId>();
        public SortedSet<ObjectId> Artists { get; set; } = new SortedSet<ObjectId>();
        public SortedSet<ObjectId> Stations { get; set; } = new SortedSet<ObjectId>();
        public SortedSet<ObjectId> Events { get; set; } = new SortedSet<ObjectId>();
        public SortedSet<ObjectId> Team { get; set; } = new SortedSet<ObjectId>();
        public SortedSet<ObjectId> ConnectedUsers { get; set; } = new SortedSet<ObjectId>();
        public SortedSet<ObjectId> Digitals { get; set; } = new SortedSet<ObjectId>();
        public SortedSet<ObjectId> Modules { get; set; } = new SortedSet<ObjectId>();

        public MongoDB.Driver.FilterDefinition<UserDetail> ToFilterDefinition()
        {
            var filterDefinition = Builders<UserDetail>.Filter.Empty; // new BsonDocument()
            if (Id.HasValue)
            {
                filterDefinition &=
                     Builders<UserDetail>.Filter.Where(r => r.Id.Equals(Id));
            }

            if (!string.IsNullOrEmpty(Userid))
            {
                filterDefinition &=
                     Builders<UserDetail>.Filter.Where(r => r.Userid.Equals(Userid));
            }

            if (!string.IsNullOrEmpty(Email))
            {
                filterDefinition &=
                     Builders<UserDetail>.Filter.Where(r => r.Email.Contains(Email));
            }

            if (IsSuperUser)
            {
                filterDefinition &=
                     Builders<UserDetail>.Filter.Where(r => r.IsSuperUser.Equals(IsSuperUser));
            }

            if (!string.IsNullOrEmpty(FirstName))
            {
                filterDefinition &=
                     Builders<UserDetail>.Filter.Where(r => r.FirstName.Contains(FirstName));
            }
            if (!string.IsNullOrEmpty(LastName))
            {
                filterDefinition &=
                     Builders<UserDetail>.Filter.Where(r => r.LastName.Contains(LastName));
            }

            if (IsActive)
            {
                filterDefinition &=
                     Builders<UserDetail>.Filter.Where(r => r.IsActive.Equals(IsActive));
            }

            if (LoginAttemptCount.HasValue)
            {
                filterDefinition &=
                     Builders<UserDetail>.Filter.Where(r => r.LoginAttemptCount.Equals(LoginAttemptCount));
            }

            if (JoinDate.HasValue)
            {
                filterDefinition &=
                     Builders<UserDetail>.Filter.Where(r => r.JoinDate.Equals(JoinDate));
            }

            if (!string.IsNullOrEmpty(UserType))
            {
                filterDefinition &=
                     Builders<UserDetail>.Filter.Where(r => r.UserType.Contains(UserType));
            }

            if (IsStaff)
            {
                filterDefinition &=
                     Builders<UserDetail>.Filter.Where(r => r.IsStaff.Equals(IsStaff));
            }

            if (!string.IsNullOrEmpty(Location))
            {
                filterDefinition &=
                     Builders<UserDetail>.Filter.Where(r => r.Location.Contains(Location));
            }
            if (CompanyId.HasValue)
            {
                filterDefinition &=
                     Builders<UserDetail>.Filter.Where(r => r.CompanyId.Equals(CompanyId));
            }

            if (Venues.Any())
            {
                foreach (ObjectId Venue in Venues)
                {
                    filterDefinition &=
                            Builders<UserDetail>.Filter.Where(r => r.Venues.Contains(Venue));
                }
            }
            if (Artists.Any())
            {
                foreach (ObjectId Artist in Artists)
                {
                    filterDefinition &=
                            Builders<UserDetail>.Filter.Where(r => r.Artists.Contains(Artist));
                }
            }
            if (Stations.Any())
            {
                foreach (ObjectId Station in Stations)
                {
                    filterDefinition &=
                            Builders<UserDetail>.Filter.Where(r => r.Stations.Contains(Station));
                }
            }
            if (Events.Any())
            {
                foreach (ObjectId Event in Events)
                {
                    filterDefinition &=
                            Builders<UserDetail>.Filter.Where(r => r.Events.Contains(Event));
                }
            }
            if (Team.Any())
            {
                foreach (ObjectId teamId in Team)
                {
                    filterDefinition &=
                            Builders<UserDetail>.Filter.Where(r => r.Team.Equals(teamId));
                }
            }
            if (ConnectedUsers.Any())
            {
                foreach (ObjectId connId in ConnectedUsers)
                {
                    filterDefinition &=
                            Builders<UserDetail>.Filter.Where(r => r.ConnectedUsers.Equals(connId));
                }
            }
            if (Digitals.Any())
            {
                foreach (ObjectId StationId in Digitals)
                {
                    filterDefinition &=
                            Builders<UserDetail>.Filter.Where(r => r.Digitals.Contains(StationId));
                }
            }
            if (Modules.Any())
            {
                foreach (ObjectId ModuleId in Modules)
                {
                    filterDefinition &=
                            Builders<UserDetail>.Filter.Where(r => r.Modules.Contains(ModuleId));
                }
            }
            return filterDefinition;
        }
    }
}
