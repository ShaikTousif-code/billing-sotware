using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using BillingAPI.Data;
using BillingAPI.Models;
using SendGrid;
using SendGrid.Helpers.Mail;
using Twilio;
using Twilio.Rest.Api.V2010.Account;

namespace BillingAPI.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<NotificationService> _logger;
    private readonly IConfiguration _configuration;
    private readonly string? _sendGridApiKey;
    private readonly string? _twilioAccountSid;
    private readonly string? _twilioAuthToken;
    private readonly string? _twilioPhoneNumber;

    public NotificationService(
        ApplicationDbContext context,
        ILogger<NotificationService> logger,
        IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _configuration = configuration;
        _sendGridApiKey = _configuration["SendGrid:ApiKey"];
        _twilioAccountSid = _configuration["Twilio:AccountSid"];
        _twilioAuthToken = _configuration["Twilio:AuthToken"];
        _twilioPhoneNumber = _configuration["Twilio:PhoneNumber"];
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        if (string.IsNullOrEmpty(_sendGridApiKey))
        {
            _logger.LogWarning("SendGrid API key not configured. Email not sent.");
            _logger.LogInformation($"Email would be sent to {to}: {subject}");
            return;
        }

        try
        {
            var client = new SendGridClient(_sendGridApiKey);
            var from = new EmailAddress(_configuration["SendGrid:FromEmail"] ?? "noreply@billingsystem.com", "Billing System");
            var toEmail = new EmailAddress(to);
            var msg = MailHelper.CreateSingleEmail(from, toEmail, subject, body, body);
            var response = await client.SendEmailAsync(msg);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation($"Email sent successfully to {to}: {subject}");
            }
            else
            {
                _logger.LogError($"Failed to send email to {to}. Status: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending email to {to}");
        }
    }

    public async Task SendSMSAsync(string phoneNumber, string message)
    {
        if (string.IsNullOrEmpty(_twilioAccountSid) || string.IsNullOrEmpty(_twilioAuthToken))
        {
            _logger.LogWarning("Twilio credentials not configured. SMS not sent.");
            _logger.LogInformation($"SMS would be sent to {phoneNumber}: {message}");
            return;
        }

        try
        {
            TwilioClient.Init(_twilioAccountSid, _twilioAuthToken);

            var smsMessage = await MessageResource.CreateAsync(
                body: message,
                from: new Twilio.Types.PhoneNumber(_twilioPhoneNumber),
                to: new Twilio.Types.PhoneNumber(phoneNumber)
            );

            _logger.LogInformation($"SMS sent successfully to {phoneNumber}. SID: {smsMessage.Sid}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending SMS to {phoneNumber}");
        }
    }

    public async Task SendWhatsAppAsync(string phoneNumber, string message)
    {
        // TODO: Integrate with WhatsApp Business API
        _logger.LogInformation($"WhatsApp sent to {phoneNumber}: {message}");
        await Task.CompletedTask;
    }

    public async Task SendLowStockAlertAsync(int tenantId, int productId)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null) return;

        var tenant = await _context.Tenants.FindAsync(tenantId);
        if (tenant == null) return;

        // Get users with Manager or Owner role
        var users = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Where(u => u.TenantId == tenantId 
                && u.IsActive 
                && u.UserRoles.Any(ur => ur.Role!.Name == "Owner" || ur.Role!.Name == "Manager"))
            .ToListAsync();

        var message = $"Low stock alert: {product.Name} has only {product.StockQuantity} {product.Unit} remaining. Threshold: {product.LowStockAlert} {product.Unit}";

        foreach (var user in users)
        {
            if (!string.IsNullOrEmpty(user.Email))
            {
                await SendEmailAsync(user.Email, "Low Stock Alert", message);
            }
        }
    }

    public async Task SendExpiryAlertAsync(int tenantId, int batchId)
    {
        var batch = await _context.Batches
            .Include(b => b.Product)
            .FirstOrDefaultAsync(b => b.Id == batchId && b.TenantId == tenantId);

        if (batch == null || batch.Product == null) return;

        var daysUntilExpiry = batch.ExpiryDate.HasValue 
            ? (int)(batch.ExpiryDate.Value - DateTime.UtcNow).TotalDays 
            : 0;

        var message = $"Expiry alert: Batch {batch.BatchNumber} of {batch.Product.Name} will expire in {daysUntilExpiry} days. Quantity: {batch.Quantity}";

        var users = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Where(u => u.TenantId == tenantId 
                && u.IsActive 
                && u.UserRoles.Any(ur => ur.Role!.Name == "Owner" || ur.Role!.Name == "Manager"))
            .ToListAsync();

        foreach (var user in users)
        {
            if (!string.IsNullOrEmpty(user.Email))
            {
                await SendEmailAsync(user.Email, "Expiry Alert", message);
            }
        }
    }

    public async Task SendPaymentReminderAsync(int tenantId, int customerId, decimal amount)
    {
        var customer = await _context.Customers.FindAsync(customerId);
        if (customer == null || string.IsNullOrEmpty(customer.Email)) return;

        var message = $"Payment reminder: You have an outstanding balance of ₹{amount:F2}. Please make payment at your earliest convenience.";

        await SendEmailAsync(customer.Email, "Payment Reminder", message);
    }

    public async Task SendFeeReminderAsync(int tenantId, int studentId, int feeId, decimal amount, DateTime dueDate)
    {
        var student = await _context.Students
            .Include(s => s.Class)
            .FirstOrDefaultAsync(s => s.Id == studentId && s.TenantId == tenantId);

        if (student == null) return;

        var fee = await _context.Fees
            .Include(f => f.FeeStructure)
            .FirstOrDefaultAsync(f => f.Id == feeId && f.TenantId == tenantId);

        if (fee == null) return;

        var daysOverdue = (DateTime.UtcNow - dueDate).Days;
        var subject = daysOverdue > 0 
            ? $"Overdue Fee Reminder - {fee.FeeType}" 
            : $"Fee Payment Reminder - {fee.FeeType}";

        var statusText = daysOverdue > 0 ? "overdue" : "due soon";
        var overdueLine = daysOverdue > 0 ? $"- Days Overdue: {daysOverdue}" : "";

        var message = $@"
Dear {student.FirstName} {student.LastName},

This is a reminder that your fee payment is {statusText}.

Fee Details:
- Fee Type: {fee.FeeType}
- Amount: ₹{amount:F2}
- Due Date: {dueDate:dd/MM/yyyy}
{overdueLine}

Please make the payment at your earliest convenience to avoid any inconvenience.

Thank you!
";

        // Send to student email
        if (!string.IsNullOrEmpty(student.Email))
        {
            await SendEmailAsync(student.Email, subject, message);
        }

        // Send to parent email
        if (!string.IsNullOrEmpty(student.ParentEmail))
        {
            await SendEmailAsync(student.ParentEmail, subject, message);
        }

        // Send SMS to parent phone
        if (!string.IsNullOrEmpty(student.ParentPhone))
        {
            await SendSMSAsync(student.ParentPhone, $"Fee reminder: ₹{amount:F2} due on {dueDate:dd/MM/yyyy}. {fee.FeeType}");
        }
    }

    public async Task SendContractRenewalReminderAsync(int tenantId, int contractId, DateTime expiryDate)
    {
        var contract = await _context.ServiceContracts
            .Include(c => c.Client)
            .FirstOrDefaultAsync(c => c.Id == contractId && c.TenantId == tenantId);

        if (contract == null || contract.Client == null) return;

        var daysUntilExpiry = (expiryDate - DateTime.UtcNow).Days;
        var subject = $"Service Contract Renewal Reminder - {contract.ServiceName}";

        var message = $@"
Dear {contract.Client.CompanyName},

This is a reminder that your service contract is expiring soon.

Contract Details:
- Service: {contract.ServiceName}
- Contract Number: {contract.ContractNumber}
- Expiry Date: {expiryDate:dd/MM/yyyy}
- Days Remaining: {daysUntilExpiry}

Please contact us to renew your contract before the expiry date.

Thank you!
";

        if (!string.IsNullOrEmpty(contract.Client.Email))
        {
            await SendEmailAsync(contract.Client.Email, subject, message);
        }

        if (!string.IsNullOrEmpty(contract.Client.Phone))
        {
            await SendSMSAsync(contract.Client.Phone, $"Contract {contract.ContractNumber} expires on {expiryDate:dd/MM/yyyy}. Please renew soon.");
        }
    }
}

