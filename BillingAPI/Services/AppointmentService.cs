using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class AppointmentService : IAppointmentService
{
    private readonly ApplicationDbContext _context;
    private readonly TimeSpan _defaultStartTime = new TimeSpan(9, 0, 0); // 9:00 AM
    private readonly TimeSpan _defaultEndTime = new TimeSpan(17, 0, 0); // 5:00 PM
    private readonly int _defaultSlotInterval = 30; // 30 minutes

    public AppointmentService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Appointment> CreateAppointmentAsync(Appointment appointment)
    {
        // Check if time slot is available
        if (!await IsTimeSlotAvailableAsync(
            appointment.TenantId,
            appointment.AppointmentDate,
            appointment.AppointmentTime,
            appointment.DurationMinutes,
            appointment.AssignedToUserId,
            null))
        {
            throw new InvalidOperationException("The selected time slot is not available.");
        }

        appointment.CreatedAt = DateTime.UtcNow;
        appointment.Status = appointment.Status ?? "Scheduled";

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        // Load navigation properties
        await _context.Entry(appointment)
            .Reference(a => a.Patient)
            .LoadAsync();
        await _context.Entry(appointment)
            .Reference(a => a.Customer)
            .LoadAsync();
        await _context.Entry(appointment)
            .Reference(a => a.AssignedTo)
            .LoadAsync();
        await _context.Entry(appointment)
            .Reference(a => a.Service)
            .LoadAsync();

        return appointment;
    }

    public async Task<Appointment?> GetAppointmentByIdAsync(int id, int tenantId)
    {
        return await _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Customer)
            .Include(a => a.AssignedTo)
            .Include(a => a.Service)
            .Include(a => a.Invoice)
            .Include(a => a.MedicalRecord)
            .Include(a => a.CreatedBy)
            .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId);
    }

    public async Task<List<Appointment>> GetAppointmentsAsync(
        int tenantId,
        DateTime? date = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        string? status = null,
        int? patientId = null,
        int? customerId = null,
        int? doctorId = null)
    {
        var query = _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Customer)
            .Include(a => a.AssignedTo)
            .Include(a => a.Service)
            .Where(a => a.TenantId == tenantId);

        if (date.HasValue)
        {
            query = query.Where(a => a.AppointmentDate.Date == date.Value.Date);
        }

        if (startDate.HasValue)
        {
            query = query.Where(a => a.AppointmentDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(a => a.AppointmentDate <= endDate.Value);
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(a => a.Status == status);
        }

        if (patientId.HasValue)
        {
            query = query.Where(a => a.PatientId == patientId.Value);
        }

        if (customerId.HasValue)
        {
            query = query.Where(a => a.CustomerId == customerId.Value);
        }

        if (doctorId.HasValue)
        {
            query = query.Where(a => a.AssignedToUserId == doctorId.Value);
        }

        return await query
            .OrderBy(a => a.AppointmentDate)
            .ThenBy(a => a.AppointmentTime)
            .ToListAsync();
    }

    public async Task<Appointment> UpdateAppointmentAsync(Appointment appointment)
    {
        var existing = await _context.Appointments
            .FirstOrDefaultAsync(a => a.Id == appointment.Id && a.TenantId == appointment.TenantId);

        if (existing == null)
            throw new InvalidOperationException("Appointment not found.");

        // Check availability if date/time changed
        if (existing.AppointmentDate != appointment.AppointmentDate ||
            existing.AppointmentTime != appointment.AppointmentTime ||
            existing.DurationMinutes != appointment.DurationMinutes ||
            existing.AssignedToUserId != appointment.AssignedToUserId)
        {
            if (!await IsTimeSlotAvailableAsync(
                appointment.TenantId,
                appointment.AppointmentDate,
                appointment.AppointmentTime,
                appointment.DurationMinutes,
                appointment.AssignedToUserId,
                appointment.Id))
            {
                throw new InvalidOperationException("The selected time slot is not available.");
            }
        }

        // Update fields
        existing.PatientId = appointment.PatientId;
        existing.CustomerId = appointment.CustomerId;
        existing.ServiceId = appointment.ServiceId;
        existing.AppointmentType = appointment.AppointmentType;
        existing.Specialty = appointment.Specialty;
        existing.AppointmentDate = appointment.AppointmentDate;
        existing.AppointmentTime = appointment.AppointmentTime;
        existing.DurationMinutes = appointment.DurationMinutes;
        existing.Status = appointment.Status;
        existing.AssignedToUserId = appointment.AssignedToUserId;
        existing.DoctorName = appointment.DoctorName;
        existing.Location = appointment.Location;
        existing.Notes = appointment.Notes;
        existing.ReasonForVisit = appointment.ReasonForVisit;
        existing.UpdatedAt = DateTime.UtcNow;

        // Update status timestamps
        if (existing.Status == "Confirmed" && appointment.Status == "Confirmed" && existing.ConfirmedAt == null)
        {
            existing.ConfirmedAt = DateTime.UtcNow;
        }

        if (existing.Status == "Completed" && appointment.Status == "Completed" && existing.CompletedAt == null)
        {
            existing.CompletedAt = DateTime.UtcNow;
        }

        if (existing.Status == "Cancelled" && appointment.Status == "Cancelled")
        {
            existing.CancelledAt = DateTime.UtcNow;
            existing.CancellationReason = appointment.CancellationReason;
        }

        await _context.SaveChangesAsync();

        // Reload navigation properties
        await _context.Entry(existing)
            .Reference(a => a.Patient)
            .LoadAsync();
        await _context.Entry(existing)
            .Reference(a => a.Customer)
            .LoadAsync();
        await _context.Entry(existing)
            .Reference(a => a.AssignedTo)
            .LoadAsync();

        return existing;
    }

    public async Task<bool> DeleteAppointmentAsync(int id, int tenantId)
    {
        var appointment = await _context.Appointments
            .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId);

        if (appointment == null)
            return false;

        // Don't allow deletion of completed appointments
        if (appointment.Status == "Completed")
        {
            throw new InvalidOperationException("Cannot delete a completed appointment.");
        }

        _context.Appointments.Remove(appointment);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<Appointment> UpdateAppointmentStatusAsync(int id, int tenantId, string status, string? cancellationReason = null)
    {
        var appointment = await _context.Appointments
            .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId);

        if (appointment == null)
            throw new InvalidOperationException("Appointment not found.");

        appointment.Status = status;
        appointment.UpdatedAt = DateTime.UtcNow;

        if (status == "Confirmed" && appointment.ConfirmedAt == null)
        {
            appointment.ConfirmedAt = DateTime.UtcNow;
        }

        if (status == "Completed" && appointment.CompletedAt == null)
        {
            appointment.CompletedAt = DateTime.UtcNow;
        }

        if (status == "Cancelled")
        {
            appointment.CancelledAt = DateTime.UtcNow;
            appointment.CancellationReason = cancellationReason;
        }

        await _context.SaveChangesAsync();

        // Reload navigation properties
        await _context.Entry(appointment)
            .Reference(a => a.Patient)
            .LoadAsync();
        await _context.Entry(appointment)
            .Reference(a => a.Customer)
            .LoadAsync();
        await _context.Entry(appointment)
            .Reference(a => a.AssignedTo)
            .LoadAsync();

        return appointment;
    }

    public async Task<List<TimeSpan>> GetAvailableTimeSlotsAsync(
        int tenantId,
        DateTime date,
        int? doctorId = null,
        int durationMinutes = 30)
    {
        var availableSlots = new List<TimeSpan>();
        var currentTime = _defaultStartTime;

        // Get existing appointments for the date
        var existingAppointments = await _context.Appointments
            .Where(a => a.TenantId == tenantId &&
                       a.AppointmentDate.Date == date.Date &&
                       a.Status != "Cancelled" &&
                       a.Status != "NoShow" &&
                       (!doctorId.HasValue || a.AssignedToUserId == doctorId.Value))
            .OrderBy(a => a.AppointmentTime)
            .ToListAsync();

        while (currentTime.Add(TimeSpan.FromMinutes(durationMinutes)) <= _defaultEndTime)
        {
            var slotEnd = currentTime.Add(TimeSpan.FromMinutes(durationMinutes));
            var isAvailable = true;

            // Check for conflicts
            foreach (var appointment in existingAppointments)
            {
                var appointmentEnd = appointment.AppointmentTime.Add(TimeSpan.FromMinutes(appointment.DurationMinutes));

                // Check if slots overlap
                if ((currentTime >= appointment.AppointmentTime && currentTime < appointmentEnd) ||
                    (slotEnd > appointment.AppointmentTime && slotEnd <= appointmentEnd) ||
                    (currentTime <= appointment.AppointmentTime && slotEnd >= appointmentEnd))
                {
                    isAvailable = false;
                    break;
                }
            }

            if (isAvailable)
            {
                availableSlots.Add(currentTime);
            }

            currentTime = currentTime.Add(TimeSpan.FromMinutes(_defaultSlotInterval));
        }

        return availableSlots;
    }

    public async Task<bool> IsTimeSlotAvailableAsync(
        int tenantId,
        DateTime date,
        TimeSpan time,
        int durationMinutes,
        int? doctorId = null,
        int? excludeAppointmentId = null)
    {
        var slotEnd = time.Add(TimeSpan.FromMinutes(durationMinutes));

        // Check if within business hours
        if (time < _defaultStartTime || slotEnd > _defaultEndTime)
        {
            return false;
        }

        var query = _context.Appointments
            .Where(a => a.TenantId == tenantId &&
                       a.AppointmentDate.Date == date.Date &&
                       a.Status != "Cancelled" &&
                       a.Status != "NoShow" &&
                       (!doctorId.HasValue || a.AssignedToUserId == doctorId.Value));

        if (excludeAppointmentId.HasValue)
        {
            query = query.Where(a => a.Id != excludeAppointmentId.Value);
        }

        var conflictingAppointments = await query.ToListAsync();

        foreach (var appointment in conflictingAppointments)
        {
            var appointmentEnd = appointment.AppointmentTime.Add(TimeSpan.FromMinutes(appointment.DurationMinutes));

            // Check for overlap
            if ((time >= appointment.AppointmentTime && time < appointmentEnd) ||
                (slotEnd > appointment.AppointmentTime && slotEnd <= appointmentEnd) ||
                (time <= appointment.AppointmentTime && slotEnd >= appointmentEnd))
            {
                return false;
            }
        }

        return true;
    }

    public async Task<List<Appointment>> GetDoctorScheduleAsync(int tenantId, int doctorId, DateTime date)
    {
        return await _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Customer)
            .Include(a => a.Service)
            .Where(a => a.TenantId == tenantId &&
                       a.AssignedToUserId == doctorId &&
                       a.AppointmentDate.Date == date.Date &&
                       a.Status != "Cancelled")
            .OrderBy(a => a.AppointmentTime)
            .ToListAsync();
    }

    public async Task<List<Appointment>> GetPatientAppointmentsAsync(int tenantId, int patientId, bool includeCompleted = false)
    {
        var query = _context.Appointments
            .Include(a => a.AssignedTo)
            .Include(a => a.Service)
            .Where(a => a.TenantId == tenantId && a.PatientId == patientId);

        if (!includeCompleted)
        {
            query = query.Where(a => a.Status != "Completed" && a.Status != "Cancelled");
        }

        return await query
            .OrderByDescending(a => a.AppointmentDate)
            .ThenByDescending(a => a.AppointmentTime)
            .ToListAsync();
    }

    public async Task<Dictionary<DateTime, List<Appointment>>> GetAppointmentsByDateRangeAsync(
        int tenantId,
        DateTime startDate,
        DateTime endDate,
        int? doctorId = null)
    {
        var query = _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Customer)
            .Include(a => a.AssignedTo)
            .Include(a => a.Service)
            .Where(a => a.TenantId == tenantId &&
                       a.AppointmentDate >= startDate.Date &&
                       a.AppointmentDate <= endDate.Date);

        if (doctorId.HasValue)
        {
            query = query.Where(a => a.AssignedToUserId == doctorId.Value);
        }

        var appointments = await query
            .OrderBy(a => a.AppointmentDate)
            .ThenBy(a => a.AppointmentTime)
            .ToListAsync();

        return appointments
            .GroupBy(a => a.AppointmentDate.Date)
            .ToDictionary(g => g.Key, g => g.ToList());
    }

    public async Task<Dictionary<string, List<Appointment>>> GetAppointmentsByStatusAsync(int tenantId, DateTime? date = null)
    {
        var query = _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Customer)
            .Include(a => a.AssignedTo)
            .Where(a => a.TenantId == tenantId);

        if (date.HasValue)
        {
            query = query.Where(a => a.AppointmentDate.Date == date.Value.Date);
        }

        var appointments = await query.ToListAsync();

        return appointments
            .GroupBy(a => a.Status)
            .ToDictionary(g => g.Key, g => g.ToList());
    }
}
