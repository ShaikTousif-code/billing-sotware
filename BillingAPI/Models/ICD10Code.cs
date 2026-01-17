namespace BillingAPI.Models;

// ICD-10 Code Reference Table
public class ICD10Code
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty; // e.g., "E11.9"
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // e.g., "Endocrine, nutritional and metabolic diseases"
    public string? Chapter { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

