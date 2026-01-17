using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IStudentService
{
    Task<List<Student>> GetStudentsAsync(int tenantId, int? classId = null, string? status = null);
    Task<Student?> GetStudentByIdAsync(int id, int tenantId);
    Task<Student> CreateStudentAsync(Student student);
    Task<Student> UpdateStudentAsync(Student student);
    Task<bool> DeleteStudentAsync(int id, int tenantId);
    Task<string> GenerateStudentIdAsync(int tenantId);
    Task<List<Fee>> GetStudentFeesAsync(int studentId, int tenantId);
    Task<decimal> GetStudentOutstandingAsync(int studentId, int tenantId);
}

