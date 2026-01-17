using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Serilog;

namespace BillingAPI.Middleware;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;
    private readonly IWebHostEnvironment _environment;

    public GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger, IWebHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var code = HttpStatusCode.InternalServerError;
        var result = string.Empty;

        switch (exception)
        {
            case UnauthorizedAccessException:
                code = HttpStatusCode.Unauthorized;
                result = JsonSerializer.Serialize(new { message = "Unauthorized access", error = exception.Message });
                break;
            case ArgumentException:
                code = HttpStatusCode.BadRequest;
                result = JsonSerializer.Serialize(new { message = "Invalid request", error = exception.Message });
                break;
            case KeyNotFoundException:
            case InvalidOperationException:
                code = HttpStatusCode.NotFound;
                result = JsonSerializer.Serialize(new { message = "Resource not found", error = exception.Message });
                break;
            default:
                // Include exception message in development for debugging
                if (_environment.IsDevelopment())
                {
                      result = JsonSerializer.Serialize(new { 
                        message = "An error occurred while processing your request",
                        error = exception.Message,
                        stackTrace = exception.StackTrace,
                        innerException = exception.InnerException?.Message
                    });
                }
                else
                {
                    result = JsonSerializer.Serialize(new { message = "An error occurred while processing your request" });
                }
                break;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)code;
        return context.Response.WriteAsync(result);
    }
}

