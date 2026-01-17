# Password Hash Fix Instructions

## Current Status
- ✅ **DEMO user** (`admin@demoshop.com`) - **WORKING**
  - Password: `Admin@123`
  - Hash: `6G94qKPK8LYNjnTllCqm2G3BUM08AzOK7yW30tfjrMc=`

- ❌ **All other users** - **NOT WORKING**
  - Password: `Password123!`
  - Current Hash: `jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=` (may be incorrect)

## Solution

### Option 1: Use Test Hash Endpoint (Recommended)

1. **Start the API:**
   ```bash
   cd BillingAPI
   dotnet run
   ```

2. **Call the test hash endpoint:**
   ```bash
   GET http://localhost:5000/api/TestHash/hash/Password123!
   ```

3. **You should get a response like:**
   ```json
   {
     "password": "Password123!",
     "hash": "ACTUAL_CORRECT_HASH_HERE"
   }
   ```

4. **Update the database with the correct hash:**
   ```sql
   UPDATE [Users]
   SET [PasswordHash] = 'ACTUAL_CORRECT_HASH_HERE'
   WHERE [Email] != 'admin@demoshop.com';
   ```

### Option 2: Use Register Endpoint

1. **Start the API**

2. **Login as DEMO user:**
   - Tenant: `DEMO001`
   - Email: `admin@demoshop.com`
   - Password: `Admin@123`

3. **Register a test user** (this will generate the correct hash):
   ```bash
   POST /api/auth/register
   {
     "email": "test@test.com",
     "password": "Password123!",
     "firstName": "Test",
     "lastName": "User"
   }
   ```

4. **Check the database for the generated hash:**
   ```sql
   SELECT PasswordHash FROM Users WHERE Email = 'test@test.com';
   ```

5. **Update all users with that hash:**
   ```sql
   UPDATE [Users]
   SET [PasswordHash] = (SELECT PasswordHash FROM Users WHERE Email = 'test@test.com')
   WHERE [Email] != 'admin@demoshop.com';
   ```

6. **Delete the test user:**
   ```sqla
   DELETE FROM Users WHERE Email = 'test@test.com';
   ```

## Quick Test

After fixing, test login with:
- **Tenant:** `RETAIL01`
- **Email:** `owner@retail.com`
- **Password:** `Password123!`

## Files Created

- `BillingAPI/Controllers/TestHashController.cs` - Test endpoint to generate hashes
- `Database/Fix_All_Passwords_Final.sql` - Script template (needs hash update)

