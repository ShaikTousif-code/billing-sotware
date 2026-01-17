# Billing Software - Complete Solution

A comprehensive, multi-tenant billing software solution built with React (frontend), .NET 8 (backend API), and SQL Server (database).

## 🏗️ Architecture

- **Frontend**: React 18 with TypeScript, Vite, Tailwind CSS, React Router
- **Backend**: .NET 8 Web API with Entity Framework Core
- **Database**: SQL Server
- **Authentication**: JWT Bearer Tokens
- **Architecture**: Multi-tenant SaaS with tenant isolation

## 📁 Project Structure

```
BillingSoftware/
├── BillingAPI/              # .NET Web API Backend
│   ├── Controllers/         # API Controllers
│   ├── Data/                # DbContext and Data Layer
│   ├── Models/              # Entity Models
│   ├── Services/            # Business Logic Services
│   ├── Middleware/          # Custom Middleware
│   └── Program.cs           # Application Entry Point
├── BillingUI/               # React Frontend (TypeScript)
│   ├── src/
│   │   ├── components/      # Reusable Components (.tsx)
│   │   ├── contexts/        # React Contexts (Auth)
│   │   ├── pages/           # Page Components (.tsx)
│   │   ├── services/        # API Service Layer (.ts)
│   │   ├── types/           # TypeScript Type Definitions
│   │   ├── App.tsx          # Main App Component
│   │   └── main.tsx         # Entry Point
│   ├── tsconfig.json        # TypeScript Configuration
│   └── package.json
└── Database/                # SQL Server Scripts
    └── Schema.sql           # Database Schema
```

## 🚀 Getting Started

### Prerequisites

- .NET 8 SDK
- Node.js 18+ and npm
- SQL Server (LocalDB or SQL Server Express)
- Visual Studio 2022 or VS Code

### Backend Setup (.NET API)

1. Navigate to the `BillingAPI` directory:
```bash
cd BillingAPI
```

2. Restore packages:
```bash
dotnet restore
```

3. Update the connection string in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=BillingSoftware;Trusted_Connection=true;MultipleActiveResultSets=true"
  }
}
```

4. Run the database migrations or execute the SQL script:
   - Option 1: Run `Database/Schema.sql` in SQL Server Management Studio
   - Option 2: The app will create the database automatically on first run (EnsureCreated)

5. Run the API:
```bash
dotnet run
```

The API will be available at `https://localhost:5000` or `http://localhost:5000`

### Frontend Setup (React with TypeScript)

1. Navigate to the `BillingUI` directory:
```bash
cd BillingUI
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

**Note**: The frontend is built with TypeScript for type safety and better developer experience.

### Default Login Credentials

After running the database script, you can login with:
- **Tenant Code**: `DEMO001`
- **Email**: `admin@demoshop.com`
- **Password**: `Admin@123`

## ✨ Features

### Core Features (MVP) - ✅ Complete
- ✅ Multi-tenant architecture with data isolation
- ✅ User authentication and authorization (JWT)
- ✅ Product/Service management
- ✅ Customer management
- ✅ Invoice creation and management
- ✅ Inventory tracking
- ✅ Reports and analytics
- ✅ Dashboard with sales overview

### Advanced Features - ✅ Implemented
- ✅ Draft, Hold, Resume, and Completed invoice states
- ✅ Tax calculation (GST support)
- ✅ Discounts (item-level and bill-level)
- ✅ Round-off handling
- ✅ Stock transactions tracking
- ✅ Sales reports with charts
- ✅ Product sales analysis
- ✅ Stock summary reports
- ✅ **PDF Generation** - Invoice and credit note PDFs
- ✅ **Excel Import/Export** - Bulk operations
- ✅ **Payment Processing** - Partial and split payments
- ✅ **Credit Notes & Refunds** - Complete workflow
- ✅ **Activity Logs** - Comprehensive audit trail
- ✅ **Low Stock Alerts** - Automated alerts
- ✅ **Customer Ledger** - Transaction history
- ✅ **Profit & Loss Reports** - Financial reports
- ✅ **Tax Summary Reports** - Tax analytics
- ✅ **Payment Mode Analytics** - Payment insights
- ✅ **Wallet Management** - Customer wallet system
- ✅ **Product Variants** - Size, color, pack variants
- ✅ **Multiple Price Lists** - Retail/wholesale pricing
- ✅ **Multi-Warehouse** - Warehouse management
- ✅ **Purchase Returns** - Return workflow
- ✅ **Customer Purchase History** - Purchase tracking

### Business-Specific Modules - ✅ Implemented
- ✅ **Hotel/Restaurant Module** - Table management, KOT system
- ✅ **Service Business Module** - Job cards, appointments
- ✅ **Medical/Pharmacy Module** - Batch tracking, expiry alerts
- ✅ **Retail Module** - Barcode support, variants
- ⏳ Grocery Module - Weight-based pricing (partial)

### Future Enhancements
- Payment gateway integration
- Purchase order management
- Supplier management
- Advanced inventory (FIFO/LIFO, batch tracking)
- Business-specific modules (Medical, Hotel, etc.)
- Mobile apps (Android/iOS)
- Offline support (PWA)
- AI-powered insights

## 🔐 Security

- JWT-based authentication
- Role-based authorization (Owner, Manager, Cashier, Accountant)
- Tenant data isolation
- Password hashing (SHA256)
- CORS configuration for frontend

## 📊 Database Schema

The database includes tables for:
- Tenants (multi-tenant support)
- Users and Roles
- Products and Categories
- Customers and Suppliers
- Invoices and Invoice Items
- Payments
- Inventory and Stock Transactions
- Purchase Orders
- Configuration tables

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (Owner only)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product
- `GET /api/product-variants/product/{productId}` - Get product variants
- `POST /api/product-variants` - Create variant

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/{id}` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer
- `GET /api/customer-purchase-history/customer/{customerId}` - Purchase history
- `GET /api/customer-groups` - Get customer groups

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/{id}` - Get invoice by ID
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/{id}` - Update invoice
- `POST /api/invoices/{id}/cancel` - Cancel invoice
- `POST /api/invoices/{id}/hold` - Hold invoice
- `POST /api/invoices/{id}/resume` - Resume invoice
- `POST /api/invoices/{id}/duplicate` - Duplicate invoice

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create payment
- `POST /api/payments/split` - Create split payment
- `DELETE /api/payments/{id}` - Delete payment

