using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class CustomerPurchaseHistoryService : ICustomerPurchaseHistoryService
{
    private readonly ApplicationDbContext _context;

    public CustomerPurchaseHistoryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CustomerPurchaseHistory> GetPurchaseHistoryAsync(int tenantId, int customerId, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Id == customerId && c.TenantId == tenantId);

        if (customer == null)
            throw new Exception("Customer not found");

        var invoicesQuery = _context.Invoices
            .Where(i => i.TenantId == tenantId && i.CustomerId == customerId);

        if (fromDate.HasValue)
            invoicesQuery = invoicesQuery.Where(i => i.InvoiceDate >= fromDate.Value);
        if (toDate.HasValue)
            invoicesQuery = invoicesQuery.Where(i => i.InvoiceDate <= toDate.Value);

        var invoices = await invoicesQuery.OrderByDescending(i => i.InvoiceDate).ToListAsync();

        return new CustomerPurchaseHistory
        {
            Customer = customer,
            TotalInvoices = invoices.Count,
            TotalAmount = invoices.Sum(i => i.TotalAmount),
            TotalPaid = invoices.Sum(i => i.PaidAmount),
            TotalOutstanding = invoices.Sum(i => i.BalanceAmount),
            Invoices = invoices.Select(i => new PurchaseHistoryItem
            {
                InvoiceId = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                InvoiceDate = i.InvoiceDate,
                Amount = i.TotalAmount,
                PaidAmount = i.PaidAmount,
                BalanceAmount = i.BalanceAmount,
                Status = i.Status
            }).ToList()
        };
    }
}

