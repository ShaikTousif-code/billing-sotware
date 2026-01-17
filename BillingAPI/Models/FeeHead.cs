namespace BillingAPI.Models;

// Configurable Fee Heads (Tuition, Admission, Exam, Transport, etc.)
public class FeeHead
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty; // e.g., "Tuition Fee", "Admission Fee"
    public string Code { get; set; } = string.Empty; // e.g., "TUIT", "ADM", "EXAM"
    public string Description { get; set; } = string.Empty;
    public bool IsOptional { get; set; } = false; // Optional fees like Transport, Hostel
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; } = 0; // For ordering in UI
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
}

