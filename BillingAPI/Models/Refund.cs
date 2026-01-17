namespace BillingAPI.Models;

public class Refund
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int? InvoiceId { get; set; }
    public int? CreditNoteId { get; set; }
    public string RefundNumber { get; set; } = string.Empty;
    public DateTime RefundDate { get; set; } = DateTime.UtcNow;
    public decimal Amount { get; set; }
    public string PaymentMode { get; set; } = "Cash"; // Cash, BankTransfer, OriginalPayment
    public string? TransactionId { get; set; }
    public string? BankAccount { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Processed, Failed
    public string? Notes { get; set; }
    public int CreatedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }

    public Tenant? Tenant { get; set; }
    public Invoice? Invoice { get; set; }
    public CreditNote? CreditNote { get; set; }
    public User? CreatedBy { get; set; }
}

