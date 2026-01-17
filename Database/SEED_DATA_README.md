# Seed Data Script Instructions

## Overview
This script creates initial data for the billing system:
- **Super Admin** user in SYSTEM tenant
- **School** tenant with admin user
- **College** tenant with admin user
- **Retail Shop** tenant with admin user
- **Office** tenant with admin user

## How to Run

1. **Ensure the database exists**: The script uses `smartbillingsoluition` database
2. **Run the script**:
   ```sql
   sqlcmd -S YOUR_SERVER -d smartbillingsoluition -i Database\Seed_Data.sql
   ```
   Or execute it directly in SQL Server Management Studio (SSMS)

## Default Credentials

### Super Admin
- **Email**: `superadmin@system.com`
- **Password**: `SuperAdmin@123`
- **Tenant Code**: `SYSTEM` (leave empty or use SYSTEM)

### School Tenant
- **Tenant Code**: `SCHOOL001`
- **Email**: `admin@greenwood.edu`
- **Password**: `Admin@123`

### College Tenant
- **Tenant Code**: `COLLEGE001`
- **Email**: `admin@metrocollege.edu`
- **Password**: `Admin@123`

### Retail Shop Tenant
- **Tenant Code**: `RETAIL001`
- **Email**: `admin@quickmart.com`
- **Password**: `Admin@123`

### Office Tenant
- **Tenant Code**: `OFFICE001`
- **Email**: `admin@techsolutions.com`
- **Password**: `Admin@123`

## Password Hash Calculation

If you need to change passwords or calculate new hashes, use the helper script:
- **File**: `Database/CalculatePasswordHash.cs`
- **Algorithm**: SHA256 + Base64 encoding (same as `AuthService.HashPassword`)

Example:
```csharp
string password = "YourPassword";
using var sha256 = SHA256.Create();
var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
string hash = Convert.ToBase64String(hashedBytes);
```

## Security Note

⚠️ **Important**: These are default passwords for development/testing only. 
**Change all passwords immediately in production environments!**

## What Gets Created

1. **Roles**: SuperAdmin, Owner, Manager, Accountant, Cashier
2. **SYSTEM Tenant**: For super admin access
3. **Super Admin User**: Full system access
4. **School Tenant**: With admin user and configuration
5. **College Tenant**: With admin user and configuration
6. **Retail Shop Tenant**: With admin user and configuration
7. **Office Tenant**: With admin user and configuration
8. **Tenant Configurations**: Basic settings for each tenant

## Troubleshooting

- If roles already exist, the script will skip creating them (safe to re-run)
- If tenants/users already exist, they won't be duplicated
- Check SQL Server error logs if the script fails
- Ensure the database connection string is correct

