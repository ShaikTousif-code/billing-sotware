namespace BillingAPI.Models;

public class SupportTicket
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int? UserId { get; set; } // Optional - user who submitted the ticket
    public string TicketNumber { get; set; } = string.Empty; // Auto-generated ticket number
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Priority { get; set; } = "Medium"; // Low, Medium, High, Urgent
    public string Status { get; set; } = "Open"; // Open, InProgress, Resolved, Closed
    public string? AssignedTo { get; set; } // Support staff assigned to handle
    public string? Resolution { get; set; } // Resolution notes
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public User? User { get; set; }
}

