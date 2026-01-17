using System.Text.RegularExpressions;
using System.Text;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Drawing2D;
using System.Net.Http;
using System.IO;
using Tesseract;
using Tesseract.Interop;

namespace BillingAPI.Services;

public class BillScannerService : IBillScannerService
{
    // For demonstration, we'll use basic text extraction
    // In production, integrate with OCR services like Google Cloud Vision, Tesseract, etc.
    public async Task<RawBillData> ExtractRawBillDataAsync(IFormFile file, int tenantId)
    {
        // Extract raw text from the uploaded file using OCR
        string extractedText;
        double ocrConfidence = 0;

        try
        {
            var extractionResult = await ExtractTextWithConfidenceAsync(file);
            extractedText = extractionResult.Text;
            ocrConfidence = extractionResult.Confidence;
        }
        catch (Exception ex)
        {
            throw new Exception($"Failed to extract text from file: {ex.Message}");
        }

        // Create raw bill data structure
        var rawData = new RawBillData
        {
            RawText = extractedText,
            OcrConfidence = ocrConfidence
        };

        // Split text into lines and clean them
        rawData.TextLines = extractedText
            .Split('\n')
            .Select(l => l.Trim())
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .ToArray();

        // Analyze and categorize lines
        AnalyzeBillStructure(rawData);

        // Detect table headers/column names
        DetectTableHeaders(rawData);

        // Ensure basic fields are detected even if OCR misses them
        EnsureBasicFields(rawData);

        // Generate field mapping suggestions
        GenerateFieldMappings(rawData);

        return rawData;
    }

    public async Task<ScannedBillData> ScanBillAsync(IFormFile file, int tenantId)
    {
        // Extract text from the uploaded file using OCR
        string extractedText;
        try
        {
            extractedText = await ExtractTextFromFileAsync(file);
        }
        catch (Exception ex)
        {
            throw new Exception($"Failed to extract text from file: {ex.Message}");
        }

        // Parse the extracted text to identify bill components
        var scannedData = ParseBillText(extractedText);

        // Validate that we extracted meaningful data
        if (string.IsNullOrEmpty(scannedData.SupplierName) &&
            string.IsNullOrEmpty(scannedData.BillNumber) &&
            (scannedData.Products == null || !scannedData.Products.Any()))
        {
            throw new Exception("Unable to extract bill information from the uploaded file. Please ensure the image is clear and contains readable text.");
        }

        return scannedData;
    }

