import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OCRResponse {
  ParsedResults?: Array<{
    ParsedText: string;
    TextOverlay?: {
      Lines: Array<{
        LineText: string;
        Words: Array<{
          WordText: string;
        }>;
      }>;
    };
  }>;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string[];
}

interface ExtractedData {
  vendor_name: string;
  amount: number | null;
  due_date: string | null;
  raw_text: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const ocrApiKey = Deno.env.get("OCR_SPACE_API_KEY") || "K87899142388957";

    const formData = new FormData();
    formData.append("base64Image", imageBase64);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "true");
    formData.append("detectOrientation", "true");
    formData.append("scale", "true");
    formData.append("OCREngine", "2");

    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        "apikey": ocrApiKey,
      },
      body: formData,
    });

    const ocrResult: OCRResponse = await ocrResponse.json();

    if (ocrResult.IsErroredOnProcessing || !ocrResult.ParsedResults?.[0]) {
      return new Response(
        JSON.stringify({
          error: "OCR processing failed",
          details: ocrResult.ErrorMessage,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const rawText = ocrResult.ParsedResults[0].ParsedText;

    const extractedData = extractBillInfo(rawText);

    return new Response(
      JSON.stringify({
        success: true,
        data: extractedData,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing OCR:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

function extractBillInfo(text: string): ExtractedData {
  const lines = text.split("\n").map(line => line.trim()).filter(line => line);

  let vendorName = "";
  let amount: number | null = null;
  let dueDate: string | null = null;

  const amountRegex = /\$?\s*(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)\s*(?:USD)?/gi;
  const dateRegex = /(?:due|pay by|payment due).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i;
  const dateRegex2 = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;

  if (lines.length > 0) {
    vendorName = lines[0];
    if (lines.length > 1 && lines[0].length < 5) {
      vendorName = lines[1];
    }
  }

  const amounts: number[] = [];
  for (const line of lines) {
    const matches = line.matchAll(amountRegex);
    for (const match of matches) {
      const numStr = match[1].replace(/,/g, "");
      const num = parseFloat(numStr);
      if (!isNaN(num) && num > 0 && num < 100000) {
        amounts.push(num);
      }
    }
  }

  if (amounts.length > 0) {
    amounts.sort((a, b) => b - a);
    amount = amounts[0];
  }

  for (const line of lines) {
    const match = line.match(dateRegex);
    if (match) {
      dueDate = parseDate(match[1]);
      break;
    }
  }

  if (!dueDate) {
    for (const line of lines) {
      if (line.toLowerCase().includes("due") || line.toLowerCase().includes("pay")) {
        const match = line.match(dateRegex2);
        if (match) {
          dueDate = parseDate(match[1]);
          break;
        }
      }
    }
  }

  return {
    vendor_name: vendorName || "Unknown Vendor",
    amount,
    due_date: dueDate,
    raw_text: text,
  };
}

function parseDate(dateStr: string): string | null {
  try {
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length !== 3) return null;

    let month = parseInt(parts[0]);
    let day = parseInt(parts[1]);
    let year = parseInt(parts[2]);

    if (year < 100) {
      year += 2000;
    }

    if (month > 12) {
      [month, day] = [day, month];
    }

    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return null;

    return date.toISOString().split("T")[0];
  } catch {
    return null;
  }
}
