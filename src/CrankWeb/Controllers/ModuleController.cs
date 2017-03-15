using Crankdata.Models;
using CrankService.Models;
using CrankService.Utils;
using CrankWeb.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Internal;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace CrankService.Controllers
{
    [Authorize]
    public class ModuleController : Controller
    {
        CrankdataContext _moduleContext = null;// new CrankdataContext();
        IMongoCollection<Module> _modules = null;
        IMongoCollection<ModuleImage> _moduleImages = null;
        readonly IHostingEnvironment _iHostingEnvironment;
        string _rootPath;
        //        private MongoDBConfig _mongoDBConfig { get; }
        private Configuration _configuration { get; }

        public ModuleController(IOptions<Configuration> settings)
        {
            _configuration= settings.Value;
            _moduleContext = new CrankdataContext(_configuration.MongoDB.ConnectionString, _configuration.MongoDB.Database);
            _moduleImages = _moduleContext.ModuleImages;
            _modules = _moduleContext.Modules;
//            _rootPath = _iHostingEnvironment.WebRootPath;
        }

        [HttpPost()]
        [Route("/api/v1/modules/getByIds")]
        public async Task<IActionResult> GetByIds([FromBody] ObjectIdListReq idsReq)
        {
            try
            {
                IEnumerable<Module> sL = new List<Module>();
                if (idsReq.Ids.Count > 0)
                {

                    List<ObjectId> objIdList = new List<ObjectId>();
                    foreach (string id in idsReq.Ids)
                    {
                        objIdList.Add(ObjectId.Parse(id));
                    }

                    var filterDefinition = Builders<Module>.Filter.In<ObjectId>(us => us.Id, objIdList);
                    var cursor = await _modules.FindAsync<Module>(filterDefinition);//, options);

                    List<Module> asList = await cursor.ToListAsync<Module>();
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
        [Route("/api/v1/modules/{id}/getImage/{imageSize?}")]
        public async Task<ActionResult> GetImage(string id, string imageSize = "normal")
        {
            try
            {
                ObjectId moduleId = ObjectId.Parse(id);
                var filterMain = Builders<ModuleImage>.Filter.Eq(m => m.Id, moduleId);

                var cursor = await _moduleImages.FindAsync<ModuleImage>(filterMain);

                FileContentResult result = null;// new FileContentResult(FileUtil.readFile("C:/Personal/CrankMedia/Projects/CrankService/src/CrankService/images/DefaultModule.png"), "image/png");
                ModuleImage miResult = cursor.ToList<ModuleImage>().FirstOrDefault<ModuleImage>();
                if (miResult != null && miResult.Logo != null)
                {
                    byte[] imgData = miResult.Logo;
                    if (imgData != null && imgData.Length > 200)
                    {
                            result = new FileContentResult(imgData, "image/png");
                    }
                }
                // Result still null
                if (result == null)
                {
                    string fileName = "/images/DefaultModule.png";
                    switch (imageSize)
                    {
                        case "small":
                            fileName = "/images/DefaultModule.png";
                            break;
                        case "large":
                            fileName = "/images/DefaultModule.png";
                            break;
                        case "huge":
                            fileName = "/images/DefaultModule.png";
                            break;
                        case "normal":
                            fileName = "/images/DefaultModule.png";
                            break;
                    }
                    result = new FileContentResult(FileUtil.readFile(_rootPath + fileName), "image/png");
                }

                return result;
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));// StatusCode(500, e.Message);
            }
        }


        [HttpGet()]
        [Route("/api/v1/modules/{pageNumber?}/{pageSize?}")]
        public async Task<IActionResult> GetByPageNumber(int pageNumber, int pageSize = 10)
        {
         
            FindOptions<Module> options = new FindOptions<Module>
            {
                Limit = pageSize,
                Skip = (pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0),
                Sort = Builders<Module>.Sort.Ascending(m => m.Name)
            };
            try
            {
                var cursor = await _modules.FindAsync<Module>(new BsonDocument(), options);
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        [HttpGet()]
        [Route("/api/v1/modules/searchByName/{name?}")]
        public async Task<IActionResult> SearchByName(string name)
        {
            try
            {
                var filterDefinition = Builders<Module>.Filter.Empty; // new BsonDocument()
                if (!string.IsNullOrEmpty(name))
                {
                    string lowerCaseName = name.ToLower();
                    filterDefinition &=
                            Builders<Module>.Filter.Where(m => m.Name.ToLower().Contains(lowerCaseName));
                }

                var projection = Builders<Module>.Projection
                    .Include(m => m.Name)
                    .Include(m => m.Description)
                    .Include(m => m.IsActive)
                    .Include(m => m.IsExpandable)
                    .Include(m => m.CreatedDate);
                var options = new FindOptions<Module, BsonDocument>
                {
                    Projection = projection,
                    Sort = Builders<Module>.Sort.Ascending(m => m.Name)
                };
                List<Module> moduleNSMList = new List<Module>();

                var cursor = await _modules.FindAsync(filterDefinition, options);
                while (await cursor.MoveNextAsync())
                {
                    var batch = cursor.Current;
                    foreach (BsonDocument b in batch)
                    {
                        Module nsmModel = new Module();
                        // Get the string value of the Title field of the BsonDocument
                        nsmModel.Id = b["_id"].AsObjectId;
                        if (b["Name"].IsString)
                        {
                            nsmModel.Name = b["Name"].AsString;
                        }
                        if (b["Description"].IsString)
                        {
                            nsmModel.Description = b["Description"].AsString;
                        }
                        if (b["IsActive"].IsBoolean)
                        {
                            nsmModel.IsActive = b["IsActive"].AsBoolean;
                        }
                        if (b["IsExpandable"].IsString)
                        {
                            nsmModel.IsExpandable = b["IsExpandable"].AsBoolean;
                        }
                        if (b["CreatedDate"].IsBsonDateTime)
                        {
                            nsmModel.CreatedDate = b["CreatedDate"].AsDateTime;
                        }
                        moduleNSMList.Add(nsmModel);
                    }
                }

                return Ok(moduleNSMList);
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        // Get a Module by ObjectId
        [HttpGet()]
        [Route("/api/v1/modules/getById/{id}")]
        public async Task<IActionResult> Get(string id)
        {
            try
            {
                ModuleFilter filter = new ModuleFilter();
                filter.Id = ObjectId.Parse(id);

                var cursor = await _modules.FindAsync<Module>(filter.ToFilterDefinition());
                return Ok(await cursor.FirstOrDefaultAsync<Module>());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        [HttpPost()]
        [Route("/api/v1/modules")]
        // Add new Module
        public async Task<IActionResult> CreateModule([FromBody] ModuleViewModel moduleViewModel)
        {
            try
            {
                // Check if Module already exists 
                ModuleFilter filter = new ModuleFilter();
                filter.Name = moduleViewModel.Name;
                var findCursor = await _modules.FindAsync<Module>(filter.ToFilterDefinition());
                Module foundModule = await findCursor.FirstOrDefaultAsync<Module>();
                if (foundModule != null)
                {
                    // Module already exist
                    // I canuse 422 Unprocessable Entity or 409 Conflict or 403 forbidden. But will use 409 for now
                    return StatusCode(409, new ErrorModel("Module already exists", "Module already exists", 409));
                }
                ;
                await _modules.InsertOneAsync(getModule(moduleViewModel));
                // Created new user
                return StatusCode(201);
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                // 500, internal server error
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));// StatusCode(500, e.Message);
            }
        }

        Module getModule(ModuleViewModel mvModel)
        {
            Module newModule = new Module();

            if( !string.IsNullOrEmpty(mvModel.Id))
            {
                newModule.Id = ObjectId.Parse(mvModel.Id);
            }

            if (!string.IsNullOrEmpty(mvModel.Name))
            {
                newModule.Name = mvModel.Name;
            }
            if (!string.IsNullOrEmpty(mvModel.Description))
            {
                newModule.Description = mvModel.Description;
            }
            if ( mvModel.IsActive.HasValue)
            {
                newModule.IsActive = (bool)mvModel.IsActive;
            }

            if (mvModel.IsExpandable.HasValue)
            {
                newModule.IsExpandable = (bool)mvModel.IsExpandable;
            }

            if (mvModel.CreatedDate.HasValue)
            {
                newModule.CreatedDate = (DateTime)mvModel.CreatedDate;
            }

            return newModule;

        }
    }
}
