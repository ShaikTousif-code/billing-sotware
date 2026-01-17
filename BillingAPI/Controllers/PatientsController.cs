using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Models;
using BillingAPI.Data;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/patients")]
[Authorize]
public class PatientsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PatientsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetPatients([FromQuery] string? search, [FromQuery] string? status)
    {
        var tenantId = GetTenantId();
        var query = _context.Patients
            .Where(p => p.TenantId == tenantId);

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(p =>
                p.FirstName.Contains(search) ||
                p.LastName.Contains(search) ||
                p.PatientId.Contains(search) ||
                p.Email!.Contains(search) ||
                p.Phone!.Contains(search));
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(p => p.Status == status);
        }

        var patients = await query
            .OrderBy(p => p.LastName)
            .ThenBy(p => p.FirstName)
            .ToListAsync();

        return Ok(ApiResponse<List<Patient>>.SuccessResponse(patients));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPatient(int id)
    {
        var tenantId = GetTenantId();
        var patient = await _context.Patients
            .Include(p => p.MedicalRecords)
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);

        if (patient == null)
            return NotFound(ApiResponse<Patient>.ErrorResponse("Patient not found"));

        return Ok(ApiResponse<Patient>.SuccessResponse(patient));
    }

    [HttpPost]
    public async Task<IActionResult> CreatePatient([FromBody] Patient patient)
    {
        var tenantId = GetTenantId();
        patient.TenantId = tenantId;

        // Generate Patient ID if not provided
        if (string.IsNullOrEmpty(patient.PatientId))
        {
            patient.PatientId = await GeneratePatientIdAsync(tenantId);
        }

        patient.CreatedAt = DateTime.UtcNow;
        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPatient), new { id = patient.Id },
            ApiResponse<Patient>.SuccessResponse(patient, "Patient created successfully"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePatient(int id, [FromBody] Patient patient)
    {
        var tenantId = GetTenantId();
        var existingPatient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);

        if (existingPatient == null)
            return NotFound(ApiResponse<Patient>.ErrorResponse("Patient not found"));

        // Update fields
        existingPatient.FirstName = patient.FirstName;
        existingPatient.LastName = patient.LastName;
        existingPatient.DateOfBirth = patient.DateOfBirth;
        existingPatient.Gender = patient.Gender;
        existingPatient.Email = patient.Email;
        existingPatient.Phone = patient.Phone;
        existingPatient.Mobile = patient.Mobile;
        existingPatient.Address = patient.Address;
        existingPatient.City = patient.City;
        existingPatient.State = patient.State;
        existingPatient.ZipCode = patient.ZipCode;
        existingPatient.Country = patient.Country;
        existingPatient.BloodGroup = patient.BloodGroup;
        existingPatient.Allergies = patient.Allergies;
        existingPatient.MedicalHistory = patient.MedicalHistory;
        existingPatient.CurrentMedications = patient.CurrentMedications;
        existingPatient.EmergencyContactName = patient.EmergencyContactName;
        existingPatient.EmergencyContactPhone = patient.EmergencyContactPhone;
        existingPatient.EmergencyContactRelation = patient.EmergencyContactRelation;
        existingPatient.InsuranceProvider = patient.InsuranceProvider;
        existingPatient.InsurancePolicyNumber = patient.InsurancePolicyNumber;
        existingPatient.InsuranceGroupNumber = patient.InsuranceGroupNumber;
        existingPatient.InsuranceExpiryDate = patient.InsuranceExpiryDate;
        existingPatient.InsuranceCardNumber = patient.InsuranceCardNumber;
        existingPatient.Status = patient.Status;
        existingPatient.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<Patient>.SuccessResponse(existingPatient, "Patient updated successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePatient(int id)
    {
        var tenantId = GetTenantId();
        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);

        if (patient == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Patient not found"));

        _context.Patients.Remove(patient);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.SuccessResponse(null, "Patient deleted successfully"));
    }

    private async Task<string> GeneratePatientIdAsync(int tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var lastPatient = await _context.Patients
            .Where(p => p.TenantId == tenantId && p.PatientId.StartsWith($"PAT-{year}"))
            .OrderByDescending(p => p.PatientId)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastPatient != null)
        {
            var parts = lastPatient.PatientId.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"PAT-{year}-{nextNumber:D6}";
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

