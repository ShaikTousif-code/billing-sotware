namespace BillingAPI.Models;

// Document Management
public class Document
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string DocumentType { get; set; } = string.Empty; // FeeReceipt, Contract, Invoice, ProjectDocument, etc.
    public string? EntityType { get; set; } // Student, Project, Contract, Invoice
    public int? EntityId { get; set; } // ID of the related entity
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty; // PDF, JPG, PNG, DOCX, etc.
    public long FileSize { get; set; } // in bytes
    public string? Description { get; set; }
    public string? Tags { get; set; } // Comma-separated tags
    public int CreatedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public User? CreatedBy { get; set; }
}

