using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class RecurringInvoiceService : IRecurringInvoiceService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public RecurringInvoiceService(ApplicationDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<List<ContractInvoice>> GenerateRecurringInvoicesAsync(int tenantId)
    {
        var contracts = await _context.ServiceContracts
            .Include(c => c.Client)
            .Where(c => c.TenantId == tenantId 
                && c.Status == "Active"
                && c.ContractType != "One-time")
            .ToListAsync();

        var generatedInvoices = new List<ContractInvoice>();
        var currentDate = DateTime.UtcNow;
        var currentMonth = currentDate.ToString("MMMM yyyy");

        foreach (var contract in contracts)
        {
            // Check if invoice already exists for this period
            var existingInvoice = await _context.ContractInvoices
                .FirstOrDefaultAsync(i => i.ContractId == contract.Id 
                    && i.Period == currentMonth
                    && i.TenantId == tenantId);

            if (existingInvoice != null) continue;

            // Generate invoice based on contract type
            var invoice = await GenerateContractInvoiceAsync(contract.Id, tenantId, currentMonth);
            generatedInvoices.Add(invoice);
        }

        return generatedInvoices;
    }

    public async Task<ContractInvoice> GenerateContractInvoiceAsync(int contractId, int tenantId, string period)
    {
        var contract = await _context.ServiceContracts
            .Include(c => c.Client)
            .FirstOrDefaultAsync(c => c.Id == contractId && c.TenantId == tenantId);

        if (contract == null)
            throw new Exception("Contract not found");

        var invoiceNumber = await GenerateInvoiceNumberAsync(tenantId);
        var dueDate = DateTime.UtcNow.AddDays(30); // Default 30 days payment terms

        var invoice = new ContractInvoice
        {
            TenantId = tenantId,
            ContractId = contractId,
            ClientId = contract.ClientId,
            InvoiceNumber = invoiceNumber,
            InvoiceDate = DateTime.UtcNow,
            DueDate = dueDate,
            Period = period,
            Amount = contract.MonthlyAmount,
            TaxAmount = contract.MonthlyAmount * 0.18m, // 18% GST
            TotalAmount = contract.MonthlyAmount * 1.18m,
            BalanceAmount = contract.MonthlyAmount * 1.18m,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.ContractInvoices.Add(invoice);
        await _context.SaveChangesAsync();

        // Send notification
        if (contract.Client != null && !string.IsNullOrEmpty(contract.Client.Email))
        {
            await _notificationService.SendEmailAsync(
                contract.Client.Email,
                $"Invoice {invoiceNumber} - {contract.ServiceName}",
                $"Your invoice for {period} has been generated. Amount: ₹{invoice.TotalAmount:F2}"
            );
        }

        return invoice;
    }

    public async Task<List<ServiceContract>> GetExpiringContractsAsync(int tenantId, int daysAhead = 30)
    {
        var expiryDate = DateTime.UtcNow.AddDays(daysAhead);

        return await _context.ServiceContracts
            .Include(c => c.Client)
            .Where(c => c.TenantId == tenantId
                && c.Status == "Active"
                && c.EndDate <= expiryDate
                && c.EndDate >= DateTime.UtcNow)
            .OrderBy(c => c.EndDate)
            .ToListAsync();
    }

    private async Task<string> GenerateInvoiceNumberAsync(int tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var lastInvoice = await _context.ContractInvoices
            .Where(i => i.TenantId == tenantId && i.InvoiceNumber.StartsWith($"CNT-INV-{year}"))
            .OrderByDescending(i => i.InvoiceNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastInvoice != null)
        {
            var parts = lastInvoice.InvoiceNumber.Split('-');
            if (parts.Length >= 4 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"CNT-INV-{year}-{nextNumber:D6}";
    }
}

