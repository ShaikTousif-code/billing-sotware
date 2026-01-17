namespace BillingAPI.Models;

public class Invoice
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; } // Mobile number for walk-in customers
    public int? PatientId { get; set; } // For medical billing
    public int? MedicalRecordId { get; set; } // Link to medical record if bill is from a visit
    public string Status { get; set; } = "Draft"; // Draft, Completed, Cancelled, Hold
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal BillLevelDiscount { get; set; } = 0; // Bill-level discount
    public decimal ServiceCharge { get; set; } = 0; // For restaurant/hotel
    public decimal Tips { get; set; } = 0; // For restaurant
    public decimal RoundOff { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string? PaymentMode { get; set; }
    public string? PaymentTerms { get; set; } // Net 30, Net 60, COD, etc. (for B2B)
    public DateTime? DueDate { get; set; } // Payment due date (for B2B credit sales)
    public bool IsTaxInvoice { get; set; } = false; // True for B2B GST invoices
    public string? PlaceOfSupply { get; set; } // For B2B GST compliance
    public decimal LoyaltyPointsEarned { get; set; } = 0; // Points earned in this invoice (B2C)
    public decimal LoyaltyPointsRedeemed { get; set; } = 0; // Points redeemed in this invoice (B2C)
    public string? Notes { get; set; }
    public int CreatedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Customer? Customer { get; set; }
    public Patient? Patient { get; set; }
    public MedicalRecord? MedicalRecord { get; set; }
    public User? CreatedBy { get; set; }
    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

