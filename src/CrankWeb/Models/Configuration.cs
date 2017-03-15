using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CrankWeb.Models
{
    public class Configuration
    {
        public string test { get; set; }

        public MongoDBConfig MongoDB { get; set; }
        public HostNameConfig HostName { get; set; }
        public EmailConfig Email { get; set; }
    }

    public class HostNameConfig
    {
        public string HostURLPrefix { get; set; }
    }
    public class EmailConfig
    {
        public EmailConfigInstance Invite { get; set; }
        public EmailConfigInstance RegComplete { get; set; }
        public EmailConfigInstance API { get; set; }


    }
    public class EmailConfigInstance
    {
        public string FromEmail { get; set; }
        public string Subject { get; set; }
        public string Template { get; set; }
    }
}
