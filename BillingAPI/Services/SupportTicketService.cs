using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class SupportTicketService : ISupportTicketService
{
    private readonly ApplicationDbContext _context;

    public SupportTicketService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SupportTicket> CreateSupportTicketAsync(SupportTicket ticket)
    {
        // Generate ticket number if not provided
        if (string.IsNullOrEmpty(ticket.TicketNumber))
        {
            ticket.TicketNumber = await GenerateTicketNumberAsync(ticket.TenantId);
        }

        ticket.CreatedAt = DateTime.UtcNow;
        ticket.Status = "Open";

        _context.SupportTickets.Add(ticket);
        await _context.SaveChangesAsync();

        return ticket;
    }

    public async Task<List<SupportTicket>> GetSupportTicketsAsync(int tenantId, string? status = null)
    {
        var query = _context.SupportTickets
            .Include(t => t.User)
            .Where(t => t.TenantId == tenantId);

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(t => t.Status == status);
        }

        return await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
    }

    public async Task<SupportTicket?> GetSupportTicketByIdAsync(int id, int tenantId)
    {
        return await _context.SupportTickets
            .Include(t => t.User)
            .Include(t => t.Tenant)
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);
    }

    public async Task<SupportTicket> UpdateSupportTicketAsync(SupportTicket ticket)
    {
        ticket.UpdatedAt = DateTime.UtcNow;
        
        if (ticket.Status == "Resolved" || ticket.Status == "Closed")
        {
            ticket.ResolvedAt = DateTime.UtcNow;
        }

        _context.SupportTickets.Update(ticket);
        await _context.SaveChangesAsync();

        return ticket;
    }

    public async Task<string> GenerateTicketNumberAsync(int tenantId)
    {
        var tenant = await _context.Tenants.FindAsync(tenantId);
        var tenantCode = tenant?.Code ?? "TEN";
        
        var today = DateTime.UtcNow;
        var year = today.Year;
        var month = today.Month.ToString("D2");
        
        // Get count of tickets for this tenant today
        var todayStart = new DateTime(today.Year, today.Month, today.Day, 0, 0, 0, DateTimeKind.Utc);
        var todayEnd = todayStart.AddDays(1);
        
        var count = await _context.SupportTickets
            .Where(t => t.TenantId == tenantId && t.CreatedAt >= todayStart && t.CreatedAt < todayEnd)
            .CountAsync();
        
        var sequence = (count + 1).ToString("D4");
        
        return $"{tenantCode}-{year}{month}-{sequence}";
    }
}

