using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class StudentService : IStudentService
{
    private readonly ApplicationDbContext _context;

    public StudentService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Student>> GetStudentsAsync(int tenantId, int? classId = null, string? status = null)
    {
        var query = _context.Students
            .Include(s => s.Class)
            .Where(s => s.TenantId == tenantId);

        if (classId.HasValue)
            query = query.Where(s => s.ClassId == classId.Value);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(s => s.Status == status);

        return await query.OrderBy(s => s.StudentId).ToListAsync();
    }

    public async Task<Student?> GetStudentByIdAsync(int id, int tenantId)
    {
        return await _context.Students
            .Include(s => s.Class)
            .Include(s => s.Fees)
            .ThenInclude(f => f.FeeStructure)
            .FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId);
    }

    public async Task<Student> CreateStudentAsync(Student student)
    {
        if (string.IsNullOrEmpty(student.StudentId))
        {
            student.StudentId = await GenerateStudentIdAsync(student.TenantId);
        }

        student.CreatedAt = DateTime.UtcNow;
        student.OutstandingFees = student.TotalFees - student.PaidFees;

        _context.Students.Add(student);
        await _context.SaveChangesAsync();
        
        // Update class strength if student is assigned to a class
        if (student.ClassId.HasValue && student.Status == "Active")
        {
            await UpdateClassStrengthAsync(student.ClassId.Value, student.TenantId);
        }
        
        return student;
    }

    public async Task<Student> UpdateStudentAsync(Student student)
    {
        // Get the original student to check if class changed
        var originalStudent = await _context.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == student.Id);
        
        student.UpdatedAt = DateTime.UtcNow;
        student.OutstandingFees = student.TotalFees - student.PaidFees;

        _context.Students.Update(student);
        await _context.SaveChangesAsync();
        
        // Update class strength for old and new classes if class changed or status changed
        if (originalStudent != null)
        {
            var classChanged = originalStudent.ClassId != student.ClassId;
            var statusChanged = originalStudent.Status != student.Status;
            
            if (classChanged || statusChanged)
            {
                // Update old class strength if class changed
                if (classChanged && originalStudent.ClassId.HasValue)
                {
                    await UpdateClassStrengthAsync(originalStudent.ClassId.Value, student.TenantId);
                }
                
                // Update new class strength
                if (student.ClassId.HasValue && student.Status == "Active")
                {
                    await UpdateClassStrengthAsync(student.ClassId.Value, student.TenantId);
                }
            }
            else if (student.ClassId.HasValue && student.Status == "Active")
            {
                // Just update current class if no change but student is active
                await UpdateClassStrengthAsync(student.ClassId.Value, student.TenantId);
            }
        }
        
        return student;
    }

    public async Task<bool> DeleteStudentAsync(int id, int tenantId)
    {
        var student = await _context.Students
            .FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId);

        if (student == null) return false;

        var classId = student.ClassId; // Store before deletion
        
        _context.Students.Remove(student);
        await _context.SaveChangesAsync();
        
        // Update class strength if student was assigned to a class
        if (classId.HasValue)
        {
            await UpdateClassStrengthAsync(classId.Value, tenantId);
        }
        
        return true;
    }

    public async Task<string> GenerateStudentIdAsync(int tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var lastStudent = await _context.Students
            .Where(s => s.TenantId == tenantId && s.StudentId.StartsWith($"STU-{year}"))
            .OrderByDescending(s => s.StudentId)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastStudent != null)
        {
            var parts = lastStudent.StudentId.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"STU-{year}-{nextNumber:D5}";
    }

    public async Task<List<Fee>> GetStudentFeesAsync(int studentId, int tenantId)
    {
        return await _context.Fees
            .Include(f => f.FeeStructure)
            .Where(f => f.StudentId == studentId && f.TenantId == tenantId)
            .OrderByDescending(f => f.DueDate)
            .ToListAsync();
    }

    public async Task<decimal> GetStudentOutstandingAsync(int studentId, int tenantId)
    {
        return await _context.Fees
            .Where(f => f.StudentId == studentId && f.TenantId == tenantId)
            .SumAsync(f => f.BalanceAmount);
    }

    private async Task UpdateClassStrengthAsync(int classId, int tenantId)
    {
        var studentCount = await _context.Students
            .CountAsync(s => s.ClassId == classId && s.TenantId == tenantId && s.Status == "Active");
        
        var classEntity = await _context.Classes
            .FirstOrDefaultAsync(c => c.Id == classId && c.TenantId == tenantId);
        
        if (classEntity != null && classEntity.CurrentStrength != studentCount)
        {
            classEntity.CurrentStrength = studentCount;
            _context.Classes.Update(classEntity);
            await _context.SaveChangesAsync();
        }
    }
}

