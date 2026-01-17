# Quick Password Fix Guide

## Problem
- DEMO user can login (password: `Admin@123`)
- All other users cannot login (password: `Password123!`)

## Root Cause
The hash for "Password123!" might be incorrect in the database.

## Solution

### Step 1: Start the API
```bash
cd BillingAPI
dotnet run
```

### Step 2: Get the Correct Hash
Call this endpoint to get the correct hash:
```bash
GET http://localhost:5000/api/TestHash/hash/Password123!
```

Or use curl:
```bash
curl http://localhost:5000/api/TestHash/hash/Password123!
```

### Step 3: Update Database
Once you have the correct hash, run:
```sql
UPDATE [Users]
SET [PasswordHash] = 'CORRECT_HASH_FROM_STEP_2'
WHERE [Email] != 'admin@demoshop.com';
```

### Alternative: Use Register Endpoint
1. Login as DEMO user (works)
2. Register a test user with password "Password123!"
3. Check the generated hash in database
4. Update all users with that hash
5. Delete test user

## Current Hashes
- DEMO user: `6G94qKPK8LYNjnTllCqm2G3BUM08AzOK7yW30tfjrMc=` (for "Admin@123") ✅
- Other users: `jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=` (for "Password123!") ❓

## Test After Fix
- Tenant: `RETAIL01`
- Email: `owner@retail.com`
- Password: `Password123!`

