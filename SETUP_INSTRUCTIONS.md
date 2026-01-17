# Setup Instructions - Complete Billing Software

## Prerequisites

- .NET 8 SDK
- Node.js 18+ and npm
- SQL Server (LocalDB, Express, or Full)
- Visual Studio 2022 or VS Code

## Step-by-Step Setup

### 1. Database Setup

1. Open SQL Server Management Studio (SSMS) or use `sqlcmd`
2. Create the database:
```sql
CREATE DATABASE BillingSoftware;
GO
USE BillingSoftware;
GO
```

3. Run the base schema:
   - Open `Database/Schema.sql`
   - Execute the entire script

4. Run the new features migration:
   - Open `Database/Migration_NewFeatures.sql`
   - Execute the entire script

5. Run the business modules migration:
   - Open `Database/Migration_BusinessModules.sql`
   - Execute the entire script

### 2. Backend Setup (.NET API)

1. Navigate to `BillingAPI` directory:
```bash
cd BillingAPI
```

2. Update connection string in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=BillingSoftware;Trusted_Connection=true;MultipleActiveResultSets=true"
  }
}
```

3. Restore packages:
```bash
dotnet restore
```

4. Build the project:
```bash
dotnet build
```

5. Run the API:
```bash
dotnet run
```

The API will be available at:
- HTTPS: `https://localhost:5001`
- HTTP: `http://localhost:5000`
- Swagger UI: `https://localhost:5001/swagger`

### 3. Frontend Setup (React + TypeScript)

1. Navigate to `BillingUI` directory:
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

### 4. Default Login Credentials

After running the database scripts:
- **Tenant Code**: `DEMO001`
- **Email**: `admin@demoshop.com`
- **Password**: `Admin@123`

## 📦 NuGet Packages Added

- QuestPDF (PDF generation)
- EPPlus (Excel operations)
- ClosedXML (Excel operations)
- QRCoder (QR code generation)

## 📦 NPM Packages

All packages are already in `package.json`. Run `npm install` to install.

## 🔧 Configuration

### Backend Configuration

Edit `BillingAPI/appsettings.json`:
- Update `ConnectionStrings.DefaultConnection` with your SQL Server connection
- Change `JwtSettings.SecretKey` for production (must be at least 32 characters)
- Adjust CORS origins in `Program.cs` if needed

### Frontend Configuration

The API proxy is configured in `BillingUI/vite.config.js`. Update if your API runs on a different port.

## 🚀 Running the Application

1. **Start the Backend**:
   ```bash
   cd BillingAPI
   dotnet run
   ```

2. **Start the Frontend** (in a new terminal):
   ```bash
   cd BillingUI
   npm run dev
   ```

3. **Access the Application**:
   - Frontend: http://localhost:3000
   - API Swagger: https://localhost:5001/swagger

## 📁 Important Files

- `Database/Schema.sql` - Base database schema
- `Database/Migration_NewFeatures.sql` - New features tables
- `Database/Migration_BusinessModules.sql` - Business modules tables
- `BillingAPI/appsettings.json` - API configuration
- `BillingUI/vite.config.ts` - Frontend configuration

## 🐛 Troubleshooting

### Database Connection Issues
- Verify SQL Server is running
- Check connection string in `appsettings.json`
- Ensure database exists and migrations are run

### Port Conflicts
- Backend: Change ports in `Properties/launchSettings.json`
- Frontend: Change port in `vite.config.ts`

### CORS Issues
- Update CORS origins in `BillingAPI/Program.cs`
- Ensure frontend URL matches CORS configuration

### Missing Packages
- Backend: Run `dotnet restore`
- Frontend: Run `npm install`

## 📝 Next Steps

1. Create your first tenant
2. Add products
3. Create customers
4. Generate invoices
5. Process payments
6. View reports

## 🎉 You're all set!

The application is ready to use with 60-65% of all features implemented and fully functional.

