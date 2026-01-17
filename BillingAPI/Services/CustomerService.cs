using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class CustomerService : ICustomerService
{
    private readonly ApplicationDbContext _context;

    public CustomerService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Customer>> GetCustomersAsync(int tenantId)
    {
        return await _context.Customers
            .Include(c => c.CustomerGroup)
            .Where(c => c.TenantId == tenantId && c.IsActive)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<Customer?> GetCustomerByIdAsync(int id, int tenantId)
    {
        return await _context.Customers
            .Include(c => c.CustomerGroup)
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
    }

    public async Task<Customer> CreateCustomerAsync(Customer customer)
    {
        // Set default values for B2B/B2C fields if not provided
        if (string.IsNullOrEmpty(customer.CustomerType))
        {
            customer.CustomerType = "B2C";
        }
        
        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();
        return customer;
    }

    public async Task<Customer> UpdateCustomerAsync(Customer customer)
    {
        _context.Customers.Update(customer);
        await _context.SaveChangesAsync();
        return customer;
    }

    public async Task<bool> DeleteCustomerAsync(int id, int tenantId)
    {
        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (customer == null) return false;

        customer.IsActive = false;
        await _context.SaveChangesAsync();
        return true;
    }
}

