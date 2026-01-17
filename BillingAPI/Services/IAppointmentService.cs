using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IAppointmentService
{
    Task<Appointment> CreateAppointmentAsync(Appointment appointment);
    Task<Appointment?> GetAppointmentByIdAsync(int id, int tenantId);
    Task<List<Appointment>> GetAppointmentsAsync(int tenantId, DateTime? date = null, DateTime? startDate = null, DateTime? endDate = null, string? status = null, int? patientId = null, int? customerId = null, int? doctorId = null);
    Task<Appointment> UpdateAppointmentAsync(Appointment appointment);
    Task<bool> DeleteAppointmentAsync(int id, int tenantId);
    Task<Appointment> UpdateAppointmentStatusAsync(int id, int tenantId, string status, string? cancellationReason = null);
    
    // Scheduling logic
    Task<List<TimeSpan>> GetAvailableTimeSlotsAsync(int tenantId, DateTime date, int? doctorId = null, int durationMinutes = 30);
    Task<bool> IsTimeSlotAvailableAsync(int tenantId, DateTime date, TimeSpan time, int durationMinutes, int? doctorId = null, int? excludeAppointmentId = null);
    Task<List<Appointment>> GetDoctorScheduleAsync(int tenantId, int doctorId, DateTime date);
    Task<List<Appointment>> GetPatientAppointmentsAsync(int tenantId, int patientId, bool includeCompleted = false);
    
    // Calendar views
    Task<Dictionary<DateTime, List<Appointment>>> GetAppointmentsByDateRangeAsync(int tenantId, DateTime startDate, DateTime endDate, int? doctorId = null);
    Task<Dictionary<string, List<Appointment>>> GetAppointmentsByStatusAsync(int tenantId, DateTime? date = null);
}
