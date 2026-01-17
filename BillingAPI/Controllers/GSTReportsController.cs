using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GSTReportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public GSTReportsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("gstr-1")]
    public async Task<IActionResult> GetGSTR1([FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
    {
        var tenantId = GetTenantId();
        
        var invoices = await _context.Invoices
            .Include(i => i.Items)
            .Where(i => i.TenantId == tenantId 
                && i.InvoiceDate >= fromDate 
                && i.InvoiceDate <= toDate
                && i.Status == "Completed")
            .ToListAsync();

        var gstr1 = new
        {
            Period = $"{fromDate:MMM yyyy}",
            B2B = invoices.Where(i => i.CustomerId.HasValue).Select(i => new
            {
                InvoiceNumber = i.InvoiceNumber,
                InvoiceDate = i.InvoiceDate,
                CustomerGSTIN = i.Customer?.GSTIN,
                TaxableValue = i.SubTotal,
                CGST = i.Items.Sum(item => item.TaxAmount / 2),
                SGST = i.Items.Sum(item => item.TaxAmount / 2),
                IGST = 0,
                TotalTax = i.TaxAmount,
                TotalAmount = i.TotalAmount
            }).ToList(),
            B2C = invoices.Where(i => !i.CustomerId.HasValue || string.IsNullOrEmpty(i.Customer?.GSTIN)).Select(i => new
            {
                InvoiceNumber = i.InvoiceNumber,
                InvoiceDate = i.InvoiceDate,
                TaxableValue = i.SubTotal,
                TaxAmount = i.TaxAmount,
                TotalAmount = i.TotalAmount
            }).ToList(),
            Summary = new
            {
                TotalInvoices = invoices.Count,
                TotalTaxableValue = invoices.Sum(i => i.SubTotal),
                TotalCGST = invoices.Sum(i => i.TaxAmount / 2),
                TotalSGST = invoices.Sum(i => i.TaxAmount / 2),
                TotalIGST = 0,
                TotalTax = invoices.Sum(i => i.TaxAmount),
                TotalAmount = invoices.Sum(i => i.TotalAmount)
            }
        };

        return Ok(gstr1);
    }

    [HttpGet("gstr-2")]
    public async Task<IActionResult> GetGSTR2([FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
    {
        var tenantId = GetTenantId();
        
        var purchaseOrders = await _context.PurchaseOrders
            .Include(po => po.Items)
            .Include(po => po.Supplier)
            .Where(po => po.TenantId == tenantId 
                && po.OrderDate >= fromDate 
                && po.OrderDate <= toDate
                && po.Status == "Received")
            .ToListAsync();

        var gstr2 = new
        {
            Period = $"{fromDate:MMM yyyy}",
            B2B = purchaseOrders.Select(po => new
            {
                InvoiceNumber = po.OrderNumber,
                InvoiceDate = po.OrderDate,
                SupplierGSTIN = po.Supplier?.GSTIN,
                TaxableValue = po.Items.Sum(item => item.Quantity * item.UnitPrice),
                CGST = po.Items.Sum(item => (item.Quantity * item.UnitPrice * item.TaxRate / 100) / 2),
                SGST = po.Items.Sum(item => (item.Quantity * item.UnitPrice * item.TaxRate / 100) / 2),
                IGST = 0,
                TotalTax = po.Items.Sum(item => item.Quantity * item.UnitPrice * item.TaxRate / 100),
                TotalAmount = po.TotalAmount
            }).ToList(),
            Summary = new
            {
                TotalInvoices = purchaseOrders.Count,
                TotalTaxableValue = purchaseOrders.Sum(po => po.Items.Sum(item => item.Quantity * item.UnitPrice)),
                TotalCGST = purchaseOrders.Sum(po => po.Items.Sum(item => (item.Quantity * item.UnitPrice * item.TaxRate / 100) / 2)),
                TotalSGST = purchaseOrders.Sum(po => po.Items.Sum(item => (item.Quantity * item.UnitPrice * item.TaxRate / 100) / 2)),
                TotalIGST = 0,
                TotalTax = purchaseOrders.Sum(po => po.Items.Sum(item => item.Quantity * item.UnitPrice * item.TaxRate / 100)),
                TotalAmount = purchaseOrders.Sum(po => po.TotalAmount)
            }
        };

        return Ok(gstr2);
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

