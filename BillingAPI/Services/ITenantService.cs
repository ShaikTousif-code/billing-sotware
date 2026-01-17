using BillingAPI.Models;

namespace BillingAPI.Services;

public interface ITenantService
{
    Task<Tenant?> GetTenantByIdAsync(int id);
    Task<Tenant?> GetTenantByCodeAsync(string code);
    Task<Tenant> CreateTenantAsync(Tenant tenant);
    Task<List<Tenant>> GetAllTenantsAsync();
}

