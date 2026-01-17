namespace BillingAPI.Middleware;

public class NoCacheMiddleware
{
    private readonly RequestDelegate _next;

    public NoCacheMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Set no-cache headers for all responses
        context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0";
        context.Response.Headers["Pragma"] = "no-cache";
        context.Response.Headers["Expires"] = "0";
        
        // Remove ETag header if present (prevents 304 responses)
        context.Response.Headers.Remove("ETag");
        context.Response.Headers.Remove("Last-Modified");

        await _next(context);
    }
}

