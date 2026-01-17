# Starting the Application

## 🚀 Quick Start

Both services have been started in the background:

### ✅ API (Backend)
- **Status**: Running in background
- **URL**: Usually `https://localhost:5001` or `http://localhost:5000`
- **Swagger**: `https://localhost:5001/swagger`
- **Health Check**: `https://localhost:5001/health`

### ✅ UI (Frontend)
- **Status**: Running in background
- **URL**: Usually `http://localhost:3000` or `http://localhost:5173` (Vite default)

---

## 📋 Manual Start (if needed)

### Start API:
```bash
cd BillingAPI
dotnet run
```

### Start UI (in a new terminal):
```bash
cd BillingUI
npm run dev
```

---

## 🔍 Verify Services

### Check API:
- Open browser: `https://localhost:5001/swagger`
- Or: `https://localhost:5001/health`

### Check UI:
- Open browser: `http://localhost:5173` (or the port shown in terminal)

---

## ⚠️ Troubleshooting

### API not starting:
- Check if port 5000/5001 is already in use
- Verify database connection: `Server=HOORIYASHAIK\SQLEXPRESS`
- Check if SQL Server is running
- Review API terminal output for errors

### UI not starting:
- Check if port 3000/5173 is already in use
- Run `npm install` if packages are missing
- Check UI terminal output for errors

### Database connection errors:
- Verify SQL Server Express is running
- Check connection string in `BillingAPI/appsettings.json`
- Ensure database `BillingDB` exists (run deployment script if needed)

---

## 🎯 Next Steps

1. ✅ Services started
2. ⏭️ Open UI in browser
3. ⏭️ Login with default credentials (if available)
4. ⏭️ Start using the application!

---

**Both services are now running!** 🎉

