using BillingAPI.Models;

namespace BillingAPI.Services;

public interface ISupportTicketService
{
    Task<SupportTicket> CreateSupportTicketAsync(SupportTicket ticket);
    Task<List<SupportTicket>> GetSupportTicketsAsync(int tenantId, string? status = null);
    Task<SupportTicket?> GetSupportTicketByIdAsync(int id, int tenantId);
    Task<SupportTicket> UpdateSupportTicketAsync(SupportTicket ticket);
    Task<string> GenerateTicketNumberAsync(int tenantId);
}

