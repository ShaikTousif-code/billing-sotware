namespace BillingAPI.Models;

public class Payment
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMode { get; set; } = "Cash"; // Cash, UPI, Card, BankTransfer
    public string? TransactionId { get; set; }
    public string? Notes { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public int CreatedById { get; set; }

    public Tenant? Tenant { get; set; }
    public Invoice? Invoice { get; set; }
}

