namespace BillingAPI.Models;

// Diagnosis Model with ICD-10 Codes
public class Diagnosis
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int MedicalRecordId { get; set; }
    public string ICD10Code { get; set; } = string.Empty; // ICD-10 diagnosis code
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = "Primary"; // Primary, Secondary, Differential
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public MedicalRecord? MedicalRecord { get; set; }
}

