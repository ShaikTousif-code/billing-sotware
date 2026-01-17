using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class TenantService : ITenantService
{
    private readonly ApplicationDbContext _context;

    public TenantService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Tenant?> GetTenantByIdAsync(int id)
    {
        return await _context.Tenants.FindAsync(id);
    }

    public async Task<Tenant?> GetTenantByCodeAsync(string code)
    {
        return await _context.Tenants.FirstOrDefaultAsync(t => t.Code.ToUpper() == code.ToUpper());
    }

    public async Task<Tenant> CreateTenantAsync(Tenant tenant)
    {
        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();
        return tenant;
    }

    public async Task<List<Tenant>> GetAllTenantsAsync()
    {
        return await _context.Tenants.ToListAsync();
    }
}

