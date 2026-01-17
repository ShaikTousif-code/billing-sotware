-- Final Password Fix - Using Verified Hashes
-- DEMO user: Admin@123 (hash: 6G94qKPK8LYNjnTllCqm2G3BUM08AzOK7yW30tfjrMc=) - VERIFIED WORKING
-- All other users: Password123! - Need to verify hash

USE BillingDB;
GO

SET QUOTED_IDENTIFIER ON;
GO

PRINT '========================================';
PRINT 'Password Hash Fix - Final Version';
PRINT '========================================';
PRINT '';
PRINT 'STEP 1: DEMO user (already correct)';
PRINT '  Email: admin@demoshop.com';
PRINT '  Password: Admin@123';
PRINT '  Hash: 6G94qKPK8LYNjnTllCqm2G3BUM08AzOK7yW30tfjrMc=';
PRINT '';
PRINT 'STEP 2: To get correct hash for Password123!';
PRINT '  1. Start the API';
PRINT '  2. Call: GET http://localhost:5000/api/TestHash/hash/Password123!';
PRINT '  3. Update the hash below with the result';
PRINT '';
PRINT 'For now, keeping existing hash (may need correction)';
PRINT '========================================';
GO

-- The hash jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg= might be incorrect
-- We need to verify it using the API's TestHash endpoint

-- Keep DEMO user as is (it's working)
-- All other users will use Password123! once we verify the hash

PRINT 'Current status:';
PRINT '- DEMO user: Admin@123 (working)';
PRINT '- Other users: Password123! (hash needs verification)';
PRINT '';
PRINT 'To verify hash, call the API endpoint:';
PRINT 'GET /api/TestHash/hash/Password123!';
PRINT '========================================';
GO

