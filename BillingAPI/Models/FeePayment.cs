namespace BillingAPI.Models;

// Fee Payment Records
public class FeePayment
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int FeeId { get; set; }
    public int StudentId { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMode { get; set; } = "Cash"; // Cash, Cheque, Online, Bank Transfer, UPI, Card
    public string? TransactionId { get; set; } // UPI transaction ID or payment gateway transaction ID
    public string? PaymentGateway { get; set; } // Razorpay, Stripe, etc.
    public string? PaymentGatewayOrderId { get; set; }
    public string? PaymentGatewayPaymentId { get; set; }
    public string? ChequeNumber { get; set; }
    public DateTime? ChequeDate { get; set; }
    public string? BankName { get; set; }
    public string? UPIId { get; set; } // UPI ID used for payment
    public string PaymentStatus { get; set; } = "Success"; // Success, Failed, Pending, Refunded
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
    public int CreatedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsReceiptGenerated { get; set; } = false; // Track if receipt is generated
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Fee? Fee { get; set; }
    public Student? Student { get; set; }
    public User? CreatedBy { get; set; }
}

