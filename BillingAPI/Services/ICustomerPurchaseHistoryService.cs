using BillingAPI.Models;

namespace BillingAPI.Services;

public interface ICustomerPurchaseHistoryService
{
    Task<CustomerPurchaseHistory> GetPurchaseHistoryAsync(int tenantId, int customerId, DateTime? fromDate = null, DateTime? toDate = null);
}

public class CustomerPurchaseHistory
{
    public Customer? Customer { get; set; }
    public int TotalInvoices { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal TotalOutstanding { get; set; }
    public List<PurchaseHistoryItem> Invoices { get; set; } = new();
}

public class PurchaseHistoryItem
{
    public int InvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; }
    public decimal Amount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string Status { get; set; } = string.Empty;
}

