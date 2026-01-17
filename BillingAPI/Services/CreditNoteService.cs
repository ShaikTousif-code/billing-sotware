using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class CreditNoteService : ICreditNoteService
{
    private readonly ApplicationDbContext _context;

    public CreditNoteService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CreditNote>> GetCreditNotesAsync(int tenantId, int? invoiceId = null)
    {
        var query = _context.CreditNotes
            .Include(cn => cn.Invoice)
            .Include(cn => cn.Items)
            .Where(cn => cn.TenantId == tenantId);

        if (invoiceId.HasValue)
        {
            query = query.Where(cn => cn.InvoiceId == invoiceId.Value);
        }

        return await query.OrderByDescending(cn => cn.CreditNoteDate).ToListAsync();
    }

    public async Task<CreditNote?> GetCreditNoteByIdAsync(int id, int tenantId)
    {
        return await _context.CreditNotes
            .Include(cn => cn.Invoice)
            .Include(cn => cn.Items)
            .FirstOrDefaultAsync(cn => cn.Id == id && cn.TenantId == tenantId);
    }

    public async Task<CreditNote> CreateCreditNoteAsync(CreditNote creditNote)
    {
        if (string.IsNullOrEmpty(creditNote.CreditNoteNumber))
        {
            creditNote.CreditNoteNumber = await GenerateCreditNoteNumberAsync(creditNote.TenantId);
        }

        // Calculate totals
        creditNote.TotalAmount = creditNote.Items.Sum(i => i.TotalAmount);
        creditNote.TaxAmount = creditNote.Items.Sum(i => i.TaxAmount);

        _context.CreditNotes.Add(creditNote);

        // Update invoice if needed
        var invoice = await _context.Invoices.FindAsync(creditNote.InvoiceId);
        if (invoice != null)
        {
            invoice.BalanceAmount -= creditNote.TotalAmount;
        }

        await _context.SaveChangesAsync();
        return creditNote;
    }

    public async Task<bool> ProcessCreditNoteAsync(int id, int tenantId)
    {
        var creditNote = await _context.CreditNotes
            .FirstOrDefaultAsync(cn => cn.Id == id && cn.TenantId == tenantId);

        if (creditNote == null || creditNote.Status != "Pending")
            return false;

        creditNote.Status = "Processed";
        creditNote.ProcessedAt = DateTime.UtcNow;

        // Update customer balance or create refund
        var invoice = await _context.Invoices
            .Include(i => i.Customer)
            .FirstOrDefaultAsync(i => i.Id == creditNote.InvoiceId);

        if (invoice?.Customer != null)
        {
            invoice.Customer.OutstandingBalance -= creditNote.TotalAmount;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<string> GenerateCreditNoteNumberAsync(int tenantId)
    {
        var config = await _context.TenantConfigurations
            .FirstOrDefaultAsync(c => c.TenantId == tenantId);

        var prefix = config?.InvoicePrefix ?? "CN";
        var year = DateTime.UtcNow.Year;
        var lastCreditNote = await _context.CreditNotes
            .Where(cn => cn.TenantId == tenantId && cn.CreditNoteNumber.StartsWith($"{prefix}-{year}"))
            .OrderByDescending(cn => cn.CreditNoteNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastCreditNote != null)
        {
            var parts = lastCreditNote.CreditNoteNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"{prefix}-{year}-{nextNumber:D6}";
    }
}

