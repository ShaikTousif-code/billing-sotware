namespace BillingAPI.Models;

// Installment Configuration for Fee Structure
public class FeeInstallment
{
    public int Id { get; set; }
    public int FeeStructureId { get; set; }
    public int InstallmentNumber { get; set; } // 1, 2, 3, 4
    public decimal Amount { get; set; } // Amount for this installment
    public DateTime DueDate { get; set; } // Fixed due date
    public decimal? LateFeeAmount { get; set; } // Late fee if paid after due date
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public FeeStructure? FeeStructure { get; set; }
}

