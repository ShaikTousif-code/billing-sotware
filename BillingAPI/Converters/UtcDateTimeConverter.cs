using System.Text.Json;
using System.Text.Json.Serialization;

namespace BillingAPI.Converters;

/// <summary>
/// JSON converter that ensures DateTime values are serialized as UTC with 'Z' suffix
/// and properly deserialized from UTC strings
/// </summary>
public class UtcDateTimeConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
        {
            var dateString = reader.GetString();
            if (DateTime.TryParse(dateString, out var date))
            {
                // If the date doesn't have timezone info, assume it's UTC
                if (date.Kind == DateTimeKind.Unspecified)
                {
                    return DateTime.SpecifyKind(date, DateTimeKind.Utc);
                }
                // Convert to UTC if it's local
                if (date.Kind == DateTimeKind.Local)
                {
                    return date.ToUniversalTime();
                }
                return date;
            }
        }
        else if (reader.TokenType == JsonTokenType.Null)
        {
            return default;
        }
        
        throw new JsonException($"Unexpected token type: {reader.TokenType}");
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        // Ensure the DateTime is in UTC
        var utcValue = value.Kind == DateTimeKind.Unspecified 
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
            : value.ToUniversalTime();
        
        // Write as ISO 8601 string with 'Z' suffix to indicate UTC
        writer.WriteStringValue(utcValue.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"));
    }
}

/// <summary>
/// JSON converter for nullable DateTime values
/// </summary>
public class UtcDateTimeNullableConverter : JsonConverter<DateTime?>
{
    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return null;
        }
        
        if (reader.TokenType == JsonTokenType.String)
        {
            var dateString = reader.GetString();
            if (string.IsNullOrEmpty(dateString))
            {
                return null;
            }
            
            if (DateTime.TryParse(dateString, out var date))
            {
                // If the date doesn't have timezone info, assume it's UTC
                if (date.Kind == DateTimeKind.Unspecified)
                {
                    return DateTime.SpecifyKind(date, DateTimeKind.Utc);
                }
                // Convert to UTC if it's local
                if (date.Kind == DateTimeKind.Local)
                {
                    return date.ToUniversalTime();
                }
                return date;
            }
        }
        
        throw new JsonException($"Unexpected token type: {reader.TokenType}");
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (value == null)
        {
            writer.WriteNullValue();
            return;
        }
        
        // Ensure the DateTime is in UTC
        var utcValue = value.Value.Kind == DateTimeKind.Unspecified 
            ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc)
            : value.Value.ToUniversalTime();
        
        // Write as ISO 8601 string with 'Z' suffix to indicate UTC
        writer.WriteStringValue(utcValue.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"));
    }
}

