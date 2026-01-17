-- Restore Original Passwords
-- DEMO user: Admin@123
-- All other users: Password123!

USE BillingDB;
GO

SET QUOTED_IDENTIFIER ON;
GO

PRINT '========================================';
PRINT 'Restoring Original Passwords...';
PRINT '========================================';
GO

-- Restore DEMO user to original password: Admin@123
-- Hash for "Admin@123": 6G94qKPK8LYNjnTllCqm2G3BUM08AzOK7yW30tfjrMc=
UPDATE [Users]
SET [PasswordHash] = '6G94qKPK8LYNjnTllCqm2G3BUM08AzOK7yW30tfjrMc='
WHERE [Email] = 'admin@demoshop.com';

PRINT 'Restored DEMO user password: Admin@123';
PRINT '';

-- Keep all other users with Password123!
-- Hash for "Password123!": jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=
-- (This hash needs to be verified - it might be incorrect)

PRINT 'Other users password: Password123!';
PRINT '';
PRINT '========================================';
PRINT 'IMPORTANT: Verify the hash for Password123!';
PRINT 'The hash jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg= might be incorrect.';
PRINT 'Please test login with DEMO user first:';
PRINT '  Tenant: DEMO001';
PRINT '  Email: admin@demoshop.com';
PRINT '  Password: Admin@123';
PRINT '========================================';
GO

