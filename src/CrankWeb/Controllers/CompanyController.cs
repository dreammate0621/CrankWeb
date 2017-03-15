using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Crankdata.Models;
using MongoDB.Driver;
using Microsoft.AspNetCore.Mvc;
using CrankService.Models;
using MongoDB.Bson;
using NLog;
using System.Net.Http;
using System.IO;
using System.Net;
using Microsoft.AspNetCore.Authorization;
using CrankService.Utils;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;
using CrankWeb.Models;

namespace CrankService.Controllers
{
    public class CompanyController : Controller
    {
        CrankdataContext _companyContext = new CrankdataContext();
        IMongoCollection<Company> _companies = null;
        IMongoCollection<CompanyImage> _companyImages = null;
        IMongoCollection<CompanySummary> _companySummaries = null;
        IMongoCollection<Station> _stations = null;
        private static Logger _logger = LogManager.GetCurrentClassLogger();
        private readonly IHostingEnvironment _hostingEnvironment;
        string _rootPath;
        //        private MongoDBConfig _mongoDBConfig { get; }
        private Configuration _configuration { get; }

        public CompanyController(IOptions<Configuration> settings, IHostingEnvironment hostingEnvironment)
        {
            _hostingEnvironment = hostingEnvironment;
            _configuration = settings.Value;
            _companyContext = new CrankdataContext(_configuration.MongoDB.ConnectionString, _configuration.MongoDB.Database);
            _rootPath = _hostingEnvironment.WebRootPath;
            _companies = _companyContext.Companies;
            _stations = _companyContext.Stations;
            _companyImages = _companyContext.CompanyImages;
            _companySummaries = _companyContext.CompanySummaries;
        }


        [HttpGet()]
        [Route("/api/v1/companies/{status}/{pageNumber?}/{pageSize?}")]

        public async Task<IActionResult> GetByPageNumber(string status, int pageNumber, int pageSize = 20)

