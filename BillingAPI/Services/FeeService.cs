using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class FeeService : IFeeService
{
    private readonly ApplicationDbContext _context;

    public FeeService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Fee>> GetFeesAsync(int tenantId, int? studentId = null, string? status = null)
    {
        var query = _context.Fees
            .AsNoTracking() // Improve performance and avoid tracking issues
            .Include(f => f.Student)
                .ThenInclude(s => s.Class) // Include Class for student display
            .Include(f => f.FeeStructure)
                .ThenInclude(fs => fs.FeeHead) // Include FeeHead for fee structure
            .Where(f => f.TenantId == tenantId);

        if (studentId.HasValue)
            query = query.Where(f => f.StudentId == studentId.Value);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(f => f.Status == status);

        var fees = await query.OrderByDescending(f => f.DueDate).ToListAsync();
        
        // Clear circular references to prevent serialization issues
        foreach (var fee in fees)
        {
            if (fee.Student != null)
            {
                fee.Student.Fees = null; // Clear the Fees collection to break circular reference
                fee.Student.FeePayments = null; // Clear FeePayments collection
            }
            if (fee.FeeStructure != null)
            {
                fee.FeeStructure.Fees = null; // Clear the Fees collection to break circular reference
            }
        }
        
        return fees;
    }

    public async Task<Fee?> GetFeeByIdAsync(int id, int tenantId)
    {
        return await _context.Fees
            .Include(f => f.Student)
            .Include(f => f.FeeStructure)
            .Include(f => f.Payments)
            .FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId);
    }

    public async Task<Fee> CreateFeeAsync(Fee fee)
    {
        if (string.IsNullOrEmpty(fee.FeeNumber))
        {
            fee.FeeNumber = await GenerateFeeNumberAsync(fee.TenantId);
        }

        fee.NetAmount = fee.Amount - fee.DiscountAmount - fee.ScholarshipAmount;
        fee.BalanceAmount = fee.NetAmount - fee.PaidAmount;
        fee.Status = fee.BalanceAmount <= 0 ? "Paid" : fee.BalanceAmount < fee.NetAmount ? "Partial" : "Pending";

        if (fee.DueDate < DateTime.UtcNow && fee.Status != "Paid")
        {
            fee.Status = "Overdue";
        }

        _context.Fees.Add(fee);

        // Update student outstanding
        var student = await _context.Students.FindAsync(fee.StudentId);
        if (student != null)
        {
            student.TotalFees += fee.NetAmount;
            student.OutstandingFees += fee.BalanceAmount;
        }

        await _context.SaveChangesAsync();
        return fee;
    }

    public async Task<Fee> UpdateFeeAsync(Fee fee)
    {
        fee.NetAmount = fee.Amount - fee.DiscountAmount - fee.ScholarshipAmount;
        fee.BalanceAmount = fee.NetAmount - fee.PaidAmount;
        fee.Status = fee.BalanceAmount <= 0 ? "Paid" : fee.BalanceAmount < fee.NetAmount ? "Partial" : "Pending";

        if (fee.DueDate < DateTime.UtcNow && fee.Status != "Paid")
        {
            fee.Status = "Overdue";
        }

        _context.Fees.Update(fee);
        await _context.SaveChangesAsync();
        return fee;
    }

    public async Task<bool> DeleteFeeAsync(int id, int tenantId)
    {
        var fee = await _context.Fees
            .FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId);

        if (fee == null) return false;

        _context.Fees.Remove(fee);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<string> GenerateFeeNumberAsync(int tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var lastFee = await _context.Fees
            .Where(f => f.TenantId == tenantId && f.FeeNumber.StartsWith($"FEE-{year}"))
            .OrderByDescending(f => f.FeeNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastFee != null)
        {
            var parts = lastFee.FeeNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"FEE-{year}-{nextNumber:D6}";
    }

    public async Task<List<Fee>> GenerateFeesForClassAsync(int classId, int tenantId, string term = "")
    {
        // Get active academic year
        var activeYear = await _context.AcademicYears
            .FirstOrDefaultAsync(ay => ay.TenantId == tenantId && ay.IsActive);

        var academicYear = activeYear?.Name ?? DateTime.UtcNow.Year.ToString();

        var students = await _context.Students
            .Where(s => s.ClassId == classId && s.TenantId == tenantId && s.Status == "Active")
            .ToListAsync();

        var feeStructures = await _context.FeeStructures
            .Include(fs => fs.FeeHead)
            .Include(fs => fs.Installments)
            .Where(fs => (fs.ClassId == classId || fs.ClassId == null) 
                && fs.TenantId == tenantId 
                && fs.IsActive
                && fs.AcademicYear == academicYear)
            .ToListAsync();

        var fees = new List<Fee>();

        foreach (var student in students)
        {
            foreach (var feeStructure in feeStructures)
            {
                // Check if fee already exists
                var existingFee = await _context.Fees
                    .FirstOrDefaultAsync(f => f.StudentId == student.Id 
                        && f.FeeStructureId == feeStructure.Id 
                        && f.TenantId == tenantId
                        && f.AcademicYear == academicYear);

                if (existingFee != null)
                    continue; // Skip if already assigned

                // Handle installments
                if (feeStructure.MaxInstallments.HasValue && feeStructure.MaxInstallments > 1)
                {
                    var installmentFees = await GenerateInstallmentFeesForStructureAsync(
                        feeStructure, student.Id, tenantId, academicYear, term);
                    fees.AddRange(installmentFees);
                }
                else
                {
                    // Single fee - apply student discount
                    var fee = await CreateFeeWithStudentDiscount(
                        feeStructure, student.Id, tenantId, academicYear, term,
                        feeStructure.Amount, DateTime.UtcNow.AddDays(30), null, student);
                    fees.Add(fee);
                }
            }
        }

        if (fees.Any())
        {
            _context.Fees.AddRange(fees);
            await _context.SaveChangesAsync();

            // Update student totals
            foreach (var student in students)
            {
                await UpdateStudentFeeTotalsAsync(student.Id, tenantId);
            }
        }

        return fees;
    }

    private async Task<List<Fee>> GenerateInstallmentFeesForStructureAsync(
        FeeStructure feeStructure, int studentId, int tenantId, string academicYear, string term)
    {
        // Get student to check for discount
        var student = await _context.Students.FindAsync(studentId);
        
        var fees = new List<Fee>();
        var installments = feeStructure.Installments.OrderBy(i => i.InstallmentNumber).ToList();

        if (installments.Any())
        {
            // Use configured installments
            foreach (var installment in installments)
            {
                var fee = await CreateFeeWithStudentDiscount(
                    feeStructure, studentId, tenantId, academicYear, term,
                    installment.Amount, installment.DueDate, installment.InstallmentNumber, student);
                fees.Add(fee);
            }
        }
        else
        {
            // Auto-generate installments
            var totalAmount = feeStructure.Amount;
            var installmentCount = feeStructure.MaxInstallments ?? 1;
            var amountPerInstallment = totalAmount / installmentCount;
            var remainder = totalAmount - (amountPerInstallment * installmentCount);

            var academicYearObj = await _context.AcademicYears
                .FirstOrDefaultAsync(ay => ay.TenantId == tenantId && ay.Name == academicYear);

            var startDate = academicYearObj?.StartDate ?? DateTime.UtcNow;
            var daysBetweenInstallments = 90; // 3 months

            for (int i = 1; i <= installmentCount; i++)
            {
                var installmentAmount = amountPerInstallment;
                if (i == installmentCount)
                {
                    installmentAmount += remainder;
                }

                var dueDate = startDate.AddDays((i - 1) * daysBetweenInstallments);

                var fee = await CreateFeeWithStudentDiscount(
                    feeStructure, studentId, tenantId, academicYear, term,
                    installmentAmount, dueDate, i, student);
                fees.Add(fee);
            }
        }

        return fees;
    }

    private async Task<Fee> CreateFeeWithStudentDiscount(
        FeeStructure feeStructure, int studentId, int tenantId, string academicYear, string term,
        decimal amount, DateTime dueDate, int? installmentNumber, Student? student)
    {
        var fee = new Fee
        {
            TenantId = tenantId,
            StudentId = studentId,
            FeeStructureId = feeStructure.Id,
            FeeType = feeStructure.FeeType,
            Amount = amount,
            DueDate = dueDate,
            InstallmentNumber = installmentNumber,
            Status = "Pending",
            Term = term,
            AcademicYear = academicYear
        };

        // Apply student-level discount if active
        if (student != null && student.IsDiscountActive)
        {
            if (student.DiscountPercentage.HasValue && student.DiscountPercentage.Value > 0)
            {
                fee.DiscountAmount = amount * (student.DiscountPercentage.Value / 100);
            }
            else if (student.DiscountAmount.HasValue && student.DiscountAmount.Value > 0)
            {
                // For fixed amount, calculate per installment if it's installment-based
                if (installmentNumber.HasValue && feeStructure.MaxInstallments.HasValue && feeStructure.MaxInstallments.Value > 1)
                {
                    fee.DiscountAmount = student.DiscountAmount.Value / feeStructure.MaxInstallments.Value;
                }
                else
                {
                    fee.DiscountAmount = student.DiscountAmount.Value;
                }
            }
        }

        fee.NetAmount = fee.Amount - fee.DiscountAmount - fee.ScholarshipAmount;
        fee.BalanceAmount = fee.NetAmount - fee.PaidAmount;
        fee.FeeNumber = await GenerateFeeNumberAsync(tenantId);

        return fee;
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

    public async Task<FeePayment> RecordFeePaymentAsync(FeePayment payment)
    {
        if (string.IsNullOrEmpty(payment.ReceiptNumber))
        {
            payment.ReceiptNumber = await GenerateReceiptNumberAsync(payment.TenantId);
        }

        payment.PaymentDate = DateTime.UtcNow;
        _context.FeePayments.Add(payment);

        // Update fee
        var fee = await _context.Fees.FindAsync(payment.FeeId);
        if (fee != null)
        {
            fee.PaidAmount += payment.Amount;
            fee.BalanceAmount = fee.NetAmount - fee.PaidAmount;
            fee.Status = fee.BalanceAmount <= 0 ? "Paid" : fee.BalanceAmount < fee.NetAmount ? "Partial" : "Pending";
            fee.PaidDate = fee.BalanceAmount <= 0 ? DateTime.UtcNow : fee.PaidDate;
        }

        // Update student
        var student = await _context.Students.FindAsync(payment.StudentId);
        if (student != null)
        {
            student.PaidFees += payment.Amount;
            student.OutstandingFees -= payment.Amount;
        }

        await _context.SaveChangesAsync();
        return payment;
    }

    private async Task<string> GenerateReceiptNumberAsync(int tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var lastReceipt = await _context.FeePayments
            .Where(p => p.TenantId == tenantId && p.ReceiptNumber.StartsWith($"RCP-{year}"))
            .OrderByDescending(p => p.ReceiptNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastReceipt != null)
        {
            var parts = lastReceipt.ReceiptNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"RCP-{year}-{nextNumber:D6}";
    }

    public async Task<FeePayment?> GetFeePaymentByIdAsync(int id, int tenantId)
    {
        return await _context.FeePayments
            .Include(p => p.Student)
                .ThenInclude(s => s.Class)
            .Include(p => p.Fee)
                .ThenInclude(f => f.FeeStructure)
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);
    }
}

