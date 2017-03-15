using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace CrankService.Utils
{
    public class FileUtil
    {
        public static byte[] readFile(string filePath)
        {
            // Read the file and convert it to Byte Array
            //string filePath = Server.MapPath("APP_DATA/TestDoc.docx");
            FileStream fs = null;
            BinaryReader br = null;
            try
            {
                fs = new FileStream(filePath, FileMode.Open, FileAccess.Read);
                br = new BinaryReader(fs);
                byte[] bytes = br.ReadBytes((Int32)fs.Length);
                return bytes;
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return null;
            }
            finally
            {
                if (br != null) { br.Close(); }
                if (fs != null) { fs.Close(); }
            }
        }
    }
}
