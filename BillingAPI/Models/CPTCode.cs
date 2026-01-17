namespace BillingAPI.Models;

// CPT Code Reference Table
public class CPTCode
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty; // e.g., "99213"
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // e.g., "Evaluation and Management"
    public decimal? TypicalFee { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

