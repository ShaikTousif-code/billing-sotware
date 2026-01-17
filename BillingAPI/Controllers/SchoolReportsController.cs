using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.DTOs;
using BillingAPI.Models;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/school-reports")]
[Authorize]
public class SchoolReportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SchoolReportsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("current-year-stats")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetCurrentYearStats()
    {
        try
        {
            var tenantId = GetTenantId();
            var activeYear = await _context.AcademicYears
                .FirstOrDefaultAsync(ay => ay.TenantId == tenantId && ay.IsActive);
            
            var academicYear = activeYear?.Name ?? DateTime.UtcNow.Year.ToString();
            
            // Get active students count
            var studentCount = await _context.Students
                .CountAsync(s => s.TenantId == tenantId && s.Status == "Active");
            
            // Get fees for current academic year
            var currentYearFees = await _context.Fees
                .Where(f => f.TenantId == tenantId && f.AcademicYear == academicYear)
                .ToListAsync();
            
            // Get payments for current academic year fees
            var feeIds = currentYearFees.Select(f => f.Id).ToList();
            var currentYearPayments = await _context.FeePayments
                .Where(p => p.TenantId == tenantId 
                    && feeIds.Contains(p.FeeId)
                    && p.PaymentStatus == "Success")
                .ToListAsync();
            
            var feesCollected = currentYearPayments.Sum(p => p.Amount);
            var outstandingFees = currentYearFees.Sum(f => f.BalanceAmount);
            
            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                AcademicYear = academicYear,
                StudentStrength = studentCount,
                FeesCollected = feesCollected,
                OutstandingFees = outstandingFees,
                CollectionRate = (feesCollected + outstandingFees) > 0 
                    ? (feesCollected / (feesCollected + outstandingFees)) * 100 
                    : 0
            }));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResponse($"Error fetching current year stats: {ex.Message}"));
        }
    }

    [HttpGet("dues-details")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetDuesDetails([FromQuery] int? classId, [FromQuery] string? status, [FromQuery] int? daysOverdue)
    {
        try
        {
            var tenantId = GetTenantId();
            var today = DateTime.UtcNow.Date;
            
            var query = _context.Fees
                .Include(f => f.Student)
                    .ThenInclude(s => s!.Class)
                .Include(f => f.FeeStructure)
                    .ThenInclude(fs => fs!.FeeHead)
                .Where(f => f.TenantId == tenantId && f.BalanceAmount > 0);

            if (classId.HasValue)
                query = query.Where(f => f.Student != null && f.Student.ClassId == classId.Value);

            if (!string.IsNullOrEmpty(status))
            {
                if (status == "Overdue")
                    query = query.Where(f => f.DueDate < today);
                else if (status == "Upcoming")
                    query = query.Where(f => f.DueDate >= today && f.DueDate <= today.AddDays(7));
                else if (status == "Pending")
                    query = query.Where(f => f.Status == "Pending");
                else
                    query = query.Where(f => f.Status == status);
            }

            if (daysOverdue.HasValue)
            {
                var cutoffDate = today.AddDays(-daysOverdue.Value);
                query = query.Where(f => f.DueDate < cutoffDate);
            }

            var fees = await query
                .OrderBy(f => f.DueDate)
                .ThenBy(f => f.Student != null ? f.Student.StudentId : "")
                .ToListAsync();

            var duesDetails = fees.Select(f => new
            {
                FeeId = f.Id,
                FeeNumber = f.FeeNumber,
                StudentId = f.StudentId,
                StudentName = f.Student != null ? $"{f.Student.FirstName} {f.Student.LastName}" : "Unknown",
                StudentIdNumber = f.Student?.StudentId ?? "",
                ClassName = f.Student?.Class?.Name ?? "N/A",
                FeeType = f.FeeType,
                FeeHeadName = f.FeeStructure?.FeeHead?.Name ?? "N/A",
                NetAmount = f.NetAmount,
                PaidAmount = f.PaidAmount,
                BalanceAmount = f.BalanceAmount,
                DueDate = f.DueDate,
                DaysOverdue = f.DueDate < today ? (int)(today - f.DueDate.Date).TotalDays : 0,
                DaysRemaining = f.DueDate >= today ? (int)(f.DueDate.Date - today).TotalDays : 0,
                Status = f.Status,
                InstallmentNumber = f.InstallmentNumber,
                LateFeeAmount = f.LateFeeAmount ?? 0,
                AcademicYear = f.AcademicYear,
                ParentPhone = f.Student?.ParentPhone ?? "",
                ParentEmail = f.Student?.ParentEmail ?? "",
                Notes = f.Notes
            }).ToList();

            return Ok(ApiResponse<object>.SuccessResponse(duesDetails));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResponse($"Error fetching dues details: {ex.Message}"));
        }
    }

    [HttpGet("student-dues")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetStudentDues([FromQuery] int? classId, [FromQuery] string? status)
    {
        try
        {
            var tenantId = GetTenantId();
            var query = _context.Students
                .Include(s => s.Class)
                .Where(s => s.TenantId == tenantId && s.Status == "Active");

            if (classId.HasValue)
                query = query.Where(s => s.ClassId == classId.Value);

            var students = await query.ToListAsync();

            var dues = students.Select(s => new
            {
                StudentId = s.Id,
                StudentName = $"{s.FirstName} {s.LastName}",
                StudentIdNumber = s.StudentId,
                Class = s.Class?.Name ?? "N/A",
                Section = s.Section ?? "N/A",
                TotalFees = s.TotalFees,
                PaidFees = s.PaidFees,
                OutstandingFees = s.OutstandingFees,
                Status = s.OutstandingFees > 0 ? "Due" : "Paid"
            }).ToList();

            if (!string.IsNullOrEmpty(status))
            {
                dues = dues.Where(d => d.Status == status).ToList();
            }

            return Ok(ApiResponse<object>.SuccessResponse(dues));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResponse($"Error fetching student dues: {ex.Message}"));
        }
    }

    [HttpGet("collection")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetCollectionReport([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate, [FromQuery] string? paymentMode)
    {
        try
        {
            var tenantId = GetTenantId();
            var query = _context.FeePayments
                .Include(p => p.Student)
                .Include(p => p.Fee)
                .Where(p => p.TenantId == tenantId && p.PaymentStatus == "Success");

            if (fromDate.HasValue)
            {
                var fromDateUtc = fromDate.Value.Kind == DateTimeKind.Unspecified 
                    ? DateTime.SpecifyKind(fromDate.Value, DateTimeKind.Utc) 
                    : fromDate.Value.ToUniversalTime();
                query = query.Where(p => p.PaymentDate >= fromDateUtc);
            }

            if (toDate.HasValue)
            {
                var toDateUtc = toDate.Value.Kind == DateTimeKind.Unspecified 
                    ? DateTime.SpecifyKind(toDate.Value, DateTimeKind.Utc) 
                    : toDate.Value.ToUniversalTime();
                query = query.Where(p => p.PaymentDate <= toDateUtc);
            }

            if (!string.IsNullOrEmpty(paymentMode))
                query = query.Where(p => p.PaymentMode == paymentMode);

            var payments = await query
                .OrderByDescending(p => p.PaymentDate)
                .Select(p => new
                {
                    p.Id,
                    PaymentDate = p.PaymentDate,
                    ReceiptNumber = p.ReceiptNumber,
                    StudentName = $"{p.Student!.FirstName} {p.Student.LastName}",
                    StudentId = p.Student.StudentId,
                    FeeType = p.Fee!.FeeType,
                    Amount = p.Amount,
                    PaymentMode = p.PaymentMode,
                    TransactionId = p.TransactionId
                })
                .ToListAsync();

            var summary = new
            {
                TotalCollection = payments.Sum(p => p.Amount),
                TotalPayments = payments.Count,
                PaymentModeBreakdown = payments.GroupBy(p => p.PaymentMode)
                    .Select(g => new { PaymentMode = g.Key, Count = g.Count(), Total = g.Sum(p => p.Amount) })
                    .ToList(),
                DailyCollection = payments.GroupBy(p => p.PaymentDate.Date)
                    .Select(g => new { Date = g.Key, Count = g.Count(), Total = g.Sum(p => p.Amount) })
                    .OrderByDescending(x => x.Date)
                    .ToList()
            };

            return Ok(ApiResponse<object>.SuccessResponse(new { Payments = payments, Summary = summary }));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResponse($"Error fetching collection report: {ex.Message}"));
        }
    }

    [HttpGet("class-wise-summary")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetClassWiseSummary([FromQuery] string? academicYear)
    {
        try
        {
            var tenantId = GetTenantId();
            var activeYear = await _context.AcademicYears
                .FirstOrDefaultAsync(ay => ay.TenantId == tenantId && ay.IsActive);
            
            var year = academicYear ?? activeYear?.Name ?? DateTime.UtcNow.Year.ToString();

            var classes = await _context.Classes
                .Where(c => c.TenantId == tenantId && c.IsActive)
                .ToListAsync();

            var summary = new List<object>();

            foreach (var classItem in classes)
            {
                var students = await _context.Students
                    .Where(s => s.ClassId == classItem.Id && s.TenantId == tenantId && s.Status == "Active")
                    .ToListAsync();

                var fees = await _context.Fees
                    .Where(f => f.TenantId == tenantId 
                        && f.AcademicYear == year
                        && students.Select(s => s.Id).Contains(f.StudentId))
                    .ToListAsync();

                var payments = await _context.FeePayments
                    .Where(p => p.TenantId == tenantId 
                        && students.Select(s => s.Id).Contains(p.StudentId)
                        && p.PaymentStatus == "Success")
                    .ToListAsync();

                summary.Add(new
                {
                    ClassId = classItem.Id,
                    ClassName = classItem.Name,
                    TotalStudents = students.Count,
                    ExpectedFees = fees.Sum(f => f.NetAmount),
                    CollectedFees = payments.Sum(p => p.Amount),
                    PendingFees = fees.Sum(f => f.BalanceAmount),
                    CollectionPercentage = fees.Sum(f => f.NetAmount) > 0 
                        ? (payments.Sum(p => p.Amount) / fees.Sum(f => f.NetAmount)) * 100 
                        : 0
                });
            }

            return Ok(ApiResponse<object>.SuccessResponse(summary));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResponse($"Error fetching class-wise summary: {ex.Message}"));
        }
    }

    [HttpGet("dashboard-stats")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetDashboardStats()
    {
        try
        {
            var tenantId = GetTenantId();
            var today = DateTime.UtcNow.Date;

            var activeYear = await _context.AcademicYears
                .FirstOrDefaultAsync(ay => ay.TenantId == tenantId && ay.IsActive);
            
            var academicYear = activeYear?.Name ?? DateTime.UtcNow.Year.ToString();

            // Total expected fees
            var totalExpectedFees = await _context.Fees
                .Where(f => f.TenantId == tenantId && f.AcademicYear == academicYear)
                .SumAsync(f => f.NetAmount);

            // Total collected
            var totalCollected = await _context.FeePayments
                .Where(p => p.TenantId == tenantId && p.PaymentStatus == "Success")
                .SumAsync(p => p.Amount);

            // Total due
            var totalDue = await _context.Fees
                .Where(f => f.TenantId == tenantId && f.AcademicYear == academicYear)
                .SumAsync(f => f.BalanceAmount);

            // Today's collection
            var todayCollection = await _context.FeePayments
                .Where(p => p.TenantId == tenantId 
                    && p.PaymentDate.Date == today
                    && p.PaymentStatus == "Success")
                .SumAsync(p => p.Amount);

            // Student dues count
            var studentsWithDues = await _context.Students
                .Where(s => s.TenantId == tenantId 
                    && s.Status == "Active" 
                    && s.OutstandingFees > 0)
                .CountAsync();

            // Recent payments
            var recentPayments = await _context.FeePayments
                .Include(p => p.Student)
                .Where(p => p.TenantId == tenantId && p.PaymentStatus == "Success")
                .OrderByDescending(p => p.PaymentDate)
                .Take(10)
                .Select(p => new
                {
                    p.Id,
                    p.ReceiptNumber,
                    p.PaymentDate,
                    p.Amount,
                    p.PaymentMode,
                    StudentName = $"{p.Student!.FirstName} {p.Student.LastName}"
                })
                .ToListAsync();

            var stats = new
            {
                TotalExpectedFees = totalExpectedFees,
                TotalCollected = totalCollected,
                TotalDue = totalDue,
                TodaysCollection = todayCollection,
                StudentsWithDues = studentsWithDues,
                CollectionPercentage = totalExpectedFees > 0 ? (totalCollected / totalExpectedFees) * 100 : 0,
                RecentPayments = recentPayments
            };

            return Ok(ApiResponse<object>.SuccessResponse(stats));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResponse($"Error fetching dashboard stats: {ex.Message}"));
        }
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

