namespace BillingAPI.Models;

// Student Management for Schools/Colleges
public class Student
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string StudentId { get; set; } = string.Empty; // Roll number/Admission number
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
    
    // Academic Information
    public int? ClassId { get; set; }
    public string? Section { get; set; }
    public string? Course { get; set; } // For colleges
    public string? Department { get; set; } // For colleges
    public string AcademicYear { get; set; } = string.Empty;
    public string Status { get; set; } = "Active"; // Active, Graduated, Transferred, Withdrawn
    
    // Parent/Guardian Information
    public string? ParentName { get; set; }
    public string? ParentPhone { get; set; }
    public string? ParentEmail { get; set; }
    public string? GuardianName { get; set; }
    public string? GuardianPhone { get; set; }
    
    // Financial Information
    public decimal TotalFees { get; set; }
    public decimal PaidFees { get; set; }
    public decimal OutstandingFees { get; set; }
    public decimal ScholarshipAmount { get; set; }
    public bool IsScholarshipApplicable { get; set; }
    
    // Student-level Discount
    public decimal? DiscountPercentage { get; set; } // Percentage discount (e.g., 10 for 10%)
    public decimal? DiscountAmount { get; set; } // Fixed discount amount
    public string? DiscountReason { get; set; } // Reason for discount
    public bool IsDiscountActive { get; set; } = true; // Enable/disable discount
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Class? Class { get; set; }
    public ICollection<Fee> Fees { get; set; } = new List<Fee>();
    public ICollection<FeePayment> FeePayments { get; set; } = new List<FeePayment>();
}