### Credit Notes & Refunds
- `GET /api/credit-notes` - Get all credit notes
- `POST /api/credit-notes` - Create credit note
- `POST /api/credit-notes/{id}/process` - Process credit note
- `GET /api/refunds` - Get all refunds
- `POST /api/refunds` - Create refund

### Reports
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/product-sales` - Product sales report
- `GET /api/reports/stock-summary` - Stock summary
- `GET /api/reports/customer-ledger/{customerId}` - Customer ledger
- `GET /api/reports/tax-summary` - Tax summary
- `GET /api/reports/profit-loss` - Profit & Loss
- `GET /api/reports/payment-mode` - Payment analytics

### Export & Import
- `GET /api/export/products/excel` - Export products
- `GET /api/export/customers/excel` - Export customers
- `GET /api/export/invoices/excel` - Export invoices
- `GET /api/export/invoices/{id}/pdf` - Export invoice PDF
- `POST /api/export/products/import` - Import products
- `POST /api/export/customers/import` - Import customers

### Alerts
- `GET /api/alerts/low-stock` - Low stock alerts
- `GET /api/alerts/expiry` - Expiry alerts

### Wallet
- `GET /api/wallet/customer/{customerId}` - Get wallet transactions
- `POST /api/wallet/customer/{customerId}/credit` - Add credit
- `POST /api/wallet/customer/{customerId}/debit` - Add debit

### Warehouse
- `GET /api/warehouses` - Get all warehouses
- `POST /api/warehouses` - Create warehouse
- `GET /api/warehouses/{id}/inventory` - Get warehouse inventory

### Price Lists
- `GET /api/price-lists` - Get all price lists
- `POST /api/price-lists` - Create price list
- `GET /api/price-lists/{id}/price/{productId}` - Get product price

### Business Modules
- `GET /api/tables` - Get all tables (Hotel/Restaurant)
- `POST /api/tables` - Create table
- `GET /api/kot` - Get KOTs
- `POST /api/kot` - Create KOT
- `GET /api/job-cards` - Get job cards (Service)
- `POST /api/job-cards` - Create job card
- `GET /api/appointments` - Get appointments

### Activity Logs
- `GET /api/activity-logs` - Get activity logs
- `GET /api/activity-logs/user/{userId}` - Get user activity

## 🎨 UI Features

- Modern, responsive design with Tailwind CSS
- Dashboard with sales statistics and charts
- Product management with search
- Customer management with quick add
- Invoice creation with real-time calculations
- Reports with date range filtering
- Mobile-friendly sidebar navigation

## 📝 Notes

- The password hash in the database script uses SHA256. For production, consider using bcrypt or ASP.NET Identity.
- The JWT secret key in `appsettings.json` should be changed for production.
- Database connection string should be updated based on your SQL Server setup.
- CORS is configured for local development. Update for production deployment.

## 🔄 Next Steps

1. Add payment processing
2. Implement purchase order workflow
3. Add more business-specific modules
4. Enhance reporting with export (PDF/Excel)
5. Add audit logging
6. Implement backup/restore functionality
7. Add email/SMS notifications
8. Create mobile applications

## 📄 License

This project is provided as-is for development purposes.

