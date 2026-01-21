using BillingAPI.Models;

namespace BillingAPI.Services;

public static class ExpiryService
{
    /// <summary>
    /// Calculates expiry date from manufacturing date and product expiry configuration
    /// </summary>
    public static DateTime? CalculateExpiryDate(DateTime? manufacturingDate, Product product)
    {
        if (!manufacturingDate.HasValue || !product.IsExpiryEnabled)
            return null;

        // If product has fixed expiry date, use it
        if (product.ExpiryType == "FIXED_DATE" && product.ExpiryDate.HasValue)
        {
            return product.ExpiryDate;
        }

        // If product uses duration-based expiry
        if (product.ExpiryType == "DURATION" && product.ExpireAfterValue.HasValue && !string.IsNullOrEmpty(product.ExpireAfterUnit))
        {
            var expiryDate = manufacturingDate.Value;

            switch (product.ExpireAfterUnit.ToUpper())
            {
                case "DAYS":
                    expiryDate = expiryDate.AddDays(product.ExpireAfterValue.Value);
                    break;
                case "MONTHS":
                    expiryDate = expiryDate.AddMonths(product.ExpireAfterValue.Value);
                    break;
                case "YEARS":
                    expiryDate = expiryDate.AddYears(product.ExpireAfterValue.Value);
                    break;
            }

            return expiryDate;
        }

        return null;
    }

    /// <summary>
    /// Calculates alert date based on expiry date and product alert configuration
    /// </summary>
    public static DateTime? CalculateAlertDate(DateTime? expiryDate, Product product)
    {
        if (!expiryDate.HasValue || !product.IsExpiryEnabled || !product.AlertBeforeValue.HasValue)
            return null;

        var alertDate = expiryDate.Value;

        if (string.IsNullOrEmpty(product.AlertBeforeUnit) || product.AlertBeforeUnit.ToUpper() == "DAYS")
        {
            alertDate = alertDate.AddDays(-product.AlertBeforeValue.Value);
        }
        else if (product.AlertBeforeUnit.ToUpper() == "MONTHS")
        {
            alertDate = alertDate.AddMonths(-product.AlertBeforeValue.Value);
        }

        return alertDate;
    }

    /// <summary>
    /// Evaluates batch status based on expiry date and product alert configuration
    /// </summary>
    public static string EvaluateBatchStatus(DateTime? expiryDate, Product product)
    {
        if (!expiryDate.HasValue || !product.IsExpiryEnabled)
            return "ACTIVE";

        var today = DateTime.UtcNow.Date;
        var expiry = expiryDate.Value.Date;

        if (today > expiry)
        {
            return "EXPIRED";
        }

        var alertDate = CalculateAlertDate(expiryDate, product);
        if (alertDate.HasValue && today >= alertDate.Value.Date)
        {
            return "NEAR_EXPIRY";
        }

        return "ACTIVE";
    }

    /// <summary>
    /// Gets days until expiry
    /// </summary>
    public static int? GetDaysUntilExpiry(DateTime? expiryDate)
    {
        if (!expiryDate.HasValue)
            return null;

        var today = DateTime.UtcNow.Date;
        var expiry = expiryDate.Value.Date;
        return (int)(expiry - today).TotalDays;
    }
}

