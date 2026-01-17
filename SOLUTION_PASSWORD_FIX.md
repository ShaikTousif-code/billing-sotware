# Password Hash Fix - Complete Solution

## Problem
- DEMO user can login (password: `Admin@123`) ✅
- All other users cannot login (password: `Password123!`) ❌
- Now DEMO user also cannot login ❌

## Root Cause
The password hash for "Password123!" in the database is incorrect.

## Solution (Choose One)

### Option 1: Use Register Endpoint (Easiest)

1. **Restore Program.cs** (if overwritten - use Ctrl+Z in your IDE)

2. **Start the API:**
   ```bash
   cd BillingAPI
   dotnet run
   ```

3. **Login as DEMO user** (this should work):
   - Tenant: `DEMO001`
   - Email: `admin@demoshop.com`
   - Password: `Admin@123`

4. **Register a test user** (this generates the correct hash):
   ```bash
   POST http://localhost:5000/api/auth/register
   Authorization: Bearer YOUR_JWT_TOKEN
   {
     "email": "testhash@test.com",
     "password": "Password123!",
     "firstName": "Test",
     "lastName": "User"
   }
   ```

5. **Get the generated hash:**
   ```sql
   SELECT PasswordHash FROM Users WHERE Email = 'testhash@test.com';
   ```

6. **Update all users with the correct hash:**
   ```sql
   DECLARE @CorrectHash NVARCHAR(MAX) = (SELECT PasswordHash FROM Users WHERE Email = 'testhash@test.com');
   UPDATE [Users] SET [PasswordHash] = @CorrectHash WHERE [Email] != 'admin@demoshop.com';
   ```

7. **Delete test user:**
   ```sql
   DELETE FROM Users WHERE Email = 'testhash@test.com';
   ```

### Option 2: Use Test Hash Endpoint

1. **Restore Program.cs** (if overwritten)

2. **Start the API**

3. **Call test endpoint:**
   ```bash
   GET http://localhost:5000/api/TestHash/hash/Password123!
   ```

4. **Update database with the returned hash**

### Option 3: Manual Hash Calculation

The hash should be calculated as:
- SHA256("Password123!") 
- Then Base64 encoded

You can use an online tool or the TestHashController endpoint.

## Current Status

- **DEMO user hash:** `6G94qKPK8LYNjnTllCqm2G3BUM08AzOK7yW30tfjrMc=` (for "Admin@123") - ✅ Working
- **Other users hash:** `jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=` (for "Password123!") - ❌ Not working

## Quick Fix Script

After getting the correct hash, run:
```sql
UPDATE [Users]
SET [PasswordHash] = 'CORRECT_HASH_HERE'
WHERE [Email] != 'admin@demoshop.com';
```

## Important Notes

1. **Program.cs was accidentally overwritten** - Please restore it using Ctrl+Z in your IDE
2. The TestHashController is already created and ready to use
3. All users should use `Password123!` except DEMO user who uses `Admin@123`

