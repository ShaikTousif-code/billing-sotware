using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using BillingAPI.Data;
using BillingAPI.Middleware;
using BillingAPI.Services;
using BillingAPI.Validators;
using BillingAPI.Converters;
using FluentValidation.AspNetCore;
using Serilog;
using Hangfire;
using Hangfire.SqlServer;
using Hangfire.AspNetCore;
using BillingAPI.Infrastructure;
using Microsoft.Data.SqlClient;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        // Ensure DateTime is serialized as UTC with 'Z' suffix
        options.JsonSerializerOptions.Converters.Add(new UtcDateTimeConverter());
        options.JsonSerializerOptions.Converters.Add(new UtcDateTimeNullableConverter());
    });
builder.Services.AddEndpointsApiExplorer();

// Swagger configuration
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Billing API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Database - Add connection timeout to prevent hanging
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    // Get connection string from environment variable first, then configuration
    var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
        ?? builder.Configuration.GetConnectionString("DefaultConnection");
    
    if (string.IsNullOrEmpty(connectionString))
    {
        throw new InvalidOperationException("Database connection string must be configured via DB_CONNECTION_STRING environment variable or ConnectionStrings:DefaultConnection in appsettings.json");
    }
    
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.CommandTimeout(30); // 30 second timeout for commands
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorNumbersToAdd: null);
    });
});

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
// Get secret key from environment variable first, then configuration, then fallback (only for development)
var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") 
    ?? jwtSettings["SecretKey"] 
    ?? (builder.Environment.IsDevelopment() ? "YourSuperSecretKeyThatShouldBeAtLeast32CharactersLong!" : null);

