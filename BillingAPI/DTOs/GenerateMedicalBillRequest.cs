namespace BillingAPI.DTOs;

public class GenerateMedicalBillRequest
{
    public DateTime? InvoiceDate { get; set; }
    public List<int>? PrescriptionIds { get; set; } // Specific prescriptions to bill (empty = all)
    public List<int>? ProcedureIds { get; set; } // Specific procedures to bill (empty = all)
    public decimal DiscountAmount { get; set; } = 0;
}