        {
            var filter = Builders<CompanySummary>.Filter.Where(cs => cs.isActive.Equals(true));
            if (status == "all")
            {
                filter = Builders<CompanySummary>.Filter.Empty;
            }
            else if (status == "inactive")
            {
                filter = Builders<CompanySummary>.Filter.Where(cs => cs.isActive.Equals(false));
            }
            FindOptions<CompanySummary> options = new FindOptions<CompanySummary>
            {
                Limit = pageSize,
                Skip = (pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0),
                Sort = Builders<CompanySummary>.Sort.Ascending(c => c.Name)
            };
            try
            {
                var cursor = await _companySummaries.FindAsync<CompanySummary>(filter, options);
                _logger.Info("Getting all Companies");
                Console.WriteLine("Getting all Companies");
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                _logger.Error("{0} Exception caught. " + e.ToString());
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        [Authorize]
        [HttpGet()]
        [Route("/api/v1/companies/getById/{id}")]
        public async Task<IActionResult> Get(string id)
        {
            try
            {
                CompanyFilter filter = new CompanyFilter();
                filter.Id = ObjectId.Parse(id);

                var cursor = await _companies.FindAsync<Company>(filter.ToFilterDefinition());
                return Ok(cursor.ToList().FirstOrDefault<Company>());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        // Get a Companies by more than one Ids
        [Authorize]
        [HttpPost()]
        [Route("/api/v1/companies/getByIds")]
        public async Task<IActionResult> GetByIds([FromBody] ObjectIdListReq idsReq)
        {
            try
            {
                IEnumerable<CompanySummary> sL = new List<CompanySummary>();
                if (idsReq.Ids.Count > 0)
                {

                    List<ObjectId> objIdList = new List<ObjectId>();
                    foreach (string id in idsReq.Ids)
                    {
                        objIdList.Add(ObjectId.Parse(id));
                    }

                    var filterDefinition = Builders<CompanySummary>.Filter.In<ObjectId>(us => us.Id, objIdList);
                    var cursor = await _companySummaries.FindAsync<CompanySummary>(filterDefinition);//, options);

                    List<CompanySummary> asList = await cursor.ToListAsync<CompanySummary>();
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

        [Authorize]
        [HttpGet()]
        [Route("/api/v1/companies/SearchByName/{name}/{status?}/{pageNumber?}/{pageSize?}")]
        public async Task<IActionResult> GetByName(string name,string status, int pageNumber = 1, int pageSize = 10)
        {
            try
            {
          
                var filter = Builders<CompanySummary>.Filter.Where(cs => cs.Name.ToLower().Contains(name.ToLower()));

                if (!string.IsNullOrEmpty(status))
                {
                    if (status.ToLower() == "active")
                    {
                        filter &= Builders<CompanySummary>.Filter.Where(cs => cs.isActive.Equals(true));
                    }

                    if (status.ToLower() == "all")
                    {
                        filter &= Builders<CompanySummary>.Filter.Empty;
                    }
                    else if (status.ToLower() == "inactive")
                    {
                        filter &= Builders<CompanySummary>.Filter.Where(cs => cs.isActive.Equals(false));
                    }
                   
                }

                FindOptions<CompanySummary> options = new FindOptions<CompanySummary>
                {
                    Limit = pageSize,
                    Skip = (pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0),
                    Sort = Builders<CompanySummary>.Sort.Ascending(c => c.Name)
                };
                var cursor = await _companySummaries.FindAsync<CompanySummary>(filter, options);
                return Ok(cursor.ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }

        [Authorize]
        [HttpPost()]
        [Route("/api/v1/companies/{id}/uploadImage/{imageSize?}")]
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
                    CompanyImage newUImage = new CompanyImage();
                    newUImage.CompanyId = ObjectId.Parse(id);
                    ImageThumbnail itNail = new ImageThumbnail();
                    itNail.data = fileData;
                    itNail.Source = "Uploaded";
                    itNail.Size = imageSize;
                    itNail.LastLoaded = DateTime.Now;
                    newUImage.Images.Add(itNail);


                    // Check if Company image already exists
                    ObjectId CompanyId = ObjectId.Parse(id);
                    var filter = Builders<CompanyImage>.Filter.Where(ci => ci.CompanyId.Equals(CompanyId));
                    var findCursor = await _companyImages.FindAsync<CompanyImage>(filter);
                    CompanyImage ui = findCursor.FirstOrDefault<CompanyImage>();
                    if (ui != null)
                    {
                        for (int i = 0; i < ui.Images.Count; i++)
                        {
                            if (ui.Images[i] != null && ui.Images[i].Size.Equals(imageSize))
                            {
                                ui.Images[i] = itNail;
                            }
                        }
                        var result = await _companyImages.ReplaceOneAsync(filter, ui);
                        return Ok(ui);
                    }
                    else
                    {
                        await _companyImages.InsertOneAsync(newUImage);
                        // Created new Image
                        return StatusCode(201, "Added new image");
                    }
                }
                else
                {
                    // Return, invalid input
                    //return StatusCode(new ErrorModel("There is no file to upload", "There is no file to upload"));// 400, "Invalid input");
                    return BadRequest(new ErrorModel("There is no file to upload", "There is no file to upload", 400));
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                // 500, internal server error
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));//StatusCode(500, e.Message);
            }
        }

        [Authorize]
        [HttpPost()]
        [Route("/api/v1/companies/{id}/UploadImageBase64/{imageSize?}")]
        public async Task<ActionResult> UploadImageBase64(string id, string imageSize = "normal")
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
                        CompanyImage newUImage = new CompanyImage();
                        newUImage.CompanyId = ObjectId.Parse(id);
                        ImageThumbnail itNail = new ImageThumbnail();
                        itNail.data = fileData;
                        itNail.Source = "Uploaded";
                        itNail.Size = imageSize;
                        itNail.LastLoaded = DateTime.Now;
                        newUImage.Images.Add(itNail);


                        // Check if Company image already exists
                        ObjectId CompanyId = ObjectId.Parse(id);
                        var filter = Builders<CompanyImage>.Filter.Where(ci => ci.CompanyId.Equals(CompanyId));
                        var findCursor = await _companyImages.FindAsync<CompanyImage>(filter);
                        CompanyImage ui = findCursor.FirstOrDefault<CompanyImage>();
                        if (ui != null)
                        {
                            for (int i = 0; i < ui.Images.Count; i++)
                            {
                                if (ui.Images[i] != null && ui.Images[i].Size.Equals(imageSize))
                                {
                                    ui.Images[i] = itNail;
                                }
                            }
                            var result = await _companyImages.ReplaceOneAsync(filter, ui);
                            return Ok(ui);
                        }
                        else
                        {
                            await _companyImages.InsertOneAsync(newUImage);
                            // Created new Image
                            return StatusCode(201, "Added new image");
                        }
                    }
                    else
                    {
                        // Return, invalid input
                        //return StatusCode(new ErrorModel("There is no file to upload", "There is no file to upload"));// 400, "Invalid input");
                        return BadRequest(new ErrorModel("There is no file to upload", "There is no file to upload", 400));
                    }
                }
            
                else
                {
                    // Return, invalid input
                    //return StatusCode(new ErrorModel("There is no file to upload", "There is no file to upload"));// 400, "Invalid input");
                    return BadRequest(new ErrorModel("There is no file to upload", "There is no file to upload", 400));
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                // 500, internal server error
                return StatusCode(500, new ErrorModel(e.Message, e.StackTrace, 500));//StatusCode(500, e.Message);
            }
        }

        [Authorize]
        [HttpGet()]
        [Route("/api/v1/companies/{id}/images/{imageSize?}")]
        public async Task<ActionResult> GetImage(string id, string imageSize = "normal")
        {
            try
            {
                ObjectId CompanyId = ObjectId.Parse(id);
                var filterSub = Builders<ImageThumbnail>.Filter.Where(i => i.Size.Equals(imageSize));
                var filterMain = Builders<Company>.Filter.Eq(c => c.Id, CompanyId);

                var projection = Builders<Company>.Projection
                    .Include(c => c.Id)
                    .ElemMatch(c => c.Images, filterSub);

                var options = new FindOptions<Company, Company> { Projection = projection };
                var cursor = await _companies.FindAsync<Company>(filterMain, options);

                FileContentResult result = null;

                Company cResult = cursor.ToList<Company>().FirstOrDefault<Company>();
                if (cResult != null && cResult.Images != null && cResult.Images.Count > 0)
                {
                    byte[] imgData = cResult.Images[0].data;
                    if (imgData != null && imgData.Length > 200)
                    {
                        result = new FileContentResult(imgData, "image/png");
                    }
                }

                // Result still null
                if (result == null)
                {
                    string fileName = "/images/Company-50.png";
                    switch (imageSize)
                    {
                        case "small":
                            fileName = "/images/Company-31.png";
                            break;
                        case "large":
                            fileName = "/images/Company-140.png";
                            break;
                        case "huge":
                            fileName = "/images/Company-300.png";
                            break;
                        case "normal":
                            fileName = "/images/Company-50.png";
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


        [HttpPut()]
        [Route("/api/v1/companies")]
        // Update user 
        public async Task<IActionResult> UpdateCompanyInfo([FromBody] CompanyReqModel companyReqModel)
        {
            try
            {
                Company updateCompany = geCompanyDetail(companyReqModel);
                // Find company by Id
                var filter = Builders<Company>.Filter.Where(cs => cs.Id.Equals(updateCompany.Id));
                var cursor = await _companies.FindAsync<Company>(filter);
                if (cursor.Any<Company>())
                {
                    var result = await _companies.ReplaceOneAsync(filter, updateCompany);
                    return Ok(updateCompany);
                }
                else
                {
                    // Company does not exist for update. 404 Not Found
                    //return StatusCode(404);
                    return StatusCode(404, new ErrorModel("Company is not registered", "Company is not registered", 404));// StatusCode(500, e.Message);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace));// StatusCode(500, e.Message);
            }
        }

        private Company geCompanyDetail(CompanyReqModel companyReqModel)
        {
            Company newCompany = new Company();
            if (!string.IsNullOrEmpty(companyReqModel.Id))
            {
                newCompany.Id = ObjectId.Parse(companyReqModel.Id);
            }
            newCompany.Name = companyReqModel.Name;
            newCompany.isActive = companyReqModel.isActive;

            if (companyReqModel.Emails.Any())
            {
                newCompany.Emails = new List<Email>();
                foreach (var email in companyReqModel.Emails)
                {
                    newCompany.Emails.Add(email);
                }
            }
            if (companyReqModel.Addresses.Any())
            {
                newCompany.Addresses = new List<Address>();
                foreach (var address in companyReqModel.Addresses)
                {
                    newCompany.Addresses.Add(address);
                }
            }
            if (companyReqModel.Admins.Any())
            {
                newCompany.Admins = new List<ObjectId>();
                foreach (var admin in companyReqModel.Admins)
                {
                    newCompany.Admins.Add(ObjectId.Parse(admin));
                }
            }
            if (companyReqModel.Faxes.Any())
            {
                newCompany.Faxes = new List<Phone>();
                foreach (var fax in companyReqModel.Faxes)
                {
                    newCompany.Faxes.Add(fax);
                }
            }
            if (companyReqModel.Images.Any())
            {
                newCompany.Images = new List<ImageThumbnail>();
                foreach (var image in companyReqModel.Images)
                {
                    newCompany.Images.Add(image);
                }
            }
            if (companyReqModel.OtherNames.Any())
            {
                newCompany.OtherNames = new List<string>();
                foreach (string othername in companyReqModel.OtherNames)
                {
                    newCompany.OtherNames.Add(othername);
                }
            }
            if (companyReqModel.Phones.Any())
            {
                newCompany.Phones = new List<Phone>();
                foreach (var phone in companyReqModel.Phones)
                {
                    newCompany.Phones.Add(phone);
                }
            }
            if (companyReqModel.References.Any())
            {
                newCompany.References = new List<string>();
                foreach (string reference in companyReqModel.References)
                {
                    newCompany.References.Add(reference);
                }
            }
            return newCompany;
        }

        [HttpGet()]
        [Route("/api/v1/companies/ExtractCompanysFromStations")]
        public async Task<IActionResult> ExtractCompanysFromStations()
        {
            try
            {
                // Getting all owner names from stations 
                var companyNames = _stations.AsQueryable<Station>().Select(x => x.Owner).Distinct().ToList();
                if (companyNames.Count > 0)
                {
                    foreach (var item in companyNames)
                    {
                        // Search for duplicate company
                        var filter = Builders<Company>.Filter.Where(cs => cs.Name.Equals(item));
                         filter |= Builders<Company>.Filter.Where(cs => cs.OtherNames.Contains(item));

                        var cursor = await _companies.FindAsync<Company>(filter);
                        if (!cursor.Any<Company>())
                        {
                            // Adding New Company
                            var company = new Company() { Name = item, CreatedDate = DateTime.Now, isActive = true, LastUpdatedDate = DateTime.Now };
                            await _companies.InsertOneAsync(company);
                        }
                    }
                }
                return Ok("Extraction done");
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return NotFound(new ErrorModel(e.Message, e.StackTrace, 404));
            }
        }
    }
}
