using BillingAPI.Models;

namespace BillingAPI.Services;

public interface ICreditNoteService
{
    Task<List<CreditNote>> GetCreditNotesAsync(int tenantId, int? invoiceId = null);
    Task<CreditNote?> GetCreditNoteByIdAsync(int id, int tenantId);
    Task<CreditNote> CreateCreditNoteAsync(CreditNote creditNote);
    Task<bool> ProcessCreditNoteAsync(int id, int tenantId);
    Task<string> GenerateCreditNoteNumberAsync(int tenantId);
}

