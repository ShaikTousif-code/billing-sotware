using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;
    private readonly IMedicalWorkflowService _workflowService;

    public AppointmentsController(IAppointmentService appointmentService, IMedicalWorkflowService workflowService)
    {
        _appointmentService = appointmentService;
        _workflowService = workflowService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAppointments(
        [FromQuery] DateTime? date,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? status,
        [FromQuery] int? patientId,
        [FromQuery] int? customerId,
        [FromQuery] int? doctorId)
    {
        try
        {
            var tenantId = GetTenantId();
            var appointments = await _appointmentService.GetAppointmentsAsync(
                tenantId, date, startDate, endDate, status, patientId, customerId, doctorId);

            return Ok(ApiResponse<List<Appointment>>.SuccessResponse(appointments));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAppointment(int id)
    {
        try
        {
            var tenantId = GetTenantId();
            var appointment = await _appointmentService.GetAppointmentByIdAsync(id, tenantId);

            if (appointment == null)
                return NotFound(ApiResponse<Appointment>.ErrorResponse("Appointment not found"));

            return Ok(ApiResponse<Appointment>.SuccessResponse(appointment));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateAppointment([FromBody] Appointment appointment)
    {
        try
        {
            var tenantId = GetTenantId();
            appointment.TenantId = tenantId;
            appointment.CreatedById = GetUserId();

            // Validate that either PatientId or CustomerId is provided
            if (!appointment.PatientId.HasValue && !appointment.CustomerId.HasValue)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Either PatientId or CustomerId must be provided"));
            }

            var createdAppointment = await _appointmentService.CreateAppointmentAsync(appointment);
            return CreatedAtAction(nameof(GetAppointment), new { id = createdAppointment.Id },
                ApiResponse<Appointment>.SuccessResponse(createdAppointment, "Appointment created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse($"Error creating appointment: {ex.Message}"));
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAppointment(int id, [FromBody] Appointment appointment)
    {
        try
        {
            var tenantId = GetTenantId();
            appointment.Id = id;
            appointment.TenantId = tenantId;

            var updatedAppointment = await _appointmentService.UpdateAppointmentAsync(appointment);
            return Ok(ApiResponse<Appointment>.SuccessResponse(updatedAppointment, "Appointment updated successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse($"Error updating appointment: {ex.Message}"));
        }
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateAppointmentStatus(int id, [FromBody] UpdateAppointmentStatusRequest request)
    {
        try
        {
            var tenantId = GetTenantId();
            var appointment = await _appointmentService.UpdateAppointmentStatusAsync(
                id, tenantId, request.Status, request.CancellationReason);

            return Ok(ApiResponse<Appointment>.SuccessResponse(appointment, "Appointment status updated successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse($"Error updating appointment status: {ex.Message}"));
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAppointment(int id)
    {
        try
        {
            var tenantId = GetTenantId();
            var deleted = await _appointmentService.DeleteAppointmentAsync(id, tenantId);

            if (!deleted)
                return NotFound(ApiResponse<object>.ErrorResponse("Appointment not found"));

            return Ok(ApiResponse<object>.SuccessResponse(null, "Appointment deleted successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse($"Error deleting appointment: {ex.Message}"));
        }
    }

    [HttpGet("available-slots")]
    public async Task<IActionResult> GetAvailableTimeSlots(
        [FromQuery] DateTime date,
        [FromQuery] int? doctorId,
        [FromQuery] int durationMinutes = 30)
    {
        try
        {
            var tenantId = GetTenantId();
            var slots = await _appointmentService.GetAvailableTimeSlotsAsync(tenantId, date, doctorId, durationMinutes);
            return Ok(ApiResponse<List<TimeSpan>>.SuccessResponse(slots));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("check-availability")]
    public async Task<IActionResult> CheckAvailability(
        [FromQuery] DateTime date,
        [FromQuery] TimeSpan time,
        [FromQuery] int durationMinutes = 30,
        [FromQuery] int? doctorId = null,
        [FromQuery] int? excludeAppointmentId = null)
    {
        try
        {
            var tenantId = GetTenantId();
            var isAvailable = await _appointmentService.IsTimeSlotAvailableAsync(
                tenantId, date, time, durationMinutes, doctorId, excludeAppointmentId);
            return Ok(ApiResponse<bool>.SuccessResponse(isAvailable));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("doctor/{doctorId}/schedule")]
    public async Task<IActionResult> GetDoctorSchedule(int doctorId, [FromQuery] DateTime date)
    {
        try
        {
            var tenantId = GetTenantId();
            var appointments = await _appointmentService.GetDoctorScheduleAsync(tenantId, doctorId, date);
            return Ok(ApiResponse<List<Appointment>>.SuccessResponse(appointments));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("patient/{patientId}")]
    public async Task<IActionResult> GetPatientAppointments(int patientId, [FromQuery] bool includeCompleted = false)
    {
        try
        {
            var tenantId = GetTenantId();
            var appointments = await _appointmentService.GetPatientAppointmentsAsync(tenantId, patientId, includeCompleted);
            return Ok(ApiResponse<List<Appointment>>.SuccessResponse(appointments));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("calendar")]
    public async Task<IActionResult> GetCalendarView(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] int? doctorId = null)
    {
        try
        {
            var tenantId = GetTenantId();
            var appointments = await _appointmentService.GetAppointmentsByDateRangeAsync(tenantId, startDate, endDate, doctorId);
            return Ok(ApiResponse<Dictionary<DateTime, List<Appointment>>>.SuccessResponse(appointments));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("by-status")]
    public async Task<IActionResult> GetAppointmentsByStatus([FromQuery] DateTime? date = null)
    {
        try
        {
            var tenantId = GetTenantId();
            var appointments = await _appointmentService.GetAppointmentsByStatusAsync(tenantId, date);
            return Ok(ApiResponse<Dictionary<string, List<Appointment>>>.SuccessResponse(appointments));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("{id}/start-consultation")]
    public async Task<IActionResult> StartConsultation(int id, [FromBody] StartConsultationRequest? request = null)
    {
        try
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            var doctorId = request?.DoctorId ?? userId;
            var paymentMode = request?.ConsultationFeePaymentMode;
            
            var (medicalRecord, consultationInvoice) = await _workflowService.StartConsultationAsync(id, tenantId, doctorId, paymentMode);
            
            var response = new
            {
                MedicalRecord = medicalRecord,
                ConsultationInvoice = consultationInvoice,
                Message = consultationInvoice != null 
                    ? "Consultation started and consultation fee billed successfully" 
                    : "Consultation started successfully (no consultation fee)"
            };
            
            return Ok(ApiResponse<object>.SuccessResponse(response, response.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse($"Error starting consultation: {ex.Message}"));
        }
    }

    [HttpGet("{id}/workflow-status")]
    public async Task<IActionResult> GetAppointmentWorkflowStatus(int id)
    {
        try
        {
            var tenantId = GetTenantId();
            var status = await _workflowService.GetAppointmentWorkflowStatusAsync(id, tenantId);
            return Ok(ApiResponse<AppointmentWorkflowStatus>.SuccessResponse(status));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("UserId")?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }
}

public class StartConsultationRequest
{
    public int? DoctorId { get; set; }
    public string? ConsultationFeePaymentMode { get; set; } // Cash, UPI, Card, BankTransfer, etc.
}

public class UpdateAppointmentStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? CancellationReason { get; set; }
}

