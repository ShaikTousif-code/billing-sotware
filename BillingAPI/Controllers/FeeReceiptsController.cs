using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using BillingAPI.Data;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/fee-receipts")]
[Authorize]
public class FeeReceiptsController : ControllerBase
{
    private readonly IFeeReceiptService _feeReceiptService;
    private readonly ApplicationDbContext _context;

    public FeeReceiptsController(IFeeReceiptService feeReceiptService, ApplicationDbContext context)
    {
        _feeReceiptService = feeReceiptService;
        _context = context;
    }

    [HttpGet("payment/{id}/pdf")]
    public async Task<IActionResult> GetFeeReceiptPdf(int id)
    {
        var tenantId = GetTenantId();
        var payment = await _context.FeePayments
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);

        if (payment == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Payment not found"));

        var pdfBytes = await _feeReceiptService.GenerateFeeReceiptPdfAsync(payment);
        return File(pdfBytes, "application/pdf", $"FeeReceipt_{payment.ReceiptNumber}.pdf");
    }

    [HttpGet("payment")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetFeePayments([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate, [FromQuery] int? studentId)
    {
        try
        {
            var tenantId = GetTenantId();
            var query = _context.FeePayments
                .Include(p => p.Student)
                .Include(p => p.Fee)
                .Where(p => p.TenantId == tenantId);

            if (fromDate.HasValue)
            {
                // Handle date parsing - convert to UTC if needed
                DateTime fromDateUtc;
                if (fromDate.Value.Kind == DateTimeKind.Unspecified)
                {
                    fromDateUtc = DateTime.SpecifyKind(fromDate.Value, DateTimeKind.Utc);
                }
                else
                {
                    fromDateUtc = fromDate.Value.ToUniversalTime();
                }
                query = query.Where(p => p.PaymentDate >= fromDateUtc);
            }

            if (toDate.HasValue)
            {
                // Handle date parsing - convert to UTC if needed
                DateTime toDateUtc;
                if (toDate.Value.Kind == DateTimeKind.Unspecified)
                {
                    toDateUtc = DateTime.SpecifyKind(toDate.Value, DateTimeKind.Utc);
                }
                else
                {
                    toDateUtc = toDate.Value.ToUniversalTime();
                }
                query = query.Where(p => p.PaymentDate <= toDateUtc);
            }

            if (studentId.HasValue)
                query = query.Where(p => p.StudentId == studentId.Value);

            var payments = await query
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            // Clear circular references
            foreach (var payment in payments)
            {
                if (payment.Student != null)
                {
                    payment.Student.Fees = null;
                    payment.Student.FeePayments = null;
                }
                if (payment.Fee != null)
                {
                    payment.Fee.Payments = null;
                }
            }

            return Ok(ApiResponse<List<FeePayment>>.SuccessResponse(payments));
        }
        catch (Exception ex)
        {
            // Log the full exception for debugging
            return StatusCode(500, ApiResponse<object>.ErrorResponse($"An error occurred while fetching fee payments: {ex.Message}. Inner exception: {ex.InnerException?.Message}"));
        }
    }

    [HttpGet("student/{studentId}/statement/pdf")]
    public async Task<IActionResult> GetFeeStatementPdf(int studentId, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var tenantId = GetTenantId();
        var pdfBytes = await _feeReceiptService.GenerateFeeStatementPdfAsync(studentId, tenantId, fromDate, toDate);
        return File(pdfBytes, "application/pdf", $"FeeStatement_{studentId}_{DateTime.Now:yyyyMMdd}.pdf");
    }

    [HttpPost("payment/{id}/send-email")]
    public async Task<IActionResult> SendFeeReceiptEmail(int id)
    {
        var tenantId = GetTenantId();
        await _feeReceiptService.SendFeeReceiptEmailAsync(id, tenantId);
        return Ok(ApiResponse<object>.SuccessResponse(null, "Receipt email sent successfully"));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

