using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Services;
using BillingAPI.Models;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExportController : ControllerBase
{
    private readonly IExcelService _excelService;
    private readonly IPdfService _pdfService;
    private readonly IInvoiceService _invoiceService;
    private readonly ApplicationDbContext _context;

    public ExportController(
        IExcelService excelService,
        IPdfService pdfService,
        IInvoiceService invoiceService,
        ApplicationDbContext context)
    {
        _excelService = excelService;
        _pdfService = pdfService;
        _invoiceService = invoiceService;
        _context = context;
    }

    [HttpGet("products/excel")]
    public async Task<IActionResult> ExportProductsToExcel()
    {
        var tenantId = GetTenantId();
        var products = await _context.Products
            .Include(p => p.Category)
            .Where(p => p.TenantId == tenantId)
            .ToListAsync();

        var excelBytes = await _excelService.ExportProductsToExcelAsync(products);
        return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Products_{DateTime.Now:yyyyMMdd}.xlsx");
    }

    [HttpGet("customers/excel")]
    public async Task<IActionResult> ExportCustomersToExcel()
    {
        var tenantId = GetTenantId();
        var customers = await _context.Customers
            .Where(c => c.TenantId == tenantId)
            .ToListAsync();

        var excelBytes = await _excelService.ExportCustomersToExcelAsync(customers);
        return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Customers_{DateTime.Now:yyyyMMdd}.xlsx");
    }

    [HttpGet("invoices/excel")]
    public async Task<IActionResult> ExportInvoicesToExcel([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var tenantId = GetTenantId();
        var invoices = await _invoiceService.GetInvoicesAsync(tenantId, fromDate, toDate);

        var excelBytes = await _excelService.ExportInvoicesToExcelAsync(invoices);
        return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Invoices_{DateTime.Now:yyyyMMdd}.xlsx");
    }

    [HttpGet("invoices/{id}/pdf")]
    public async Task<IActionResult> ExportInvoiceToPdf(int id)
    {
        var tenantId = GetTenantId();
        var invoice = await _invoiceService.GetInvoiceByIdAsync(id, tenantId);
        
        if (invoice == null) return NotFound();

        var pdfBytes = await _pdfService.GenerateInvoicePdfAsync(invoice);
        Response.Headers.Add("Content-Disposition", $"inline; filename=\"Invoice_{invoice.InvoiceNumber}.pdf\"");
        Response.Headers.Add("Content-Type", "application/pdf; charset=utf-8");
        return File(pdfBytes, "application/pdf");
    }

    [HttpGet("credit-notes/{id}/pdf")]
    public async Task<IActionResult> ExportCreditNoteToPdf(int id)
    {
        var tenantId = GetTenantId();
        var creditNote = await _context.CreditNotes
            .Include(cn => cn.Items)
            .FirstOrDefaultAsync(cn => cn.Id == id && cn.TenantId == tenantId);

        if (creditNote == null) return NotFound();

        var pdfBytes = await _pdfService.GenerateCreditNotePdfAsync(creditNote);
        return File(pdfBytes, "application/pdf", $"CreditNote_{creditNote.CreditNoteNumber}.pdf");
    }

    [HttpPost("products/import")]
    public async Task<IActionResult> ImportProductsFromExcel(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded" });

        var tenantId = GetTenantId();
        var products = await _excelService.ImportProductsFromExcelAsync(file.OpenReadStream(), tenantId);

        _context.Products.AddRange(products);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"{products.Count} products imported successfully", count = products.Count });
    }

    [HttpPost("customers/import")]
    public async Task<IActionResult> ImportCustomersFromExcel(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded" });

        var tenantId = GetTenantId();
        var customers = await _excelService.ImportCustomersFromExcelAsync(file.OpenReadStream(), tenantId);

        _context.Customers.AddRange(customers);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"{customers.Count} customers imported successfully", count = customers.Count });
    }

    [HttpGet("fees/excel")]
    public async Task<IActionResult> ExportFeesToExcel([FromQuery] int? studentId, [FromQuery] string? status)
    {
        var tenantId = GetTenantId();
        var query = _context.Fees
            .Include(f => f.Student)
            .Where(f => f.TenantId == tenantId);

        if (studentId.HasValue)
            query = query.Where(f => f.StudentId == studentId.Value);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(f => f.Status == status);

        var fees = await query.ToListAsync();
        var excelBytes = await _excelService.ExportFeesToExcelAsync(fees);
        return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Fees_{DateTime.Now:yyyyMMdd}.xlsx");
    }

    [HttpGet("students/excel")]
    public async Task<IActionResult> ExportStudentsToExcel([FromQuery] int? classId)
    {
        var tenantId = GetTenantId();
        var query = _context.Set<Student>()
            .Include(s => s.Class)
            .Where(s => s.TenantId == tenantId);

        if (classId.HasValue)
            query = query.Where(s => s.ClassId == classId.Value);

        var students = await query.ToListAsync();
        var excelBytes = await _excelService.ExportStudentsToExcelAsync(students);
        return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Students_{DateTime.Now:yyyyMMdd}.xlsx");
    }

    [HttpPost("fees/import")]
    public async Task<IActionResult> ImportFeesFromExcel(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded" });

        var tenantId = GetTenantId();
        var fees = await _excelService.ImportFeesFromExcelAsync(file.OpenReadStream(), tenantId);

        _context.Set<Fee>().AddRange(fees);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"{fees.Count} fees imported successfully", count = fees.Count });
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

