# User Login Credentials

## Important Note
Passwords are stored as SHA256 hashes in the database. The plain text passwords used in the seed script are listed below.

---

## All Users with Login Credentials

### Retail Tenant (RETAIL01) - SuperMart Retail Store

| Email | Password | Role | Name |
|-------|----------|------|------|
| owner@retail.com | Password123! | Owner | John Smith |
| manager@retail.com | Password123! | Manager | Sarah Johnson |
| cashier@retail.com | Password123! | Cashier | Mike Davis |

---

### Medical Tenant (MEDICAL01) - City Medical Center

| Email | Password | Role | Name |
|-------|----------|------|------|
| admin@medical.com | Password123! | Owner | Dr. Robert Williams |
| doctor@medical.com | Password123! | Doctor | Dr. Emily Brown |
| nurse@medical.com | Password123! | Nurse | Lisa Anderson |

---

### School Tenant (SCHOOL01) - Greenwood High School

| Email | Password | Role | Name |
|-------|----------|------|------|
| principal@school.com | Password123! | Owner | Principal Thompson |
| teacher@school.com | Password123! | Teacher | Mary Wilson |
| accountant@school.com | Password123! | Accountant | David Martinez |

---

### Office Tenant (OFFICE01) - Tech Solutions Inc

| Email | Password | Role | Name |
|-------|----------|------|------|
| ceo@office.com | Password123! | Owner | CEO Johnson |
| pm@office.com | Password123! | Manager | Project Manager |

---

### Demo Tenant (DEMO001) - Demo Shop

| Email | Password | Role | Name |
|-------|----------|------|------|
| admin@demoshop.com | *Unknown* | Owner | Admin User |

**Note:** The demo user has a different password hash. You may need to reset this password or check the original seed data.

---

## Quick Reference

### Default Password
**Password for all seeded users (except demo): `Password123!`**

### Tenant Codes for Login
- **RETAIL01** - Retail/SuperMart
- **MEDICAL01** - Medical/City Medical Center
- **SCHOOL01** - School/Greenwood High School
- **OFFICE01** - Office/Tech Solutions Inc
- **DEMO001** - Demo Shop

---

## Password Hash Information

All passwords (except demo) use the hash: `jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=`

This is the SHA256 hash of: `Password123!`

The demo user has a different hash: `6G94qKPK8LYNjnTllCqm2G3BUM08AzOK7yW30tfjrMc=`

---

## Login Instructions

1. Use the **Tenant Code** (e.g., RETAIL01) when logging in
2. Use the **Email** address as username
3. Use **Password123!** as the password (for all except demo user)

Example:
- Tenant Code: `RETAIL01`
- Email: `owner@retail.com`
- Password: `Password123!`

