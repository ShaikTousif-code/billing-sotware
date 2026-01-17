using System.Collections.Concurrent;
using System.Net;

namespace BillingAPI.Middleware;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitingMiddleware> _logger;
    private readonly ConcurrentDictionary<string, RateLimitInfo> _rateLimitCache = new();
    private readonly int _maxRequests;
    private readonly TimeSpan _timeWindow;

    public RateLimitingMiddleware(RequestDelegate next, ILogger<RateLimitingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
        _maxRequests = 100; // 100 requests per time window
        _timeWindow = TimeSpan.FromMinutes(1); // 1 minute window
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var clientIp = GetClientIp(context);
        var endpoint = context.Request.Path.Value ?? "";

        // Skip rate limiting for health checks and swagger
        if (endpoint.Contains("/swagger") || endpoint.Contains("/health"))
        {
            await _next(context);
            return;
        }

        var key = $"{clientIp}:{endpoint}";
        var rateLimitInfo = _rateLimitCache.GetOrAdd(key, _ => new RateLimitInfo());

        bool rateLimitExceeded;
        int remainingRequests;
        
        lock (rateLimitInfo)
        {
            // Clean up old entries
            if (DateTime.UtcNow - rateLimitInfo.WindowStart > _timeWindow)
            {
                rateLimitInfo.RequestCount = 0;
                rateLimitInfo.WindowStart = DateTime.UtcNow;
            }

            rateLimitInfo.RequestCount++;
            rateLimitExceeded = rateLimitInfo.RequestCount > _maxRequests;
            remainingRequests = _maxRequests - rateLimitInfo.RequestCount;
        }

        if (rateLimitExceeded)
        {
            context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
            context.Response.Headers.Add("X-RateLimit-Limit", _maxRequests.ToString());
            context.Response.Headers.Add("X-RateLimit-Remaining", "0");
            context.Response.Headers.Add("Retry-After", _timeWindow.TotalSeconds.ToString());
            
            await context.Response.WriteAsync("Rate limit exceeded. Please try again later.");
            return;
        }

        context.Response.Headers.Add("X-RateLimit-Limit", _maxRequests.ToString());
        context.Response.Headers.Add("X-RateLimit-Remaining", remainingRequests.ToString());

        await _next(context);
    }

    private string GetClientIp(HttpContext context)
    {
        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private class RateLimitInfo
    {
        public int RequestCount { get; set; }
        public DateTime WindowStart { get; set; } = DateTime.UtcNow;
    }
}

