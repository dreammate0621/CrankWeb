using Crankdata.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CrankWeb.Utils
{
    public class ErrorUtil
    {
        public static ErrorModel getError(string msg, string desc)
        {
            return new ErrorModel(msg, desc);
        }
    }
}
