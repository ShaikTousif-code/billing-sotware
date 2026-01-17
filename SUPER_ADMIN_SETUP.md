# Super Admin Setup Guide

## Overview
The Super Admin system allows a system-level administrator to manage tenants and users across the entire billing software platform.

## Features
- **Tenant Management**: Onboard new tenants, update tenant information, activate/deactivate tenants
- **User Management**: Create, update, activate/deactivate users across all tenants
- **Cross-Tenant Access**: View and manage data across all tenants
- **System Administration**: Full access to system configuration and settings

## Setup Instructions

### Step 1: Run Database Script
Execute the SQL script to create the Super Admin system:

```bash
sqlcmd -S "YOUR_SERVER" -d BillingDB -E -i "Database\Create_SuperAdmin.sql"
```

This script will:
- Create a `SYSTEM` tenant
- Create `SuperAdmin` role
- Create SuperAdmin permissions
- Create the super admin user

### Step 2: Login Credentials

After running the script, you can login with:

- **Tenant Code**: `SYSTEM` (or leave empty)
- **Email**: `superadmin@system.com`
- **Password**: `Admin@123`

## API Endpoints

### Tenant Management
All tenant management endpoints are available at `/api/admin/tenants`:

- `GET /api/admin/tenants` - Get all tenants
- `GET /api/admin/tenants/{id}` - Get tenant by ID
- `POST /api/admin/tenants/onboard` - Onboard a new tenant
- `PUT /api/admin/tenants/{id}` - Update tenant
- `DELETE /api/admin/tenants/{id}` - Deactivate tenant
- `POST /api/admin/tenants/{id}/activate` - Activate tenant

### User Management
All user management endpoints are available at `/api/admin/users`:

- `GET /api/admin/users` - Get all users (with optional filtering)
- `GET /api/admin/users/{id}` - Get user by ID
- `POST /api/admin/users` - Create a new user
- `PUT /api/admin/users/{id}` - Update user
- `POST /api/admin/users/{id}/activate` - Activate user
- `POST /api/admin/users/{id}/deactivate` - Deactivate user
- `DELETE /api/admin/users/{id}` - Delete user (soft delete)
- `GET /api/admin/users/roles` - Get all available roles

## Example: Onboard a New Tenant

```json
POST /api/admin/tenants/onboard
Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN

{
  "tenantName": "New Retail Store",
  "tenantCode": "RETAIL02",
  "businessType": "Retail",
  "contactEmail": "contact@retailstore.com",
  "contactPhone": "+1234567890",
  "address": "123 Main St, City, State",
  "planType": "Basic",
  "invoicePrefix": "INV",
  "currency": "USD",
  "enableGST": true,
  "enableInventory": true,
  "adminEmail": "admin@retailstore.com",
  "adminPassword": "SecurePassword123!",
  "adminFirstName": "Store",
  "adminLastName": "Admin"
}
```

## Example: Create a User

```json
POST /api/admin/users
Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN

{
  "tenantId": 2,
  "email": "user@tenant.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "isActive": true,
  "roleIds": [1, 2]
}
```

## Security Notes

1. **SuperAdmin Role**: Only users with the `SuperAdmin` role can access these endpoints
2. **Tenant Isolation**: Regular users are still restricted to their own tenant
3. **Password Security**: SuperAdmin password should be changed after initial setup
4. **Audit Logging**: All SuperAdmin actions should be logged for audit purposes

## Permissions

The SuperAdmin role has the following permissions:
- `Manage.Tenants` - Manage tenant onboarding and configuration
- `Manage.Users` - Manage users across all tenants
- `View.AllTenants` - View all tenants in the system
- `View.AllUsers` - View all users across all tenants

## Troubleshooting

### Cannot Login as SuperAdmin
1. Verify the SYSTEM tenant exists: `SELECT * FROM Tenants WHERE Code = 'SYSTEM'`
2. Verify the SuperAdmin user exists: `SELECT * FROM Users WHERE Email = 'superadmin@system.com'`
3. Verify the SuperAdmin role is assigned: `SELECT * FROM UserRoles ur JOIN Roles r ON ur.RoleId = r.Id WHERE r.Name = 'SuperAdmin'`

### Access Denied Errors
1. Verify your JWT token includes the `SuperAdmin` role
2. Check that the `[Authorize(Roles = "SuperAdmin")]` attribute is present on the controller
3. Ensure the middleware is properly configured in `Program.cs`

## Next Steps

1. Change the default SuperAdmin password
2. Configure audit logging for SuperAdmin actions
3. Set up additional SuperAdmin users if needed
4. Configure tenant onboarding templates for common business types

