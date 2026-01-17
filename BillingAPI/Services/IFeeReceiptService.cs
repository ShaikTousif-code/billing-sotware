using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IFeeReceiptService
{
    Task<byte[]> GenerateFeeReceiptPdfAsync(FeePayment payment);
    Task<byte[]> GenerateFeeStatementPdfAsync(int studentId, int tenantId, DateTime? fromDate = null, DateTime? toDate = null);
    Task SendFeeReceiptEmailAsync(int paymentId, int tenantId);
}

