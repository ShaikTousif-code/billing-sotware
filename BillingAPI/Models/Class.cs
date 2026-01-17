namespace BillingAPI.Models;

// Class/Section Management for Schools/Colleges
public class Class
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty; // e.g., "Class 10", "B.Tech 3rd Year"
    public string? Code { get; set; }
    public string Type { get; set; } = "School"; // School, College, University
    public string? Course { get; set; } // For colleges
    public string? Department { get; set; } // For colleges
    public int? MaxStrength { get; set; }
    public int CurrentStrength { get; set; }
    public string AcademicYear { get; set; } = string.Empty;
    public string? ClassTeacher { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public ICollection<Student> Students { get; set; } = new List<Student>();
    public ICollection<FeeStructure> FeeStructures { get; set; } = new List<FeeStructure>();
}

