namespace BillingAPI.Models;

// Procedure Model with CPT Codes
public class Procedure
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int MedicalRecordId { get; set; }
    public string CPTCode { get; set; } = string.Empty; // CPT procedure code
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Modifier { get; set; } // CPT modifiers (e.g., -25, -59)
    public string? Notes { get; set; }
    public DateTime ProcedureDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public MedicalRecord? MedicalRecord { get; set; }
}