if (string.IsNullOrEmpty(secretKey))
{
    throw new InvalidOperationException("JWT Secret Key must be configured via JWT_SECRET_KEY environment variable or appsettings.json");
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "BillingAPI",
        ValidAudience = jwtSettings["Audience"] ?? "BillingAPI",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

builder.Services.AddAuthorization();

// CORS - Support environment-based origins
var corsOrigins = new List<string>();
var corsSection = builder.Configuration.GetSection("Cors:AllowedOrigins");

if (corsSection.Exists() && corsSection.GetChildren().Any())
{
    // Read from configuration array
    corsOrigins.AddRange(corsSection.Get<string[]>() ?? Array.Empty<string>());
}
else
{
    // Fallback to environment variable or default localhost for development
    var envOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS");
    if (!string.IsNullOrEmpty(envOrigins))
    {
        corsOrigins.AddRange(envOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
    }
    else if (builder.Environment.IsDevelopment())
    {
        // Default localhost origins for development
        corsOrigins.AddRange(new[] { "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:5173" });
    }
}

if (corsOrigins.Count == 0 && !builder.Environment.IsDevelopment())
{
    throw new InvalidOperationException("CORS origins must be configured via CORS:AllowedOrigins in appsettings.json or CORS_ALLOWED_ORIGINS environment variable");
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(corsOrigins.ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IPdfService, PdfService>();
builder.Services.AddScoped<IExcelService, ExcelService>();
builder.Services.AddScoped<IAlertService, AlertService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IWalletService, WalletService>();
builder.Services.AddScoped<ILoyaltyService, LoyaltyService>();
builder.Services.AddScoped<ICreditNoteService, CreditNoteService>();
builder.Services.AddScoped<IActivityLogService, ActivityLogService>();
builder.Services.AddScoped<IProductVariantService, ProductVariantService>();
builder.Services.AddScoped<ICostingService, CostingService>();
builder.Services.AddScoped<IUnitConversionService, UnitConversionService>();
builder.Services.AddScoped<ICustomerPurchaseHistoryService, CustomerPurchaseHistoryService>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IMedicalWorkflowService, MedicalWorkflowService>();
builder.Services.AddScoped<IStudentService, StudentService>();
builder.Services.AddScoped<IFeeService, FeeService>();
builder.Services.AddScoped<IFeeAssignmentService, FeeAssignmentService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IFeeReceiptService, FeeReceiptService>();
builder.Services.AddScoped<IInstallmentService, InstallmentService>();
builder.Services.AddScoped<ITimeTrackingService, TimeTrackingService>();
builder.Services.AddScoped<IRecurringInvoiceService, RecurringInvoiceService>();
builder.Services.AddScoped<IMilestoneService, MilestoneService>();
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<IFeeConcessionService, FeeConcessionService>();
builder.Services.AddScoped<IBackgroundJobService, BackgroundJobService>();
builder.Services.AddScoped<IBillScannerService, BillScannerService>();
builder.Services.AddScoped<IProductVariantCombinationService, ProductVariantCombinationService>();
builder.Services.AddScoped<ISizeChartService, SizeChartService>();
builder.Services.AddScoped<ISalesReturnService, SalesReturnService>();
builder.Services.AddScoped<ISalesExchangeService, SalesExchangeService>();

// Hangfire - Configure with minimal blocking options (can be disabled via env var)
// Default to false to prevent issues if database is not available
var enableHangfire = builder.Configuration.GetValue<bool>("Hangfire:Enabled", false);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (enableHangfire && !string.IsNullOrEmpty(connectionString))
{
    try
    {
        // Skip database connection test to speed up startup - Hangfire will handle connection errors gracefully
        Console.WriteLine("Configuring Hangfire (database connection will be tested on first use)...");
        
        builder.Services.AddHangfire(config =>
        {
            config.UseSqlServerStorage(connectionString, new SqlServerStorageOptions
            {
                SchemaName = "HangFire",
                QueuePollInterval = TimeSpan.FromSeconds(15),
                JobExpirationCheckInterval = TimeSpan.FromHours(1),
                CountersAggregateInterval = TimeSpan.FromMinutes(5),
                PrepareSchemaIfNecessary = false, // Don't prepare schema during startup - do it lazily
                DashboardJobListLimit = 50000,
                TransactionTimeout = TimeSpan.FromSeconds(30),
                CommandBatchMaxTimeout = TimeSpan.FromSeconds(30),
                TryAutoDetectSchemaDependentOptions = false // Disable auto-detection to prevent connection errors
            });
        });

        // Add Hangfire server but configure it to not block startup
        builder.Services.AddHangfireServer(options =>
        {
            options.ServerName = Environment.MachineName;
            options.WorkerCount = Math.Min(Environment.ProcessorCount * 5, 20);
            options.StopTimeout = TimeSpan.FromSeconds(10);
            options.ShutdownTimeout = TimeSpan.FromSeconds(10);
            options.SchedulePollingInterval = TimeSpan.FromSeconds(15);
            options.Queues = new[] { "default" };
        });
    }
    catch (Exception ex)
    {
        // Log but don't fail startup if Hangfire can't be configured
        var logger = Serilog.Log.Logger;
        logger?.Warning(ex, "Hangfire configuration failed: {Message}. Continuing without Hangfire.", ex.Message);
        Console.WriteLine($"Warning: Hangfire configuration failed: {ex.Message}. Continuing without Hangfire.");
        // Disable Hangfire for this session
        enableHangfire = false;
    }
}

// FluentValidation
builder.Services.AddFluentValidation(fv =>
{
    fv.RegisterValidatorsFromAssemblyContaining<CreateProductValidator>();
    fv.RegisterValidatorsFromAssemblyContaining<CreateCustomerValidator>();
    fv.RegisterValidatorsFromAssemblyContaining<CreateInvoiceValidator>();
    fv.RegisterValidatorsFromAssemblyContaining<CreatePaymentValidator>();
    fv.RegisterValidatorsFromAssemblyContaining<StudentValidator>();
});



// Response compression
builder.Services.AddResponseCompression();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Skip HTTPS redirection in Development environment
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors("AllowReactApp");
app.UseResponseCompression();


// Middleware
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
app.UseMiddleware<NoCacheMiddleware>(); // Disable caching for all responses
app.UseMiddleware<RateLimitingMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<TenantMiddleware>();
app.UseMiddleware<PermissionAuthorizationMiddleware>();
app.UseMiddleware<ActivityLoggingMiddleware>();

app.MapControllers();

// Hangfire Dashboard and Job Registration (completely non-blocking)
var hangfireEnabled = app.Configuration.GetValue<bool>("Hangfire:Enabled", false);
if (hangfireEnabled)
{
    try
    {
        // Hangfire Dashboard (configure before job registration to avoid blocking)
        if (app.Environment.IsDevelopment())
        {
            app.UseHangfireDashboard("/hangfire", new DashboardOptions
            {
                Authorization = new[] { new HangfireAuthorizationFilter() }
            });
        }

        // Initialize Hangfire job executor and schedule jobs asynchronously (completely non-blocking)
        // Use a fire-and-forget approach that won't block startup
        _ = Task.Run(async () =>
        {
            try
            {
                // Wait longer to ensure database and app are fully ready
                await Task.Delay(5000);
                
                HangfireJobExecutor.Initialize(app.Services);
                
                using (var scope = app.Services.CreateScope())
                {
                    var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
                    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

                    try
                    {
                        recurringJobManager.AddOrUpdate(
                            "generate-recurring-invoices",
                            () => HangfireJobExecutor.ExecuteGenerateRecurringInvoicesJobAsync(),
                            Cron.Daily(1)); // Run daily at 1 AM

                        recurringJobManager.AddOrUpdate(
                            "send-fee-reminders",
                            () => HangfireJobExecutor.ExecuteSendFeeRemindersJobAsync(),
                            Cron.Daily(9)); // Run daily at 9 AM

                        recurringJobManager.AddOrUpdate(
                            "send-contract-reminders",
                            () => HangfireJobExecutor.ExecuteSendContractRenewalRemindersJobAsync(),
                            Cron.Daily(10)); // Run daily at 10 AM

                        recurringJobManager.AddOrUpdate(
                            "update-overdue-fees",
                            () => HangfireJobExecutor.ExecuteUpdateOverdueFeesStatusJobAsync(),
                            Cron.Daily(0)); // Run daily at midnight

                        logger.LogInformation("Hangfire recurring jobs registered successfully");
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Failed to register Hangfire recurring jobs. Jobs will not run until this is fixed.");
                    }
                }
            }
            catch (Exception ex)
            {
                // Use console as fallback if logger isn't available
                Console.WriteLine($"Hangfire initialization error: {ex.Message}");
            }
        });
    }
    catch (Exception ex)
    {
        // Don't fail startup if Hangfire setup fails
        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "Hangfire setup failed. Continuing without Hangfire.");
    }
}

app.Run();

