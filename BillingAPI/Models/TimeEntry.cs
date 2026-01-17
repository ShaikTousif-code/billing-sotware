namespace BillingAPI.Models;

// Time Tracking for Projects
public class TimeEntry
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ProjectId { get; set; }
    public int? UserId { get; set; } // Employee/Team member
    public string EmployeeName { get; set; } = string.Empty;
    public DateTime EntryDate { get; set; }
    public decimal Hours { get; set; }
    public string? Description { get; set; }
    public string TaskType { get; set; } = string.Empty; // Development, Testing, Design, etc.
    public bool IsBillable { get; set; } = true;
    public decimal? HourlyRate { get; set; }
    public decimal? TotalAmount { get; set; } // Hours * HourlyRate
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected, Billed
    public int? ApprovedById { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Project? Project { get; set; }
    public User? User { get; set; }
    public User? ApprovedBy { get; set; }
}

