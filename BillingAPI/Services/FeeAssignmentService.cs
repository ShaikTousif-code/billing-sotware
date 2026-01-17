using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class FeeAssignmentService : IFeeAssignmentService
{
    private readonly ApplicationDbContext _context;
    private readonly IFeeService _feeService;

    public FeeAssignmentService(ApplicationDbContext context, IFeeService feeService)
    {
        _context = context;
        _feeService = feeService;
    }

    public async Task<List<Fee>> AssignFeesToStudentAsync(int studentId, int tenantId, string academicYear)
    {
        var student = await _context.Students
            .Include(s => s.Class)
            .FirstOrDefaultAsync(s => s.Id == studentId && s.TenantId == tenantId);

        if (student == null)
            throw new InvalidOperationException("Student not found");

        if (student.ClassId == null)
            throw new InvalidOperationException("Student is not assigned to a class. Please assign the student to a class first.");

        // Try exact match first
        var feeStructures = await _context.FeeStructures
            .Include(fs => fs.FeeHead)
            .Include(fs => fs.Installments)
            .Where(fs => fs.TenantId == tenantId 
                && fs.AcademicYear == academicYear 
                && fs.IsActive
                && (fs.ClassId == null || fs.ClassId == student.ClassId))
            .ToListAsync();
        
        // If no exact match, try matching by class academic year
        if (!feeStructures.Any() && !string.IsNullOrEmpty(student.Class?.AcademicYear))
        {
            feeStructures = await _context.FeeStructures
                .Include(fs => fs.FeeHead)
                .Include(fs => fs.Installments)
                .Where(fs => fs.TenantId == tenantId 
                    && fs.AcademicYear == student.Class.AcademicYear 
                    && fs.IsActive
                    && (fs.ClassId == null || fs.ClassId == student.ClassId))
                .ToListAsync();
        }

        if (!feeStructures.Any())
        {
            // Get available fee structures for debugging
            var availableStructures = await _context.FeeStructures
                .Where(fs => fs.TenantId == tenantId 
                    && (fs.ClassId == null || fs.ClassId == student.ClassId))
                .Select(fs => new { fs.AcademicYear, fs.IsActive, fs.Name })
                .ToListAsync();
            
            var availableYears = availableStructures
                .Where(fs => fs.IsActive)
                .Select(fs => fs.AcademicYear)
                .Distinct()
                .ToList();
            
            var message = $"No fee structures found for class '{student.Class?.Name ?? "Unknown"}' and academic year '{academicYear}'. ";
            
            if (availableYears.Any())
            {
                message += $"Available academic years with fee structures: {string.Join(", ", availableYears)}. ";
            }
            else
            {
                message += "No fee structures exist for this class. ";
            }
            
            message += "Please create fee structures with the correct academic year.";
            
            throw new InvalidOperationException(message);
        }

        var fees = new List<Fee>();

        foreach (var feeStructure in feeStructures)
        {
            // Check if fee already exists for this student and structure
            var existingFee = await _context.Fees
                .FirstOrDefaultAsync(f => f.StudentId == studentId 
                    && f.FeeStructureId == feeStructure.Id 
                    && f.TenantId == tenantId);

            if (existingFee != null)
                continue; // Skip if fee already assigned

            if (feeStructure.MaxInstallments.HasValue && feeStructure.MaxInstallments > 1)
            {
                // Generate installment-based fees
                var installmentFees = await GenerateInstallmentFeesAsync(
                    feeStructure.Id, studentId, tenantId, academicYear);
                fees.AddRange(installmentFees);
            }
            else
            {
                // Generate single fee - apply student discount
                var fee = await CreateFeeWithInstallmentsAsync(feeStructure, student, tenantId, academicYear);
                
                // Apply student-level discount if active
                if (student.IsDiscountActive)
                {
                    if (student.DiscountPercentage.HasValue && student.DiscountPercentage.Value > 0)
                    {
                        fee.DiscountAmount = fee.Amount * (student.DiscountPercentage.Value / 100);
                    }
                    else if (student.DiscountAmount.HasValue && student.DiscountAmount.Value > 0)
                    {
                        fee.DiscountAmount = student.DiscountAmount.Value;
                    }
                    
                    fee.NetAmount = fee.Amount - fee.DiscountAmount - fee.ScholarshipAmount;
                    fee.BalanceAmount = fee.NetAmount - fee.PaidAmount;
                }
                
                fees.Add(fee);
            }
        }

        // Update student totals
        await UpdateStudentFeeTotalsAsync(studentId, tenantId);

        return fees;
    }

    public async Task<List<Fee>> AssignFeesToClassAsync(int classId, int tenantId, string academicYear)
    {
        // Check if class exists
        var classExists = await _context.Classes
            .AnyAsync(c => c.Id == classId && c.TenantId == tenantId);
        
        if (!classExists)
            throw new InvalidOperationException("Class not found");

        // Check if fee structures exist for this class
        var feeStructures = await _context.FeeStructures
            .Where(fs => fs.TenantId == tenantId 
                && fs.AcademicYear == academicYear 
                && fs.IsActive
                && (fs.ClassId == null || fs.ClassId == classId))
            .ToListAsync();

        if (!feeStructures.Any())
        {
            // Get available fee structures for debugging
            var className = await _context.Classes
                .Where(c => c.Id == classId)
                .Select(c => c.Name)
                .FirstOrDefaultAsync();
            
            var availableStructures = await _context.FeeStructures
                .Where(fs => fs.TenantId == tenantId 
                    && (fs.ClassId == null || fs.ClassId == classId))
                .Select(fs => new { fs.AcademicYear, fs.IsActive, fs.Name })
                .ToListAsync();
            
            var availableYears = availableStructures
                .Where(fs => fs.IsActive)
                .Select(fs => fs.AcademicYear)
                .Distinct()
                .ToList();
            
            var message = $"No fee structures found for class '{className ?? "Unknown"}' and academic year '{academicYear}'. ";
            
            if (availableYears.Any())
            {
                message += $"Available academic years with fee structures: {string.Join(", ", availableYears)}. ";
            }
            else
            {
                message += "No fee structures exist for this class. ";
            }
            
            message += "Please create fee structures with the correct academic year.";
            
            throw new InvalidOperationException(message);
        }

        var students = await _context.Students
            .Where(s => s.ClassId == classId && s.TenantId == tenantId && s.Status == "Active")
            .ToListAsync();

        if (!students.Any())
        {
            throw new InvalidOperationException("No active students found in this class.");
        }

        var allFees = new List<Fee>();

        foreach (var student in students)
        {
            try
            {
                var fees = await AssignFeesToStudentAsync(student.Id, tenantId, academicYear);
                allFees.AddRange(fees);
            }
            catch (InvalidOperationException ex)
            {
                // Log but continue with other students
                // Skip students that can't be assigned fees
                continue;
            }
        }

        return allFees;
    }

    public async Task<List<Fee>> GenerateInstallmentFeesAsync(int feeStructureId, int studentId, int tenantId, string academicYear)
    {
        var feeStructure = await _context.FeeStructures
            .Include(fs => fs.Installments.OrderBy(i => i.InstallmentNumber))
            .FirstOrDefaultAsync(fs => fs.Id == feeStructureId && fs.TenantId == tenantId);

        if (feeStructure == null)
            throw new InvalidOperationException("Fee structure not found");

        var student = await _context.Students.FindAsync(studentId);
        if (student == null)
            throw new InvalidOperationException("Student not found");

        var fees = new List<Fee>();
        var installments = feeStructure.Installments.OrderBy(i => i.InstallmentNumber).ToList();

        if (installments.Any())
        {
            // Use configured installments
            foreach (var installment in installments)
            {
                var fee = new Fee
                {
                    TenantId = tenantId,
                    StudentId = studentId,
                    FeeStructureId = feeStructureId,
                    FeeType = feeStructure.FeeType,
                    Amount = installment.Amount,
                    DueDate = installment.DueDate,
                    InstallmentNumber = installment.InstallmentNumber,
                    Status = "Pending",
                    AcademicYear = academicYear
                };

                // Apply student-level discount if active
                if (student.IsDiscountActive)
                {
                    if (student.DiscountPercentage.HasValue && student.DiscountPercentage.Value > 0)
                    {
                        fee.DiscountAmount = installment.Amount * (student.DiscountPercentage.Value / 100);
                    }
                    else if (student.DiscountAmount.HasValue && student.DiscountAmount.Value > 0)
                    {
                        // For fixed amount, divide by number of installments
                        var installmentCount = feeStructure.Installments.Count > 0 
                            ? feeStructure.Installments.Count 
                            : feeStructure.MaxInstallments ?? 1;
                        fee.DiscountAmount = student.DiscountAmount.Value / installmentCount;
                    }
                }

                fee.NetAmount = fee.Amount - (fee.DiscountAmount) - fee.ScholarshipAmount;
                fee.BalanceAmount = fee.NetAmount - fee.PaidAmount;
                fee.FeeNumber = await _feeService.GenerateFeeNumberAsync(tenantId);
                fees.Add(fee);
            }
        }
        else
        {
            // Generate installments automatically
            var totalAmount = feeStructure.Amount;
            var installmentCount = feeStructure.MaxInstallments ?? 1;
            var amountPerInstallment = totalAmount / installmentCount;
            var remainder = totalAmount - (amountPerInstallment * installmentCount);

            var academicYearObj = await _context.AcademicYears
                .FirstOrDefaultAsync(ay => ay.TenantId == tenantId && ay.Name == academicYear);

            var startDate = academicYearObj?.StartDate ?? DateTime.UtcNow;
            var daysBetweenInstallments = 90; // Default 3 months between installments

            for (int i = 1; i <= installmentCount; i++)
            {
                var installmentAmount = amountPerInstallment;
                if (i == installmentCount)
                {
                    installmentAmount += remainder; // Add remainder to last installment
                }

                var dueDate = startDate.AddDays((i - 1) * daysBetweenInstallments);

                var fee = new Fee
                {
                    TenantId = tenantId,
                    StudentId = studentId,
                    FeeStructureId = feeStructureId,
                    FeeType = feeStructure.FeeType,
                    Amount = installmentAmount,
                    DueDate = dueDate,
                    InstallmentNumber = i,
                    Status = "Pending",
                    AcademicYear = academicYear
                };

                // Apply student-level discount if active
                if (student.IsDiscountActive)
                {
                    if (student.DiscountPercentage.HasValue && student.DiscountPercentage.Value > 0)
                    {
                        fee.DiscountAmount = installmentAmount * (student.DiscountPercentage.Value / 100);
                    }
                    else if (student.DiscountAmount.HasValue && student.DiscountAmount.Value > 0)
                    {
                        // For fixed amount, divide by number of installments
                        fee.DiscountAmount = student.DiscountAmount.Value / installmentCount;
                    }
                }

                fee.NetAmount = fee.Amount - (fee.DiscountAmount) - fee.ScholarshipAmount;
                fee.BalanceAmount = fee.NetAmount - fee.PaidAmount;
                fee.FeeNumber = await _feeService.GenerateFeeNumberAsync(tenantId);
                fees.Add(fee);
            }
        }

        _context.Fees.AddRange(fees);
        await _context.SaveChangesAsync();

        return fees;
    }

    public async Task<Fee> CreateFeeWithInstallmentsAsync(FeeStructure feeStructure, Student student, int tenantId, string academicYear)
    {
        var dueDate = DateTime.UtcNow.AddDays(30); // Default 30 days

        var fee = new Fee
        {
            TenantId = tenantId,
            StudentId = student.Id,
            FeeStructureId = feeStructure.Id,
            FeeType = feeStructure.FeeType,
            Amount = feeStructure.Amount,
            NetAmount = feeStructure.Amount,
            BalanceAmount = feeStructure.Amount,
            DueDate = dueDate,
            Status = "Pending",
            AcademicYear = academicYear
        };

        fee.FeeNumber = await _feeService.GenerateFeeNumberAsync(tenantId);

        _context.Fees.Add(fee);
        await _context.SaveChangesAsync();

        return fee;
    }

    public async Task ApplyLateFeesAsync(int tenantId)
    {
        var overdueFees = await _context.Fees
            .Include(f => f.FeeStructure)
            .Where(f => f.TenantId == tenantId
                && f.Status != "Paid"
                && f.DueDate < DateTime.UtcNow
                && f.LateFeeAmount == null) // Only apply once
            .ToListAsync();

        foreach (var fee in overdueFees)
        {
            if (fee.FeeStructure == null)
                continue;

            var daysOverdue = (DateTime.UtcNow - fee.DueDate).Days;
            
            // Check if late fee should be applied
            if (fee.FeeStructure.LateFeeDays.HasValue && daysOverdue >= fee.FeeStructure.LateFeeDays.Value)
            {
                var lateFeeAmount = fee.FeeStructure.LateFeeAmount ?? 0;
                
                if (lateFeeAmount > 0)
                {
                    fee.LateFeeAmount = lateFeeAmount;
                    fee.LateFeeAppliedDate = DateTime.UtcNow;
                    fee.NetAmount += lateFeeAmount;
                    fee.BalanceAmount += lateFeeAmount;
                    
                    // Update status to Overdue if not already
                    if (fee.Status != "Overdue")
                    {
                        fee.Status = "Overdue";
                    }
                }
            }
            else if (daysOverdue > 0 && fee.Status != "Overdue")
            {
                // Mark as overdue even if no late fee
                fee.Status = "Overdue";
            }
        }

        await _context.SaveChangesAsync();
    }

    private async Task UpdateStudentFeeTotalsAsync(int studentId, int tenantId)
    {
        var student = await _context.Students.FindAsync(studentId);
        if (student == null) return;

        var fees = await _context.Fees
            .Where(f => f.StudentId == studentId && f.TenantId == tenantId)
            .ToListAsync();

        student.TotalFees = fees.Sum(f => f.NetAmount);
        student.PaidFees = fees.Sum(f => f.PaidAmount);
        student.OutstandingFees = fees.Sum(f => f.BalanceAmount);

        _context.Students.Update(student);
        await _context.SaveChangesAsync();
    }
}

