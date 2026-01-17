using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IFeeAssignmentService
{
    Task<List<Fee>> AssignFeesToStudentAsync(int studentId, int tenantId, string academicYear);
    Task<List<Fee>> AssignFeesToClassAsync(int classId, int tenantId, string academicYear);
    Task<List<Fee>> GenerateInstallmentFeesAsync(int feeStructureId, int studentId, int tenantId, string academicYear);
    Task ApplyLateFeesAsync(int tenantId);
    Task<Fee> CreateFeeWithInstallmentsAsync(FeeStructure feeStructure, Student student, int tenantId, string academicYear);
}