    private async Task<(string Text, double Confidence)> ExtractTextWithConfidenceAsync(IFormFile file)
    {
        if (file.ContentType.StartsWith("image/"))
        {
            using (var memoryStream = new MemoryStream())
            {
                await file.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                using (var image = Image.FromStream(memoryStream))
                using (var bitmap = new Bitmap(image))
                {
                    try
                    {
                        var tessdataPath = Path.Combine(Directory.GetCurrentDirectory(), "tessdata");

                        if (!Directory.Exists(tessdataPath))
                        {
                            Directory.CreateDirectory(tessdataPath);
                        }

                        var engDataPath = Path.Combine(tessdataPath, "eng.traineddata");
                        if (!File.Exists(engDataPath))
                        {
                            try
                            {
                                DownloadLanguageData(tessdataPath, "eng").Wait();
                            }
                            catch
                            {
                                return ("Tesseract language data not found. Please download eng.traineddata from https://github.com/tesseract-ocr/tessdata and place it in the tessdata directory.", 0);
                            }
                        }

                        var processedBitmap = PreprocessImageForOCR(bitmap);

                        using (var ms = new MemoryStream())
                        {
                            processedBitmap.Save(ms, System.Drawing.Imaging.ImageFormat.Tiff);
                            var imageBytes = ms.ToArray();

                            using (var pix = Pix.LoadTiffFromMemory(imageBytes))
                            using (var engine = new TesseractEngine(tessdataPath, "eng", EngineMode.Default))
                            {
                                engine.SetVariable("tessedit_pageseg_mode", "6");
                                engine.SetVariable("tessedit_ocr_engine_mode", "1");
                                engine.SetVariable("tessedit_char_whitelist", "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz₹Rs.,/-: ");

                                using (var page = engine.Process(pix))
                                {
                                    var text = page.GetText();
                                    var confidence = page.GetMeanConfidence();

                                    return (text?.Trim() ?? string.Empty, confidence);
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        return ($"Image processing failed: {ex.Message}", 0);
                    }
                }
            }
        }
        else if (file.ContentType == "application/pdf")
        {
            return ("PDF processing requires additional PDF-to-image conversion setup. Please upload images instead.", 0);
        }

        return (string.Empty, 0);
    }

    private void AnalyzeBillStructure(RawBillData rawData)
    {
        var lines = rawData.TextLines;

        if (lines.Length == 0) return;

        // Analyze header (usually first 3-5 lines)
        int headerEndIndex = Math.Min(5, lines.Length);
        for (int i = 0; i < headerEndIndex; i++)
        {
            var line = lines[i];
            rawData.Header.Lines.Add(line);

            // Detect potential header fields
            DetectHeaderFields(line, rawData.Header.DetectedFields);
        }
        rawData.Header.RawText = string.Join("\n", rawData.Header.Lines);

        // Analyze potential product lines (look for patterns with numbers)
        for (int i = 0; i < lines.Length; i++)
        {
            var line = lines[i];
            var productLine = new RawProductLine
            {
                LineNumber = i + 1,
                RawText = line,
                Parts = line.Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries)
            };

            // Check if this line looks like a product line
            productLine.IsLikelyProductLine = IsLikelyProductLine(line);
            productLine.Confidence = CalculateProductLineConfidence(line);

            if (productLine.IsLikelyProductLine)
            {
                // Try to extract fields from the product line using column mapping if available
                ExtractProductFields(line, productLine.DetectedFields, rawData.ColumnMapping);
            }

            rawData.ProductLines.Add(productLine);
        }

        // Analyze footer (last few lines, usually totals)
        int footerStartIndex = Math.Max(0, lines.Length - 5);
        for (int i = footerStartIndex; i < lines.Length; i++)
        {
            var line = lines[i];
            rawData.Footer.Lines.Add(line);

            // Detect potential footer fields (totals, taxes, etc.)
            DetectFooterFields(line, rawData.Footer.DetectedFields);
        }
        rawData.Footer.RawText = string.Join("\n", rawData.Footer.Lines);
    }

    private void DetectTableHeaders(RawBillData rawData)
    {
        // Look for lines that might be table headers
        for (int lineIndex = 0; lineIndex < rawData.TextLines.Length; lineIndex++)
        {
            var line = rawData.TextLines[lineIndex];

            // Skip lines that are clearly content (start with numbers, contain prices, etc.)
            if (Regex.IsMatch(line, @"^\d.*\d.*\d") || // Lines with multiple numbers
                Regex.IsMatch(line, @"[\d₹$€£].*[\d₹$€£]") || // Lines with prices/currency
                line.Length > 100) // Very long lines are likely content
            {
                continue;
            }

            // Look for lines with multiple words that could be column headers
            var words = line.Split(new[] { ' ', '\t', '|', ':' }, StringSplitOptions.RemoveEmptyEntries);
            if (words.Length >= 2 && words.Length <= 10) // Reasonable number of columns
            {
                var headerFound = false;
                var columnPositions = new Dictionary<int, string>();

                // Check if any words match common column header patterns
                for (int wordIndex = 0; wordIndex < words.Length; wordIndex++)
                {
                    var word = words[wordIndex];
                    var cleanWord = Regex.Replace(word.Trim(), @"[^\w\s-]", ""); // Remove special chars but keep hyphens
                    var headerType = IdentifyColumnHeader(cleanWord);
                    if (headerType != null)
                    {
                        columnPositions[wordIndex] = headerType;
                        headerFound = true;

                        if (!rawData.Header.DetectedFields.ContainsKey(headerType))
                        {
                            rawData.Header.DetectedFields[headerType] = cleanWord;
                            Console.WriteLine($"Detected table header: '{cleanWord}' -> '{headerType}' at position {wordIndex}");
                        }
                    }
                }

                // If we found headers, store the column mapping and header line index
                if (headerFound && columnPositions.Count > 0)
                {
                    rawData.ColumnMapping = columnPositions;
                    rawData.HeaderLineIndex = lineIndex;
                    Console.WriteLine($"Found table header at line {lineIndex} with {columnPositions.Count} columns");
                    break; // Stop at first header line found
                }
            }

            // Also check for single words that are clear headers
            if (words.Length == 1)
            {
                var cleanWord = Regex.Replace(words[0].Trim(), @"[^\w\s-]", "");
                var headerType = IdentifyColumnHeader(cleanWord);
                if (headerType != null)
                {
                    if (!rawData.Header.DetectedFields.ContainsKey(headerType))
                    {
                        rawData.Header.DetectedFields[headerType] = cleanWord;
                        Console.WriteLine($"Detected single header: '{cleanWord}' -> '{headerType}'");
                    }
                }
            }
        }

        // Additional check: Look for common header patterns in the first few lines
        for (int i = 0; i < Math.Min(10, rawData.TextLines.Length); i++)
        {
            var line = rawData.TextLines[i];
            // Look for patterns like "S.No Item Qty Rate Amount"
            if (Regex.IsMatch(line, @"\b(item|qty|quantity|rate|amount|total|price)\b", RegexOptions.IgnoreCase))
            {
                var words = Regex.Split(line, @"[\s\|:]+");
                for (int wordIndex = 0; wordIndex < words.Length; wordIndex++)
                {
                    var word = words[wordIndex];
                    var cleanWord = Regex.Replace(word.Trim(), @"[^\w\s-]", "");
                    if (!string.IsNullOrEmpty(cleanWord))
                    {
                        var headerType = IdentifyColumnHeader(cleanWord);
                        if (headerType != null)
                        {
                            if (!rawData.Header.DetectedFields.ContainsKey(headerType))
                            {
                                rawData.Header.DetectedFields[headerType] = cleanWord;
                                Console.WriteLine($"Detected header pattern: '{cleanWord}' -> '{headerType}' at position {wordIndex}");

                                // If we haven't set column mapping yet, try to build it
                                if (rawData.ColumnMapping.Count == 0)
                                {
                                    rawData.ColumnMapping[wordIndex] = headerType;
                                    rawData.HeaderLineIndex = i;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private string? IdentifyColumnHeader(string word)
    {
        if (string.IsNullOrWhiteSpace(word)) return null;

        var lowerWord = word.ToLower().Trim();

        // Remove common prefixes/suffixes that might appear in headers
        lowerWord = Regex.Replace(lowerWord, @"^(s\.?no\.?|sl\.?\s*no\.?|serial\s*no\.?)\d*$", "");
        lowerWord = Regex.Replace(lowerWord, @"^\d+\.?\s*", ""); // Remove leading numbers
        lowerWord = lowerWord.Trim();

        if (string.IsNullOrWhiteSpace(lowerWord)) return null;

        // Common product table headers with extensive variations
        switch (lowerWord)
        {
            // Product Name variations
            case "item":
            case "items":
            case "product":
            case "products":
            case "description":
            case "particulars":
            case "particular":
            case "name":
            case "item name":
            case "product name":
            case "desc":
            case "details":
            case "goods":
                return "name";

            // Quantity variations
            case "qty":
            case "quantity":
            case "quant":
            case "qnty":
            case "quant.":
            case "qty.":
            case "no":
            case "nos":
            case "number":
            case "count":
                return "quantity";

            // Unit Price variations
            case "rate":
            case "price":
            case "unitprice":
            case "unit price":
            case "unit-price":
            case "unit_rate":
            case "unit rate":
            case "mrp":
            case "cost":
            case "unit cost":
            case "per unit":
            case "each":
            case "piece":
            case "pc":
                return "unitPrice";

            // Total Price variations
            case "amount":
            case "total":
            case "value":
            case "totalprice":
            case "total price":
            case "total-price":
            case "line total":
            case "subtotal":
            case "net":
            case "gross":
                return "totalPrice";

            // HSN Code variations
            case "hsn":
            case "hsncode":
            case "hsn code":
            case "hsn-code":
            case "hsn_code":
            case "sac":
            case "saccode":
            case "sac code":
            case "tax code":
            case "gst code":
                return "hsnCode";

            // Tax Rate variations
            case "gst":
            case "tax":
            case "vat":
            case "cgst":
            case "sgst":
            case "igst":
            case "taxrate":
            case "tax rate":
            case "gst rate":
            case "vat rate":
                return "taxRate";

            // Discount variations
            case "discount":
            case "disc":
            case "disc.":
            case "discount amount":
            case "disc amount":
            case "reduction":
                return "discount";

            default:
                return null;
        }
    }

    private void DetectHeaderFields(string line, Dictionary<string, string> fields)
    {
        // Supplier/Company name detection
        if (Regex.IsMatch(line, @"(?:LTD|PVT|INC|CORP|LLC|GMBH|CO\.?\s*LTD)", RegexOptions.IgnoreCase) ||
            (line.Length > 10 && line == line.ToUpper() && !Regex.IsMatch(line, @"^\d")))
        {
            fields["supplier"] = line;
        }

        // Bill/Invoice number
        var billMatch = Regex.Match(line, @"(?:(?:Invoice|Bill|Inv)\.?\s*(?:No\.?|Number|#)?\s*[:\-]?\s*)([A-Z0-9\-/]+)", RegexOptions.IgnoreCase);
        if (billMatch.Success)
        {
            fields["billNumber"] = billMatch.Groups[1].Value.Trim();
        }

        // Date detection
        var dateMatch = Regex.Match(line, @"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})");
        if (dateMatch.Success)
        {
            fields["date"] = dateMatch.Groups[1].Value;
        }
    }

    private void DetectFooterFields(string line, Dictionary<string, string> fields)
    {
        // Total amount detection
        var totalMatch = Regex.Match(line, @"(?:Total|Grand Total|Net Amount|Amount)\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*(\d+(?:,\d+)*(?:\.\d+)?)", RegexOptions.IgnoreCase);
        if (totalMatch.Success)
        {
            fields["total"] = totalMatch.Groups[1].Value;
        }

        // GST/Tax detection
        var gstMatch = Regex.Match(line, @"GST\s*(?:@\s*(\d+(?:\.\d+)?)%?)?\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*(\d+(?:,\d+)*(?:\.\d+)?)", RegexOptions.IgnoreCase);
        if (gstMatch.Success)
        {
            fields["gst"] = gstMatch.Groups[2].Value;
        }
    }

    private bool IsLikelyProductLine(string line)
    {
        // More inclusive check for product lines
        // Accept lines that could be products even without explicit price symbols

        var trimmedLine = line.Trim();
        if (string.IsNullOrWhiteSpace(trimmedLine) || trimmedLine.Length < 3) return false;

        // Must have at least some numbers
        var hasNumbers = Regex.IsMatch(trimmedLine, @"\d");
        if (!hasNumbers) return false;

        // Check for various price patterns (more inclusive)
        var hasPricePattern = Regex.IsMatch(trimmedLine, @"(?:₹|Rs\.?|INR|\$|€|£)\s*\d") ||
                             Regex.IsMatch(trimmedLine, @"\d+(?:,\d+)*(?:\.\d+)?") || // Numbers with commas/decimals
                             Regex.IsMatch(trimmedLine, @"\d+\.\d+"); // Decimal numbers

        // Check for structured data (multiple columns)
        var parts = trimmedLine.Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
        var hasMultipleColumns = parts.Length >= 2; // At least 2 columns

        // Check for product-like patterns (words + numbers)
        var hasWordAndNumber = Regex.IsMatch(trimmedLine, @"[a-zA-Z]{2,}.*\d|\d.*[a-zA-Z]{2,}");

        // Accept if it has price patterns OR structured data with words and numbers
        return hasPricePattern || (hasMultipleColumns && hasWordAndNumber);
    }

    private double CalculateProductLineConfidence(string line)
    {
        double confidence = 0;

        // Check for quantity patterns (1, 2, 10, etc.)
        if (Regex.IsMatch(line, @"\b\d+\b")) confidence += 0.3;

        // Check for price patterns
        if (Regex.IsMatch(line, @"(?:₹|Rs\.?|INR|\$)\s*\d+(?:,\d+)*(?:\.\d+)?")) confidence += 0.4;

        // Check for HSN codes (typically 4-8 digits)
        if (Regex.IsMatch(line, @"\b\d{4,8}\b")) confidence += 0.2;

        // Multiple columns suggest structured data
        if (line.Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries).Length >= 4) confidence += 0.1;

        return Math.Min(confidence, 1.0);
    }

    private void ExtractProductFields(string line, Dictionary<string, string> fields, Dictionary<int, string>? columnMapping = null)
    {
        var parts = line.Split(new[] { ' ', '\t', '|', ':' }, StringSplitOptions.RemoveEmptyEntries);

        // If we have column mapping from detected headers, use structured parsing
        if (columnMapping != null && columnMapping.Count > 0)
        {
            // Parse based on column positions
            for (int i = 0; i < parts.Length && i < columnMapping.Count; i++)
            {
                if (columnMapping.TryGetValue(i, out var fieldName))
                {
                    var part = parts[i].Trim();
                    if (!string.IsNullOrEmpty(part))
                    {
                        // Clean the value based on field type
                        var cleanedValue = CleanFieldValue(part, fieldName);
                        if (!string.IsNullOrEmpty(cleanedValue))
                        {
                            fields[fieldName] = cleanedValue;
                            Console.WriteLine($"Mapped column {i} ('{part}') to {fieldName}: '{cleanedValue}'");
                        }
                    }
                }
            }

            // If we still don't have a name field, try to construct it from remaining parts
            if (!fields.ContainsKey("name"))
            {
                var nameParts = new List<string>();
                for (int i = 0; i < parts.Length; i++)
                {
                    if (!columnMapping.ContainsKey(i)) // Parts not mapped to specific columns
                    {
                        var part = parts[i].Trim();
                        if (!string.IsNullOrEmpty(part) &&
                            !Regex.IsMatch(part, @"^\d+$") && // Not just a number
                            !Regex.IsMatch(part, @"(?:₹|Rs\.?|INR|\$)?\s*\d+(?:,\d+)*(?:\.\d+)?")) // Not a price
                        {
                            nameParts.Add(part);
                        }
                    }
                }

                if (nameParts.Count > 0)
                {
                    fields["name"] = string.Join(" ", nameParts);
                }
            }
        }
        else
        {
            // Fallback to pattern-based parsing when no column mapping is available
            // Try to identify different parts of a product line
            for (int i = 0; i < parts.Length; i++)
            {
                var part = parts[i];

                // Quantity (usually small number at beginning)
                if (i < 2 && Regex.IsMatch(part, @"^\d+$") && int.TryParse(part, out int qty) && qty > 0 && qty < 1000)
                {
                    fields["quantity"] = part;
                }

                // Price patterns
                if (Regex.IsMatch(part, @"(?:₹|Rs\.?|INR|\$)?\s*(\d+(?:,\d+)*(?:\.\d+)?)"))
                {
                    var priceMatch = Regex.Match(part, @"(?:₹|Rs\.?|INR|\$)?\s*(\d+(?:,\d+)*(?:\.\d+)?)");
                    if (priceMatch.Success)
                    {
                        if (!fields.ContainsKey("unitPrice"))
                            fields["unitPrice"] = priceMatch.Groups[1].Value;
                        else if (!fields.ContainsKey("totalPrice"))
                            fields["totalPrice"] = priceMatch.Groups[1].Value;
                    }
                }

                // HSN Code (typically 4-8 digits)
                if (Regex.IsMatch(part, @"^\d{4,8}$"))
                {
                    fields["hsnCode"] = part;
                }
            }

            // The remaining text is likely the product name
            var productName = string.Join(" ", parts.Where(p =>
                !fields.ContainsValue(p) &&
                !Regex.IsMatch(p, @"^\d+$") &&
                !Regex.IsMatch(p, @"(?:₹|Rs\.?|INR|\$)?\s*\d+(?:,\d+)*(?:\.\d+)?")));

            if (!string.IsNullOrEmpty(productName))
            {
                fields["name"] = productName.Trim();
            }
        }
    }

    private string CleanFieldValue(string value, string fieldName)
    {
        switch (fieldName.ToLower())
        {
            case "quantity":
                // Extract just the number
                var qtyMatch = Regex.Match(value, @"(\d+(?:\.\d+)?)");
                return qtyMatch.Success ? qtyMatch.Groups[1].Value : value;

            case "unitprice":
            case "totalprice":
                // Extract just the numeric value, remove currency symbols
                var priceMatch = Regex.Match(value, @"(?:₹|Rs\.?|INR|\$)?\s*(\d+(?:,\d+)*(?:\.\d+)?)");
                return priceMatch.Success ? priceMatch.Groups[1].Value.Replace(",", "") : value;

            case "hsncode":
                // Clean HSN code
                return Regex.Replace(value, @"[^\d]", "");

            case "name":
                // Clean product name - remove extra spaces and special chars
                return Regex.Replace(value, @"[^\w\s-]", "").Trim();

            default:
                return value.Trim();
        }
    }

    private void EnsureBasicFields(RawBillData rawData)
    {
        // Ensure we always have some basic fields for mapping, even if OCR doesn't detect them
        var basicFields = new Dictionary<string, string>
        {
            ["supplier"] = "Not detected - map manually",
            ["billNumber"] = "Not detected - map manually",
            ["date"] = "Not detected - map manually",
            ["total"] = "Not detected - map manually"
        };

        foreach (var field in basicFields)
        {
            if (!rawData.Header.DetectedFields.ContainsKey(field.Key))
            {
                rawData.Header.DetectedFields[field.Key] = field.Value;
            }
        }
    }

    private void GenerateFieldMappings(RawBillData rawData)
    {
        // Generate mapping suggestions based on detected fields
        foreach (var field in rawData.Header.DetectedFields)
        {
            rawData.FieldMappings.Add(new MappingSuggestion
            {
                SourceField = field.Key,
                SuggestedTargetField = MapToTargetField(field.Key),
                DetectedValue = field.Value,
                Confidence = field.Value.Contains("Not detected") ? 0.1 : 0.8,
                AlternativeMappings = GetAlternativeMappings(field.Key)
            });
        }

        // Add mappings for high-confidence product lines
        foreach (var productLine in rawData.ProductLines.Where(p => p.Confidence > 0.5))
        {
            foreach (var field in productLine.DetectedFields)
            {
                rawData.FieldMappings.Add(new MappingSuggestion
                {
                    SourceField = $"product_{field.Key}",
                    SuggestedTargetField = MapToTargetField(field.Key),
                    DetectedValue = field.Value,
                    Confidence = productLine.Confidence,
                    AlternativeMappings = GetAlternativeMappings(field.Key)
                });
            }
        }
    }

    private string MapToTargetField(string sourceField)
    {
        var lowerField = sourceField.ToLower().Trim();

        // Direct mappings
        switch (lowerField)
        {
            case "supplier":
            case "vendor":
            case "company":
            case "seller":
                return "supplierName";

            case "billnumber":
            case "bill number":
            case "invoice":
            case "invoice number":
            case "inv no":
            case "bill no":
                return "billNumber";

            case "date":
            case "billdate":
            case "bill date":
            case "invoicedate":
            case "invoice date":
                return "billDate";

            case "name":
            case "item":
            case "items":
            case "product":
            case "products":
            case "description":
            case "particulars":
                return "productName";

            case "quantity":
            case "qty":
            case "quant":
            case "qnty":
                return "quantity";

            case "unitprice":
            case "unit price":
            case "unit-price":
            case "rate":
            case "price":
            case "mrp":
                return "unitPrice";

            case "totalprice":
            case "total price":
            case "total-price":
            case "amount":
            case "total":
            case "value":
                return "totalPrice";

            case "hsncode":
            case "hsn code":
            case "hsn-code":
            case "hsn":
            case "sac":
            case "saccode":
            case "sac code":
                return "hsnCode";

            case "gst":
            case "tax":
            case "vat":
            case "taxrate":
            case "tax rate":
                return "taxRate";

            case "discount":
            case "disc":
                return "discount";

            case "totalamount":
            case "total amount":
            case "grandtotal":
            case "grand total":
            case "netamount":
            case "net amount":
                return "totalAmount";

            default:
                return sourceField;
        }
    }

    private List<string> GetAlternativeMappings(string sourceField)
    {
        var lowerField = sourceField.ToLower().Trim();

        switch (lowerField)
        {
            case "supplier":
                return new List<string> { "vendor", "company", "seller", "suppliername" };

            case "billnumber":
                return new List<string> { "invoiceNumber", "referenceNumber", "docNumber", "billno", "invno" };

            case "date":
                return new List<string> { "invoiceDate", "billDate", "invoicedate", "billdate" };

            case "name":
                return new List<string> { "productName", "itemName", "description", "item", "product", "particulars" };

            case "quantity":
                return new List<string> { "qty", "quant", "qnty", "amount" };

            case "unitprice":
                return new List<string> { "rate", "price", "cost", "unit-price", "unit_price", "mrp" };

            case "totalprice":
                return new List<string> { "amount", "total", "value", "total-price", "total_price" };

            case "hsncode":
                return new List<string> { "hsn", "sac", "taxcode", "hsn-code", "sac-code" };

            case "gst":
            case "tax":
                return new List<string> { "vat", "taxrate", "gst", "tax_rate" };

            case "discount":
                return new List<string> { "disc", "discountamount", "reduction" };

            case "total":
                return new List<string> { "grandTotal", "netAmount", "finalAmount", "totalamount" };

            default:
                return new List<string>();
        }
    }

    private async Task<string> ExtractTextFromFileAsync(IFormFile file)
    {
        try
        {
            if (file.ContentType.StartsWith("image/"))
            {
                // Use Tesseract OCR for image processing
                using (var memoryStream = new MemoryStream())
                {
                    await file.CopyToAsync(memoryStream);
                    memoryStream.Position = 0;

                    using (var image = Image.FromStream(memoryStream))
                    {
                        // Convert to bitmap if needed
                        using (var bitmap = new Bitmap(image))
                        {
                            try
                            {
                                // Initialize Tesseract engine
                                // Use the tessdata directory in the project root
                                var tessdataPath = Path.Combine(Directory.GetCurrentDirectory(), "tessdata");

                                if (!Directory.Exists(tessdataPath))
                                {
                                    Directory.CreateDirectory(tessdataPath);
                                }

                                // Check if language data exists
                                var engDataPath = Path.Combine(tessdataPath, "eng.traineddata");
                                if (!File.Exists(engDataPath))
                                {
                                    // Try to download English language data
                                    try
                                    {
                                        DownloadLanguageData(tessdataPath, "eng").Wait();
                                    }
                                    catch
                                    {
                                        return "Tesseract language data not found. Please download eng.traineddata from https://github.com/tesseract-ocr/tessdata and place it in the tessdata directory.";
                                    }
                                }

                                using (var engine = new TesseractEngine(tessdataPath, "eng", EngineMode.Default))
                                {
                                    // Configure Tesseract for better OCR accuracy
                                    engine.SetVariable("tessedit_pageseg_mode", "6"); // Uniform block of text
                                    engine.SetVariable("tessedit_ocr_engine_mode", "1"); // Neural nets LSTM engine
                                    engine.SetVariable("tessedit_char_whitelist", "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz₹Rs.,/-: ");

                                    // Preprocess image for better OCR
                                    var processedBitmap = PreprocessImageForOCR(bitmap);

                                    // Convert Bitmap to Pix for Tesseract using memory stream
                                    using (var ms = new MemoryStream())
                                    {
                                        // Save as TIFF format which Tesseract prefers
                                        processedBitmap.Save(ms, System.Drawing.Imaging.ImageFormat.Tiff);
                                        var imageBytes = ms.ToArray();

                                        using (var pix = Pix.LoadTiffFromMemory(imageBytes))
                                        {
                                            // Process the image
                                            using (var page = engine.Process(pix))
                                            {
                                                var text = page.GetText();

                                                // Log OCR confidence for debugging
                                                var confidence = page.GetMeanConfidence();
                                                Console.WriteLine($"OCR Confidence: {confidence:P2}");

                                                // If confidence is too low, try alternative processing
                                                if (confidence < 0.3f && text.Length < 50)
                                                {
                                                    // Try with different PSM mode for retry
                                                    engine.SetVariable("tessedit_pageseg_mode", "3"); // Fully automatic page segmentation
                                                    using (var retryPage = engine.Process(pix))
                                                    {
                                                        var retryText = retryPage.GetText();
                                                        if (retryText.Length > text.Length)
                                                        {
                                                            text = retryText;
                                                        }
                                                    }
                                                }

                                                return text?.Trim() ?? string.Empty;
                                            }
                                        }
                                    }
                                }
                            }
                            catch (TesseractException tessEx)
                            {
                                Console.WriteLine($"Tesseract Error: {tessEx.Message}");
                                return $"OCR processing failed: {tessEx.Message}. Please ensure Tesseract language data is properly installed.";
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Image processing error: {ex.Message}");
                                return $"Image processing failed: {ex.Message}. Please try with a clearer image.";
                            }
                        }
                    }
                }
            }
            else if (file.ContentType == "application/pdf")
            {
                // For PDFs, we'd need additional PDF processing
                // For now, return a message indicating PDF support needs additional setup
                return "PDF processing requires additional PDF-to-image conversion setup. Please upload images instead.";
            }
        }
        catch (Exception ex)
        {
            // Log the error and return a user-friendly message
            Console.WriteLine($"OCR Error: {ex.Message}");
            return $"Error processing file: {ex.Message}. Please ensure the image is clear and try again.";
        }

        return string.Empty;
    }


    private ScannedBillData ParseBillText(string text)
    {
        var scannedData = new ScannedBillData();

        // Clean and normalize the text
        text = Regex.Replace(text, @"\s+", " ").Trim();
        var lines = text.Split('\n').Select(l => l.Trim()).Where(l => !string.IsNullOrWhiteSpace(l)).ToArray();

        // Extract supplier name (usually first few lines, look for company-like patterns)
        for (int i = 0; i < Math.Min(5, lines.Length); i++)
        {
            var line = lines[i];
            // Look for company names (typically contain LTD, PVT, INC, etc. or are in ALL CAPS)
            if (Regex.IsMatch(line, @"(?:LTD|PVT|INC|CORP|LLC|GMBH|CO\.?\s* LTD)", RegexOptions.IgnoreCase) ||
                (line.Length > 10 && line == line.ToUpper() && !Regex.IsMatch(line, @"^\d")))
            {
                scannedData.SupplierName = line;
                break;
            }
        }

        // Extract bill number and date with improved patterns
        foreach (var line in lines)
        {
            // Bill/Invoice number patterns
            var billMatch = Regex.Match(line, @"(?:(?:Invoice|Bill|Inv)\.?\s*(?:No\.?|Number|#)?\s*[:\-]?\s*)([A-Z0-9\-/]+)", RegexOptions.IgnoreCase);
            if (billMatch.Success && scannedData.BillNumber == null)
            {
                scannedData.BillNumber = billMatch.Groups[1].Value.Trim();
            }

            // Date patterns
            var dateMatch = Regex.Match(line, @"(?:(?:Date|Dt)\.?\s*[:\-]?\s*)([^\s]+(?:\s+\d{1,2},?\s+\d{4})?)", RegexOptions.IgnoreCase);
            if (dateMatch.Success && scannedData.BillDate == null)
            {
                scannedData.BillDate = dateMatch.Groups[1].Value.Trim();
            }
        }

        // Extract products with improved parsing
        var products = new List<ExtractedProduct>();
        var inProductSection = false;

        foreach (var line in lines)
        {
            // Look for table headers or product indicators
            if (Regex.IsMatch(line, @"(?:Item|Description|Product|Name|Qty|Quantity|Rate|Price|Amount|Rs\.?|₹)", RegexOptions.IgnoreCase))
            {
                inProductSection = true;
                continue;
            }

            if (inProductSection)
            {
                // Try multiple parsing strategies
                var product = ParseProductLineAdvanced(line);
                if (product != null)
                {
                    products.Add(product);
                }

                // Stop when we reach totals or summary sections
                if (Regex.IsMatch(line, @"(?:Subtotal|Total|Grand|GST|Tax|Discount|Net)", RegexOptions.IgnoreCase))
                {
                    break;
                }
            }
        }

        // If no products found with advanced parsing, try simpler approach
        if (products.Count == 0)
        {
            products = ParseProductsSimple(lines);
        }

        scannedData.Products = products;

        // Extract total amount with improved patterns
        foreach (var line in lines.Reverse())
        {
            // Look for various total patterns
            var totalPatterns = new[]
            {
                @"(?:Total|Grand\s+Total|Net\s+Amount)[\s:]+(?:₹|Rs\.?)?[\s]*(\d+(?:,\d+)*(?:\.\d+)?)",
                @"(?:₹|Rs\.?)[\s]*(\d+(?:,\d+)*(?:\.\d+)?)[\s]*(?:Total|Grand|Net)",
                @"Amount[\s:]+(?:₹|Rs\.?)?[\s]*(\d+(?:,\d+)*(?:\.\d+)?)"
            };

            foreach (var pattern in totalPatterns)
            {
                var match = Regex.Match(line, pattern, RegexOptions.IgnoreCase);
                if (match.Success && decimal.TryParse(match.Groups[1].Value.Replace(",", ""), out var total))
                {
                    scannedData.TotalAmount = total;
                    break;
                }
            }

            if (scannedData.TotalAmount.HasValue) break;
        }

        return scannedData;
    }

    private ExtractedProduct? ParseProductLineAdvanced(string line)
    {
        // Clean the line
        line = Regex.Replace(line, @"\s+", " ").Trim();

        // Try multiple patterns for different bill formats

        // Pattern 1: Number, Description, Qty, Rate, Amount
        var pattern1 = @"^\d+\s+(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:,\d+)*(?:\.\d+)?)\s+(\d+(?:,\d+)*(?:\.\d+)?)$";
        var match1 = Regex.Match(line, pattern1);

        if (match1.Success)
        {
            return CreateProductFromMatch(match1.Groups[1].Value.Trim(),
                                         match1.Groups[2].Value,
                                         match1.Groups[3].Value,
                                         match1.Groups[4].Value);
        }

        // Pattern 2: Description, Qty, Rate, Amount (without item number)
        var pattern2 = @"^(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:,\d+)*(?:\.\d+)?)\s+(\d+(?:,\d+)*(?:\.\d+)?)$";
        var match2 = Regex.Match(line, pattern2);

        if (match2.Success)
        {
            return CreateProductFromMatch(match2.Groups[1].Value.Trim(),
                                         match2.Groups[2].Value,
                                         match2.Groups[3].Value,
                                         match2.Groups[4].Value);
        }

        // Pattern 3: Description with ₹/Rs symbols
        var pattern3 = @"^(.+?)\s+(\d+(?:\.\d+)?)\s+(?:₹|Rs\.?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s+(?:₹|Rs\.?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)$";
        var match3 = Regex.Match(line, pattern3);

        if (match3.Success)
        {
            return CreateProductFromMatch(match3.Groups[1].Value.Trim(),
                                         match3.Groups[2].Value,
                                         match3.Groups[3].Value,
                                         match3.Groups[4].Value);
        }

        // Pattern 4: Flexible pattern with keywords
        var pattern4 = @"(.+?)(?:\s+QTY?\s*[:\-]?\s*)?(\d+(?:\.\d+)?)(?:\s+(?:PRICE?|RATE|₹|Rs\.?)\s*[:\-]?\s*(?:₹|Rs\.?)?\s*)?(\d+(?:,\d+)*(?:\.\d+)?)(?:\s+(?:AMOUNT|TOTAL|₹|Rs\.?)\s*[:\-]?\s*(?:₹|Rs\.?)?\s*)?(\d+(?:,\d+)*(?:\.\d+)?)?";
        var match4 = Regex.Match(line, pattern4, RegexOptions.IgnoreCase);

        if (match4.Success && match4.Groups.Count >= 5)
        {
            var description = match4.Groups[1].Value.Trim();
            var qty = match4.Groups[2].Value;
            var rate = match4.Groups[3].Value;
            var amount = match4.Groups[4].Success ? match4.Groups[4].Value : rate; // Use rate as amount if no amount specified

            // Validate that we have reasonable product data
            if (description.Length > 3 && decimal.TryParse(qty, out _) && decimal.TryParse(rate.Replace(",", ""), out _))
            {
                return CreateProductFromMatch(description, qty, rate, amount);
            }
        }

        return null;
    }

    private ExtractedProduct? CreateProductFromMatch(string description, string qtyStr, string rateStr, string amountStr)
    {
        if (decimal.TryParse(qtyStr, out var qty) &&
            decimal.TryParse(rateStr.Replace(",", ""), out var rate) &&
            decimal.TryParse(amountStr.Replace(",", ""), out var amount))
        {
            // Basic validation
            if (qty > 0 && rate > 0 && amount > 0 && description.Length > 2)
            {
                return new ExtractedProduct
                {
                    Name = description,
                    Quantity = qty,
                    UnitPrice = rate,
                    TotalPrice = amount
                };
            }
        }

        return null;
    }

    private List<ExtractedProduct> ParseProductsSimple(string[] lines)
    {
        var products = new List<ExtractedProduct>();

        // Simple approach: look for lines that contain numbers that could be prices/quantities
        foreach (var line in lines)
        {
            // Look for patterns like "Product Name 2 100.00 200.00"
            var numbers = Regex.Matches(line, @"\d+(?:,\d+)*(?:\.\d+)?")
                .Select(m => m.Value)
                .Where(n => decimal.TryParse(n.Replace(",", ""), out _))
                .ToArray();

            if (numbers.Length >= 3) // At least qty, rate, amount
            {
                var textParts = Regex.Split(line, @"\d+(?:,\d+)*(?:\.\d+)").Where(p => !string.IsNullOrWhiteSpace(p)).ToArray();

                if (textParts.Length > 0)
                {
                    var productName = textParts[0].Trim();
                    if (productName.Length > 3)
                    {
                        try
                        {
                            var qty = decimal.Parse(numbers[0]);
                            var rate = decimal.Parse(numbers[1].Replace(",", ""));
                            var amount = numbers.Length > 2 ? decimal.Parse(numbers[2].Replace(",", "")) : rate * qty;

                            if (qty > 0 && rate > 0)
                            {
                                products.Add(new ExtractedProduct
                                {
                                    Name = productName,
                                    Quantity = qty,
                                    UnitPrice = rate,
                                    TotalPrice = amount
                                });
                            }
                        }
                        catch
                        {
                            // Skip invalid lines
                            continue;
                        }
                    }
                }
            }
        }

        return products;
    }

    private Bitmap PreprocessImageForOCR(Bitmap original)
    {
        try
        {
            // Create a copy to avoid modifying the original
            var processed = new Bitmap(original.Width, original.Height);

            using (var graphics = Graphics.FromImage(processed))
            {
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
                graphics.DrawImage(original, 0, 0, original.Width, original.Height);
            }

            // Convert to grayscale for better OCR
            var grayscale = ConvertToGrayscale(processed);

            // Apply slight contrast enhancement
            var contrastEnhanced = EnhanceContrast(grayscale, 1.2f);

            // Clean up
            processed.Dispose();

            return contrastEnhanced;
        }
        catch
        {
            // If preprocessing fails, return a copy of the original
            return new Bitmap(original);
        }
    }

    private Bitmap ConvertToGrayscale(Bitmap original)
    {
        var grayscale = new Bitmap(original.Width, original.Height);

        using (var graphics = Graphics.FromImage(grayscale))
        {
            var colorMatrix = new ColorMatrix(
                new float[][]
                {
                    new float[] {0.299f, 0.299f, 0.299f, 0, 0},
                    new float[] {0.587f, 0.587f, 0.587f, 0, 0},
                    new float[] {0.114f, 0.114f, 0.114f, 0, 0},
                    new float[] {0, 0, 0, 1, 0},
                    new float[] {0, 0, 0, 0, 1}
                });

            var attributes = new ImageAttributes();
            attributes.SetColorMatrix(colorMatrix);

            graphics.DrawImage(original,
                new Rectangle(0, 0, original.Width, original.Height),
                0, 0, original.Width, original.Height,
                GraphicsUnit.Pixel, attributes);
        }

        return grayscale;
    }

    private Bitmap EnhanceContrast(Bitmap original, float contrast)
    {
        var enhanced = new Bitmap(original.Width, original.Height);

        using (var graphics = Graphics.FromImage(enhanced))
        {
            var colorMatrix = new ColorMatrix(
                new float[][]
                {
                    new float[] {contrast, 0, 0, 0, 0},
                    new float[] {0, contrast, 0, 0, 0},
                    new float[] {0, 0, contrast, 0, 0},
                    new float[] {0, 0, 0, 1, 0},
                    new float[] {0, 0, 0, 0, 1}
                });

            var attributes = new ImageAttributes();
            attributes.SetColorMatrix(colorMatrix);

            graphics.DrawImage(original,
                new Rectangle(0, 0, original.Width, original.Height),
                0, 0, original.Width, original.Height,
                GraphicsUnit.Pixel, attributes);
        }

        return enhanced;
    }

    private async Task DownloadLanguageData(string tessdataPath, string language)
    {
        var url = $"https://github.com/tesseract-ocr/tessdata/raw/main/{language}.traineddata";
        var filePath = Path.Combine(tessdataPath, $"{language}.traineddata");

        using (var client = new HttpClient())
        {
            client.Timeout = TimeSpan.FromSeconds(30);
            var response = await client.GetAsync(url);

            if (response.IsSuccessStatusCode)
            {
                var data = await response.Content.ReadAsByteArrayAsync();
                await File.WriteAllBytesAsync(filePath, data);
                Console.WriteLine($"Downloaded {language}.traineddata successfully");
            }
            else
            {
                throw new Exception($"Failed to download language data: {response.StatusCode}");
            }
        }
    }
}
