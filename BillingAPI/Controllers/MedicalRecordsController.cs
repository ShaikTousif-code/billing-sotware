using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Models;
using BillingAPI.Data;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/medical-records")]
[Authorize]
public class MedicalRecordsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public MedicalRecordsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("pharmacy/pending")]
    public async Task<IActionResult> GetPharmacyPendingRecords()
    {
        try
        {
            var tenantId = GetTenantId();
            
            // Get all medical record IDs that have medicine invoices
            var medicineInvoiceRecordIds = await _context.Invoices
                .Where(i => i.TenantId == tenantId && i.Notes != null && i.Notes.Contains("Medicine bill"))
                .Select(i => i.MedicalRecordId)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .ToListAsync();
            
            // Get medical records with completed consultation that don't have medicine invoice yet
            var records = await _context.MedicalRecords
                .Include(m => m.Patient)
                .Include(m => m.Provider)
                .Include(m => m.Prescriptions)
                .Where(m => m.TenantId == tenantId 
                    && m.Status == "Completed" // Consultation completed
                    && m.Prescriptions.Any(p => p.TotalPrice.HasValue && p.TotalPrice > 0) // Has billable prescriptions
                    && !medicineInvoiceRecordIds.Contains(m.Id)) // No medicine invoice yet
                .OrderByDescending(m => m.VisitDate)
                .ThenByDescending(m => m.CreatedAt)
                .ToListAsync();

            return Ok(ApiResponse<List<MedicalRecord>>.SuccessResponse(records));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResponse($"An error occurred: {ex.Message}"));
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetMedicalRecords(
        [FromQuery] int? patientId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? status)
    {
        try
        {
            var tenantId = GetTenantId();
            var query = _context.MedicalRecords
                .Include(m => m.Patient)
                .Include(m => m.Provider)
                .Where(m => m.TenantId == tenantId);

        if (patientId.HasValue)
            query = query.Where(m => m.PatientId == patientId.Value);

        if (fromDate.HasValue)
            query = query.Where(m => m.VisitDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(m => m.VisitDate <= toDate.Value);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(m => m.Status == status);

            var records = await query
                .OrderByDescending(m => m.VisitDate)
                .ThenByDescending(m => m.CreatedAt)
                .ToListAsync();

            return Ok(ApiResponse<List<MedicalRecord>>.SuccessResponse(records));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResponse($"An error occurred: {ex.Message}"));
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetMedicalRecord(int id)
    {
        var tenantId = GetTenantId();
        var record = await _context.MedicalRecords
            .Include(m => m.Patient)
            .Include(m => m.Provider)
            .Include(m => m.Diagnoses)
            .Include(m => m.Procedures)
            .Include(m => m.Prescriptions)
            .FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenantId);

        if (record == null)
            return NotFound(ApiResponse<MedicalRecord>.ErrorResponse("Medical record not found"));

        return Ok(ApiResponse<MedicalRecord>.SuccessResponse(record));
    }

    [HttpPost]
    public async Task<IActionResult> CreateMedicalRecord([FromBody] MedicalRecord record)
    {
        var tenantId = GetTenantId();
        record.TenantId = tenantId;

        // Generate Visit Number if not provided
        if (string.IsNullOrEmpty(record.VisitNumber))
        {
            record.VisitNumber = await GenerateVisitNumberAsync(tenantId);
        }

        record.CreatedAt = DateTime.UtcNow;
        _context.MedicalRecords.Add(record);
        await _context.SaveChangesAsync();

        // Load related data for response
        await _context.Entry(record)
            .Reference(m => m.Patient).LoadAsync();
        await _context.Entry(record)
            .Reference(m => m.Provider).LoadAsync();

        return CreatedAtAction(nameof(GetMedicalRecord), new { id = record.Id },
            ApiResponse<MedicalRecord>.SuccessResponse(record, "Medical record created successfully"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMedicalRecord(int id, [FromBody] MedicalRecord record)
    {
        var tenantId = GetTenantId();
        var existingRecord = await _context.MedicalRecords
            .Include(m => m.Diagnoses)
            .Include(m => m.Procedures)
            .Include(m => m.Prescriptions)
            .FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenantId);

        if (existingRecord == null)
            return NotFound(ApiResponse<MedicalRecord>.ErrorResponse("Medical record not found"));

        // Update basic fields
        existingRecord.PatientId = record.PatientId;
        existingRecord.ProviderId = record.ProviderId;
        existingRecord.VisitDate = record.VisitDate;
        existingRecord.VisitType = record.VisitType;
        existingRecord.ChiefComplaint = record.ChiefComplaint;
        existingRecord.HistoryOfPresentIllness = record.HistoryOfPresentIllness;
        existingRecord.ReviewOfSystems = record.ReviewOfSystems;
        existingRecord.PhysicalExamination = record.PhysicalExamination;
        existingRecord.Assessment = record.Assessment;
        existingRecord.Plan = record.Plan;
        existingRecord.Notes = record.Notes;
        existingRecord.Height = record.Height;
        existingRecord.Weight = record.Weight;
        existingRecord.BloodPressureSystolic = record.BloodPressureSystolic;
        existingRecord.BloodPressureDiastolic = record.BloodPressureDiastolic;
        existingRecord.Temperature = record.Temperature;
        existingRecord.Pulse = record.Pulse;
        existingRecord.RespiratoryRate = record.RespiratoryRate;
        existingRecord.OxygenSaturation = record.OxygenSaturation;
        existingRecord.Status = record.Status;
        existingRecord.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<MedicalRecord>.SuccessResponse(existingRecord, "Medical record updated successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMedicalRecord(int id)
    {
        var tenantId = GetTenantId();
        var record = await _context.MedicalRecords
            .FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenantId);

        if (record == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Medical record not found"));

        _context.MedicalRecords.Remove(record);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.SuccessResponse(null, "Medical record deleted successfully"));
    }

    [HttpPost("{id}/diagnoses")]
    public async Task<IActionResult> AddDiagnosis(int id, [FromBody] Diagnosis diagnosis)
    {
        var tenantId = GetTenantId();
        var record = await _context.MedicalRecords
            .FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenantId);

        if (record == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Medical record not found"));

        diagnosis.TenantId = tenantId;
        diagnosis.MedicalRecordId = id;
        diagnosis.CreatedAt = DateTime.UtcNow;

        _context.Diagnoses.Add(diagnosis);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<Diagnosis>.SuccessResponse(diagnosis, "Diagnosis added successfully"));
    }

    [HttpPost("{id}/procedures")]
    public async Task<IActionResult> AddProcedure(int id, [FromBody] Procedure procedure)
    {
        var tenantId = GetTenantId();
        var record = await _context.MedicalRecords
            .FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenantId);

        if (record == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Medical record not found"));

        procedure.TenantId = tenantId;
        procedure.MedicalRecordId = id;
        procedure.TotalAmount = procedure.Quantity * procedure.UnitPrice;
        procedure.ProcedureDate = procedure.ProcedureDate == default ? DateTime.UtcNow : procedure.ProcedureDate;
        procedure.CreatedAt = DateTime.UtcNow;

        _context.Procedures.Add(procedure);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<Procedure>.SuccessResponse(procedure, "Procedure added successfully"));
    }

    [HttpPost("{id}/prescriptions")]
    public async Task<IActionResult> AddPrescription(int id, [FromBody] Prescription prescription)
    {
        var tenantId = GetTenantId();
        var record = await _context.MedicalRecords
            .FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenantId);

        if (record == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Medical record not found"));

        prescription.TenantId = tenantId;
        prescription.MedicalRecordId = id;
        prescription.PatientId = record.PatientId;

        // Generate Prescription Number if not provided
        if (string.IsNullOrEmpty(prescription.PrescriptionNumber))
        {
            prescription.PrescriptionNumber = await GeneratePrescriptionNumberAsync(tenantId);
        }

        prescription.PrescribedDate = prescription.PrescribedDate == default ? DateTime.UtcNow : prescription.PrescribedDate;
        
        // Calculate total price if unit price is provided
        if (prescription.UnitPrice.HasValue)
        {
            prescription.TotalPrice = prescription.Quantity * prescription.UnitPrice.Value;
        }
        
        prescription.CreatedAt = DateTime.UtcNow;

        _context.Prescriptions.Add(prescription);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<Prescription>.SuccessResponse(prescription, "Prescription added successfully"));
    }

    [HttpPost("{id}/generate-bill")]
    public async Task<IActionResult> GenerateBillFromMedicalRecord(int id, [FromBody] GenerateMedicalBillRequest? request = null)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();
        
        var record = await _context.MedicalRecords
            .Include(m => m.Patient)
            .Include(m => m.Prescriptions)
            .Include(m => m.Procedures)
            .FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenantId);

        if (record == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Medical record not found"));

        // Get prescriptions and procedures to bill
        var prescriptionsToBill = record.Prescriptions
            .Where(p => request == null || !request.PrescriptionIds.Any() || request.PrescriptionIds.Contains(p.Id))
            .Where(p => p.TotalPrice.HasValue && p.TotalPrice > 0)
            .ToList();

        var proceduresToBill = record.Procedures
            .Where(p => request == null || !request.ProcedureIds.Any() || request.ProcedureIds.Contains(p.Id))
            .Where(p => p.TotalAmount > 0)
            .ToList();

        if (!prescriptionsToBill.Any() && !proceduresToBill.Any())
            return BadRequest(ApiResponse<object>.ErrorResponse("No billable items found. Please ensure prescriptions have prices or procedures are added."));

        // Create invoice
        var invoice = new Invoice
        {
            TenantId = tenantId,
            PatientId = record.PatientId,
            MedicalRecordId = id,
            InvoiceDate = request?.InvoiceDate ?? DateTime.UtcNow,
            Status = "Draft",
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            Notes = $"Bill for visit {record.VisitNumber} - {record.ChiefComplaint}"
        };

        // Generate invoice number
        var config = await _context.TenantConfigurations
            .FirstOrDefaultAsync(c => c.TenantId == tenantId);
        var prefix = config?.InvoicePrefix ?? "INV";
        var year = DateTime.UtcNow.Year;
        var lastInvoice = await _context.Invoices
            .Where(i => i.TenantId == tenantId && i.InvoiceNumber.StartsWith($"{prefix}-{year}"))
            .OrderByDescending(i => i.InvoiceNumber)
            .FirstOrDefaultAsync();
        int nextNumber = 1;
        if (lastInvoice != null)
        {
            var parts = lastInvoice.InvoiceNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNum))
                nextNumber = lastNum + 1;
        }
        invoice.InvoiceNumber = $"{prefix}-{year}-{nextNumber:D6}";

        // Add prescription items to invoice
        foreach (var prescription in prescriptionsToBill)
        {
            var product = prescription.ProductId.HasValue 
                ? await _context.Products.FindAsync(prescription.ProductId.Value)
                : null;

            invoice.Items.Add(new InvoiceItem
            {
                ProductId = prescription.ProductId ?? 0,
                ProductName = product?.Name ?? prescription.MedicationName,
                Quantity = prescription.Quantity,
                UnitPrice = prescription.UnitPrice ?? 0,
                DiscountAmount = 0,
                TaxRate = 0, // Can be configured
                TaxAmount = 0,
                TotalAmount = prescription.TotalPrice ?? 0
            });
        }

        // Add procedure items to invoice
        foreach (var procedure in proceduresToBill)
        {
            invoice.Items.Add(new InvoiceItem
            {
                ProductId = 0, // Procedures don't have products
                ProductName = procedure.Description ?? $"Procedure {procedure.CPTCode}",
                Quantity = procedure.Quantity,
                UnitPrice = procedure.UnitPrice,
                DiscountAmount = 0,
                TaxRate = 0,
                TaxAmount = 0,
                TotalAmount = procedure.TotalAmount
            });
        }

        // Calculate totals
        invoice.SubTotal = invoice.Items.Sum(i => i.TotalAmount);
        invoice.TaxAmount = invoice.Items.Sum(i => i.TaxAmount);
        invoice.DiscountAmount = request?.DiscountAmount ?? 0;
        invoice.TotalAmount = invoice.SubTotal + invoice.TaxAmount - invoice.DiscountAmount;
        invoice.BalanceAmount = invoice.TotalAmount;

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        // Load related data for response
        await _context.Entry(invoice)
            .Reference(i => i.Patient).LoadAsync();
        await _context.Entry(invoice)
            .Reference(i => i.MedicalRecord).LoadAsync();
        await _context.Entry(invoice)
            .Collection(i => i.Items).LoadAsync();

        return Ok(ApiResponse<Invoice>.SuccessResponse(invoice, "Bill generated successfully from medical record"));
    }

    private async Task<string> GenerateVisitNumberAsync(int tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var lastRecord = await _context.MedicalRecords
            .Where(m => m.TenantId == tenantId && m.VisitNumber.StartsWith($"VISIT-{year}"))
            .OrderByDescending(m => m.VisitNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastRecord != null)
        {
            var parts = lastRecord.VisitNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"VISIT-{year}-{nextNumber:D6}";
    }

    private async Task<string> GeneratePrescriptionNumberAsync(int tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var lastPrescription = await _context.Prescriptions
            .Where(p => p.TenantId == tenantId && p.PrescriptionNumber.StartsWith($"RX-{year}"))
            .OrderByDescending(p => p.PrescriptionNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastPrescription != null)
        {
            var parts = lastPrescription.PrescriptionNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"RX-{year}-{nextNumber:D6}";
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }
}

