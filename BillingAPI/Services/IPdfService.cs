using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IPdfService
{
    Task<byte[]> GenerateInvoicePdfAsync(Invoice invoice);
    Task<byte[]> GenerateCreditNotePdfAsync(CreditNote creditNote);
    Task<string> GenerateInvoiceQrCodeAsync(Invoice invoice);
}

