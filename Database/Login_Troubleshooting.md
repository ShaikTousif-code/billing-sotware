# Login Troubleshooting Guide

## Current Status
All users have been updated with the same password hash: `jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=`

## Password for ALL Users
**Password: `Password123!`**

## Login Credentials

### Retail (RETAIL01)
- Email: `owner@retail.com`
- Password: `Password123!`
- Tenant Code: `RETAIL01`

### Medical (MEDICAL01)
- Email: `admin@medical.com`
- Password: `Password123!`
- Tenant Code: `MEDICAL01`

### School (SCHOOL01)
- Email: `principal@school.com`
- Password: `Password123!`
- Tenant Code: `SCHOOL01`

### Office (OFFICE01)
- Email: `ceo@office.com`
- Password: `Password123!`
- Tenant Code: `OFFICE01`

### Demo (DEMO001)
- Email: `admin@demoshop.com`
- Password: `Password123!`
- Tenant Code: `DEMO001`

## If Login Still Fails

### Check 1: Verify User is Active
```sql
SELECT Email, IsActive FROM Users WHERE Email = 'your-email@example.com';
```
Should return `IsActive = 1`

### Check 2: Verify Tenant is Active
```sql
SELECT Code, IsActive FROM Tenants WHERE Code = 'RETAIL01';
```
Should return `IsActive = 1`

### Check 3: Verify Password Hash
```sql
SELECT Email, PasswordHash FROM Users WHERE Email = 'your-email@example.com';
```
Should return: `jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=`

### Check 4: Verify Tenant Code (Case Sensitive)
- Use exact case: `RETAIL01` not `retail01` or `Retail01`

### Check 5: Verify Email (Case Sensitive)
- Use exact case: `owner@retail.com` not `Owner@Retail.com`

### Check 6: Check API Logs
Look for error messages in the API console/logs when attempting to login.

## Common Issues

1. **Case Sensitivity**: Tenant codes and emails are case-sensitive
2. **Extra Spaces**: Make sure there are no leading/trailing spaces in password
3. **API Not Running**: Ensure the API is running and accessible
4. **Database Connection**: Verify the API can connect to the database

## Test Login Endpoint
```bash
POST /api/auth/login
{
  "tenantCode": "RETAIL01",
  "email": "owner@retail.com",
  "password": "Password123!"
}
```

