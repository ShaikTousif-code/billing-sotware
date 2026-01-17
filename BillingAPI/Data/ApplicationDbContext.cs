using Microsoft.EntityFrameworkCore;
using BillingAPI.Models;

namespace BillingAPI.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    // Multi-tenant tables
    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }

    // Core business tables
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductCategory> ProductCategories { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<InvoiceItem> InvoiceItems { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Inventory> Inventories { get; set; }
    public DbSet<StockTransaction> StockTransactions { get; set; }
    public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
    public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }

    // Configuration
    public DbSet<TenantConfiguration> TenantConfigurations { get; set; }
    public DbSet<TaxConfiguration> TaxConfigurations { get; set; }

    // Advanced Features
    public DbSet<CreditNote> CreditNotes { get; set; }
    public DbSet<CreditNoteItem> CreditNoteItems { get; set; }
    public DbSet<Refund> Refunds { get; set; }
    public DbSet<ActivityLog> ActivityLogs { get; set; }
    public DbSet<SupportTicket> SupportTickets { get; set; }
    public DbSet<ProductVariant> ProductVariants { get; set; }
    public DbSet<PriceList> PriceLists { get; set; }
    public DbSet<PriceListItem> PriceListItems { get; set; }
    public DbSet<Warehouse> Warehouses { get; set; }
    public DbSet<WarehouseInventory> WarehouseInventories { get; set; }
    public DbSet<Batch> Batches { get; set; }
    public DbSet<Permission> Permissions { get; set; }
    public DbSet<RolePermission> RolePermissions { get; set; }
    public DbSet<CustomerGroup> CustomerGroups { get; set; }
    public DbSet<BulkPricing> BulkPricings { get; set; }
    public DbSet<LoyaltyTransaction> LoyaltyTransactions { get; set; }
    public DbSet<WalletTransaction> WalletTransactions { get; set; }
    public DbSet<PurchaseReturn> PurchaseReturns { get; set; }
    public DbSet<PurchaseReturnItem> PurchaseReturnItems { get; set; }
    public DbSet<BankAccount> BankAccounts { get; set; }
    public DbSet<InvoiceTemplate> InvoiceTemplates { get; set; }
    public DbSet<BundleProduct> BundleProducts { get; set; }
    public DbSet<BundleItem> BundleItems { get; set; }
    
    // RMG Features
    public DbSet<ProductVariantCombination> ProductVariantCombinations { get; set; }
    public DbSet<SizeChart> SizeCharts { get; set; }
    public DbSet<SalesReturn> SalesReturns { get; set; }
    public DbSet<SalesReturnItem> SalesReturnItems { get; set; }
    public DbSet<SalesExchange> SalesExchanges { get; set; }
    public DbSet<SalesExchangeItem> SalesExchangeItems { get; set; }
    
    // Business-Specific Modules
    public DbSet<Table> Tables { get; set; }
    public DbSet<KOT> KOTs { get; set; }
    public DbSet<KOTItem> KOTItems { get; set; }
    public DbSet<JobCard> JobCards { get; set; }
    public DbSet<JobCardItem> JobCardItems { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<UnitConversion> UnitConversions { get; set; }
    public DbSet<GRN> GRNs { get; set; }
    public DbSet<GRNItem> GRNItems { get; set; }
    public DbSet<SerialNumber> SerialNumbers { get; set; }
    
    // School/College Billing
    public DbSet<Student> Students { get; set; }
    public DbSet<Class> Classes { get; set; }
    public DbSet<FeeStructure> FeeStructures { get; set; }
    public DbSet<FeeHead> FeeHeads { get; set; }
    public DbSet<FeeInstallment> FeeInstallments { get; set; }
    public DbSet<Fee> Fees { get; set; }
    public DbSet<FeePayment> FeePayments { get; set; }
    public DbSet<Institution> Institutions { get; set; }
    public DbSet<AcademicYear> AcademicYears { get; set; }
    
    // Office Billing
    public DbSet<OfficeClient> OfficeClients { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<ProjectInvoice> ProjectInvoices { get; set; }
    public DbSet<ProjectInvoiceItem> ProjectInvoiceItems { get; set; }
    public DbSet<ProjectExpense> ProjectExpenses { get; set; }
    public DbSet<ServiceContract> ServiceContracts { get; set; }
    public DbSet<ContractInvoice> ContractInvoices { get; set; }
    
    // Advanced Features
    public DbSet<InstallmentPlan> InstallmentPlans { get; set; }
    public DbSet<Installment> Installments { get; set; }
    public DbSet<TimeEntry> TimeEntries { get; set; }
    public DbSet<Milestone> Milestones { get; set; }
    public DbSet<Deliverable> Deliverables { get; set; }
    public DbSet<Document> Documents { get; set; }
    public DbSet<FeeConcession> FeeConcessions { get; set; }
    
    // Medical Billing
    public DbSet<Patient> Patients { get; set; }
    public DbSet<MedicalRecord> MedicalRecords { get; set; }
    public DbSet<Diagnosis> Diagnoses { get; set; }
    public DbSet<Procedure> Procedures { get; set; }
    public DbSet<Prescription> Prescriptions { get; set; }
    public DbSet<ICD10Code> ICD10Codes { get; set; }
    public DbSet<CPTCode> CPTCodes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Tenant configuration
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
        });

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.Email }).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(256);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
        });

        // Product configuration
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.SKU }).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.StyleCode).HasMaxLength(50);
            entity.Property(e => e.Season).HasMaxLength(50);
            entity.Property(e => e.Collection).HasMaxLength(100);
            entity.Property(e => e.Gender).HasMaxLength(20);
            entity.Property(e => e.FabricType).HasMaxLength(50);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Category).WithMany().HasForeignKey(e => e.CategoryId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.SizeChart).WithMany().HasForeignKey(e => e.SizeChartId).OnDelete(DeleteBehavior.SetNull);
        });

        // Customer configuration
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.CustomerType).HasMaxLength(10).HasDefaultValue("B2C");
            entity.Property(e => e.PaymentTerms).HasMaxLength(50);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.CustomerGroup).WithMany().HasForeignKey(e => e.CustomerGroupId).OnDelete(DeleteBehavior.SetNull);
        });

        // Bulk Pricing configuration
        modelBuilder.Entity<BulkPricing>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CustomerType).HasMaxLength(10).HasDefaultValue("B2B");
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Product).WithMany().HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.CustomerGroup).WithMany().HasForeignKey(e => e.CustomerGroupId).OnDelete(DeleteBehavior.SetNull);
        });

        // Loyalty Transaction configuration
        modelBuilder.Entity<LoyaltyTransaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Customer).WithMany().HasForeignKey(e => e.CustomerId).OnDelete(DeleteBehavior.Restrict);
        });

        // Invoice configuration
        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.InvoiceNumber }).IsUnique();
            entity.Property(e => e.InvoiceNumber).IsRequired().HasMaxLength(50);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Customer).WithMany().HasForeignKey(e => e.CustomerId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Patient).WithMany().HasForeignKey(e => e.PatientId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.MedicalRecord).WithMany().HasForeignKey(e => e.MedicalRecordId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.CreatedBy).WithMany().HasForeignKey(e => e.CreatedById).OnDelete(DeleteBehavior.Restrict);
        });

        // Invoice Items
        modelBuilder.Entity<InvoiceItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Invoice).WithMany(i => i.Items).HasForeignKey(e => e.InvoiceId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Product).WithMany().HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.VariantCombination).WithMany().HasForeignKey(e => e.VariantCombinationId).OnDelete(DeleteBehavior.SetNull);
            entity.Property(e => e.Size).HasMaxLength(20);
            entity.Property(e => e.Color).HasMaxLength(50);
        });

        // Payment configuration
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Invoice).WithMany().HasForeignKey(e => e.InvoiceId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
        });

        // Inventory configuration
        modelBuilder.Entity<Inventory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.ProductId, e.VariantCombinationId }).IsUnique();
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Product).WithMany().HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.VariantCombination).WithMany().HasForeignKey(e => e.VariantCombinationId).OnDelete(DeleteBehavior.SetNull);
        });

        // Stock Transaction
        modelBuilder.Entity<StockTransaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Product).WithMany().HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.VariantCombination).WithMany().HasForeignKey(e => e.VariantCombinationId).OnDelete(DeleteBehavior.SetNull);
            entity.Property(e => e.Size).HasMaxLength(20);
            entity.Property(e => e.Color).HasMaxLength(50);
        });

        // Purchase Order
        modelBuilder.Entity<PurchaseOrder>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Supplier).WithMany().HasForeignKey(e => e.SupplierId).OnDelete(DeleteBehavior.Restrict);
        });

        // School/College Billing
        modelBuilder.Entity<Class>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.Code }).IsUnique();
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Student>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.StudentId }).IsUnique();
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Class).WithMany(c => c.Students).HasForeignKey(e => e.ClassId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<FeeHead>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.Code }).IsUnique();
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<FeeStructure>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Class).WithMany(c => c.FeeStructures).HasForeignKey(e => e.ClassId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.FeeHead).WithMany().HasForeignKey(e => e.FeeHeadId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FeeInstallment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.FeeStructure).WithMany(fs => fs.Installments).HasForeignKey(e => e.FeeStructureId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Institution>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AcademicYear>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Fee>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.FeeNumber }).IsUnique();
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Student).WithMany(s => s.Fees).HasForeignKey(e => e.StudentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.FeeStructure).WithMany(fs => fs.Fees).HasForeignKey(e => e.FeeStructureId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<FeePayment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.ReceiptNumber }).IsUnique();
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Fee).WithMany(f => f.Payments).HasForeignKey(e => e.FeeId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Student).WithMany(s => s.FeePayments).HasForeignKey(e => e.StudentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.CreatedBy).WithMany().HasForeignKey(e => e.CreatedById).OnDelete(DeleteBehavior.Restrict);
        });

        // Office Billing
        modelBuilder.Entity<OfficeClient>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.ClientCode }).IsUnique();
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.ProjectCode }).IsUnique();
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Client).WithMany(c => c.Projects).HasForeignKey(e => e.ClientId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProjectInvoice>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.InvoiceNumber }).IsUnique();
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Project).WithMany(p => p.Invoices).HasForeignKey(e => e.ProjectId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Client).WithMany().HasForeignKey(e => e.ClientId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.CreatedBy).WithMany().HasForeignKey(e => e.CreatedById).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProjectInvoiceItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.ProjectInvoice).WithMany(i => i.Items).HasForeignKey(e => e.ProjectInvoiceId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProjectExpense>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Project).WithMany(p => p.Expenses).HasForeignKey(e => e.ProjectId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.CreatedBy).WithMany().HasForeignKey(e => e.CreatedById).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ServiceContract>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.ContractNumber }).IsUnique();
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Client).WithMany(c => c.Contracts).HasForeignKey(e => e.ClientId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ContractInvoice>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.InvoiceNumber }).IsUnique();
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Contract).WithMany(c => c.Invoices).HasForeignKey(e => e.ContractId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Client).WithMany().HasForeignKey(e => e.ClientId).OnDelete(DeleteBehavior.Restrict);
        });

        // Advanced Features
        modelBuilder.Entity<InstallmentPlan>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Fee).WithMany().HasForeignKey(e => e.FeeId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Student).WithMany().HasForeignKey(e => e.StudentId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Installment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.InstallmentPlan).WithMany(p => p.Installments).HasForeignKey(e => e.InstallmentPlanId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TimeEntry>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Project).WithMany().HasForeignKey(e => e.ProjectId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.ApprovedBy).WithMany().HasForeignKey(e => e.ApprovedById).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Milestone>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Project).WithMany().HasForeignKey(e => e.ProjectId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Invoice).WithMany().HasForeignKey(e => e.InvoiceId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.CreatedBy).WithMany().HasForeignKey(e => e.CreatedById).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Deliverable>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Milestone).WithMany(m => m.Deliverables).HasForeignKey(e => e.MilestoneId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Document>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.CreatedBy).WithMany().HasForeignKey(e => e.CreatedById).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<FeeConcession>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Student).WithMany().HasForeignKey(e => e.StudentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Fee).WithMany().HasForeignKey(e => e.FeeId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.RequestedBy).WithMany().HasForeignKey(e => e.RequestedById).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.ApprovedBy).WithMany().HasForeignKey(e => e.ApprovedById).OnDelete(DeleteBehavior.Restrict);
        });

        // Medical Billing
        modelBuilder.Entity<Patient>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PatientId }).IsUnique();
            entity.Property(e => e.PatientId).IsRequired().HasMaxLength(50);
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MedicalRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.VisitNumber }).IsUnique();
            entity.Property(e => e.VisitNumber).IsRequired().HasMaxLength(50);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Patient).WithMany(p => p.MedicalRecords).HasForeignKey(e => e.PatientId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Provider).WithMany().HasForeignKey(e => e.ProviderId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Diagnosis>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ICD10Code).IsRequired().HasMaxLength(20);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.MedicalRecord).WithMany(m => m.Diagnoses).HasForeignKey(e => e.MedicalRecordId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Procedure>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CPTCode).IsRequired().HasMaxLength(20);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.MedicalRecord).WithMany(m => m.Procedures).HasForeignKey(e => e.MedicalRecordId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Prescription>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PrescriptionNumber }).IsUnique();
            entity.Property(e => e.PrescriptionNumber).IsRequired().HasMaxLength(50);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.MedicalRecord).WithMany(m => m.Prescriptions).HasForeignKey(e => e.MedicalRecordId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Patient).WithMany().HasForeignKey(e => e.PatientId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Product).WithMany().HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ICD10Code>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).IsRequired().HasMaxLength(20);
        });

        modelBuilder.Entity<CPTCode>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).IsRequired().HasMaxLength(20);
        });

        modelBuilder.Entity<ActivityLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<WalletTransaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Customer).WithMany().HasForeignKey(e => e.CustomerId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.CreatedBy).WithMany().HasForeignKey(e => e.CreatedById).OnDelete(DeleteBehavior.Restrict);
        });

        // Appointment configuration
        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.Property(e => e.AppointmentType).HasMaxLength(50);
            entity.Property(e => e.Specialty).HasMaxLength(100);
            entity.Property(e => e.DoctorName).HasMaxLength(200);
            entity.Property(e => e.Location).HasMaxLength(200);
            entity.Property(e => e.Notes).HasMaxLength(1000);
            entity.Property(e => e.ReasonForVisit).HasMaxLength(500);
            entity.Property(e => e.CancellationReason).HasMaxLength(500);
            
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Customer).WithMany().HasForeignKey(e => e.CustomerId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.Patient).WithMany().HasForeignKey(e => e.PatientId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.Service).WithMany().HasForeignKey(e => e.ServiceId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.AssignedTo).WithMany().HasForeignKey(e => e.AssignedToUserId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.CreatedBy).WithMany().HasForeignKey(e => e.CreatedById).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Invoice).WithMany().HasForeignKey(e => e.InvoiceId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.MedicalRecord).WithMany().HasForeignKey(e => e.MedicalRecordId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.RecurringParent).WithMany(a => a.RecurringChildren).HasForeignKey(e => e.RecurringParentId).OnDelete(DeleteBehavior.Restrict);
        });

        // Table configuration
        modelBuilder.Entity<Table>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.CurrentInvoice).WithMany().HasForeignKey(e => e.CurrentInvoiceId).OnDelete(DeleteBehavior.SetNull);
        });

        // KOT configuration
        modelBuilder.Entity<KOT>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Table).WithMany().HasForeignKey(e => e.TableId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Invoice).WithMany().HasForeignKey(e => e.InvoiceId).OnDelete(DeleteBehavior.SetNull);
        });

        // KOTItem configuration
        modelBuilder.Entity<KOTItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.KOT).WithMany(k => k.Items).HasForeignKey(e => e.KOTId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Product).WithMany().HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        // RMG Features Configuration
        // Product Variant Combination
        modelBuilder.Entity<ProductVariantCombination>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.ProductId, e.Size, e.Color }).IsUnique();
            entity.HasIndex(e => new { e.TenantId, e.Barcode }).IsUnique().HasFilter("[Barcode] IS NOT NULL");
            entity.Property(e => e.Size).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Color).IsRequired().HasMaxLength(50);
            entity.Property(e => e.SKU).HasMaxLength(100);
            entity.Property(e => e.Barcode).HasMaxLength(100);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Product).WithMany(p => p.VariantCombinations).HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        // Size Chart
        modelBuilder.Entity<SizeChart>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SizeValues).IsRequired().HasMaxLength(500);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
        });

        // Sales Return
        modelBuilder.Entity<SalesReturn>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.ReturnNumber }).IsUnique();
            entity.Property(e => e.ReturnNumber).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Reason).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Invoice).WithMany().HasForeignKey(e => e.InvoiceId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.CreditNote).WithMany().HasForeignKey(e => e.CreditNoteId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.CreatedBy).WithMany().HasForeignKey(e => e.CreatedById).OnDelete(DeleteBehavior.Restrict);
        });

        // Sales Return Item
        modelBuilder.Entity<SalesReturnItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ProductName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Size).HasMaxLength(20);
            entity.Property(e => e.Color).HasMaxLength(50);
            entity.Property(e => e.Reason).HasMaxLength(500);
            entity.HasOne(e => e.SalesReturn).WithMany(sr => sr.Items).HasForeignKey(e => e.SalesReturnId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.InvoiceItem).WithMany().HasForeignKey(e => e.InvoiceItemId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Product).WithMany().HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.VariantCombination).WithMany().HasForeignKey(e => e.VariantCombinationId).OnDelete(DeleteBehavior.SetNull);
        });

        // Sales Exchange
        modelBuilder.Entity<SalesExchange>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.ExchangeNumber }).IsUnique();
            entity.Property(e => e.ExchangeNumber).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Reason).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Invoice).WithMany().HasForeignKey(e => e.InvoiceId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.CreatedBy).WithMany().HasForeignKey(e => e.CreatedById).OnDelete(DeleteBehavior.Restrict);
        });

        // Sales Exchange Item
        modelBuilder.Entity<SalesExchangeItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type).IsRequired().HasMaxLength(20); // Original or New
            entity.Property(e => e.ProductName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Size).HasMaxLength(20);
            entity.Property(e => e.Color).HasMaxLength(50);
            entity.HasOne(e => e.SalesExchange).WithMany(se => se.Items).HasForeignKey(e => e.SalesExchangeId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.InvoiceItem).WithMany().HasForeignKey(e => e.InvoiceItemId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.Product).WithMany().HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.VariantCombination).WithMany().HasForeignKey(e => e.VariantCombinationId).OnDelete(DeleteBehavior.SetNull);
        });
    }
}

