namespace BillingAPI.Services;

public interface INotificationService
{
    Task SendEmailAsync(string to, string subject, string body);
    Task SendSMSAsync(string phoneNumber, string message);
    Task SendWhatsAppAsync(string phoneNumber, string message);
    Task SendLowStockAlertAsync(int tenantId, int productId);
    Task SendExpiryAlertAsync(int tenantId, int batchId);
    Task SendPaymentReminderAsync(int tenantId, int customerId, decimal amount);
    Task SendFeeReminderAsync(int tenantId, int studentId, int feeId, decimal amount, DateTime dueDate);
    Task SendContractRenewalReminderAsync(int tenantId, int contractId, DateTime expiryDate);
}

