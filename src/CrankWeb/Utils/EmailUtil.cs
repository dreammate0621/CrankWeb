using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MimeKit;
using MailKit.Security;

namespace CrankService.Utils
{
    public class EmailUtil
    {
        public static async Task<bool> SendEmailAsync(string fromEmail, string toEmail, string subject, string message,bool isHtml=false)
        {
            try
            {
                var emailMessage = new MimeMessage();
                if (fromEmail != null)
                {
                    emailMessage.From.Add(new MailboxAddress("", fromEmail));
                }
                else
                {
                    emailMessage.From.Add(new MailboxAddress("Do Not Reply", "donotreply@cranklive.com"));
                }
                if (toEmail != null)
                {
                    emailMessage.To.Add(new MailboxAddress("", toEmail));
                    emailMessage.Subject = subject;
                    string subType = isHtml ? "html" : "plain";

                   emailMessage.Body = new TextPart(subType) { Text = message };
                  
                    using (var client = new SmtpClient())
                    {
                        client.LocalDomain = "cranklive.com";
                        await client.ConnectAsync("email-smtp.us-east-1.amazonaws.com", 25, SecureSocketOptions.StartTls).ConfigureAwait(false);
                        await client.AuthenticateAsync("AKIAISF7N7TSTZ52EXRQ", "AjPNmHE4uN0T/D9VNLcWrHHwI/KiRnGMvlAgtV51YU5A");
                        await client.SendAsync(emailMessage).ConfigureAwait(false);
                        await client.DisconnectAsync(true).ConfigureAwait(false);
                    }
                    return true;
                }
                else
                {
                    Console.WriteLine("{0} toEmail cannot be empty.");
                    return false;
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("{0} Exception caught.", e);
                return false;
            }
        }
    }
}
