export interface OCRResult {
  vendor_name?: string;
  amount?: number;
  date?: string;
  due_date?: string;
  card_last_four?: string;
  is_bill?: boolean;
  raw_text: string;
  confidence_score: number;
}

const CARD_PATTERNS = {
  amex: /AMEX|American Express|(\d{4}[\s-]?\d{6}[\s-]?\d{5})/i,
  visa: /VISA|(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})/i,
  mastercard: /MASTERCARD|MC|(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})/i,
  discover: /DISCOVER|(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})/i,
};

const BILL_KEYWORDS = [
  'bill',
  'invoice',
  'due date',
  'balance due',
  'amount due',
  'account',
  'statement',
  'payment due',
];

const VENDOR_PATTERNS = [
  { name: 'KFB', full: 'Kentucky Farm Bureau' },
  { name: 'Verizon', full: 'Verizon' },
  { name: 'AT&T', full: 'AT&T' },
  { name: 'Duke', full: 'Duke Energy' },
  { name: 'Comcast', full: 'Comcast' },
];

function extractCardInfo(text: string): { cardType?: string; lastFour?: string } {
  for (const [type, pattern] of Object.entries(CARD_PATTERNS)) {
    if (pattern.test(text)) {
      const cardMatch = text.match(/(\d{4})[\s-]?(\d{4})[\s-]?(\d{4})[\s-]?(\d{4})/);
      if (cardMatch) {
        return {
          cardType: type.toUpperCase(),
          lastFour: cardMatch[4],
        };
      }
    }
  }
  return {};
}

function extractVendor(text: string): string | undefined {
  for (const vendor of VENDOR_PATTERNS) {
    if (new RegExp(vendor.full, 'i').test(text)) {
      return vendor.full;
    }
  }

  const lines = text.split('\n');
  if (lines.length > 0) {
    return lines[0].trim().substring(0, 50);
  }

  return undefined;
}

function extractAmount(text: string): number | undefined {
  const amountMatch = text.match(/\$\s*(\d+\.?\d{0,2})/);
  if (amountMatch) {
    return parseFloat(amountMatch[1]);
  }

  const numberMatch = text.match(/(?:total|amount|balance|due)[\s:]*\$?(\d+\.?\d{0,2})/i);
  if (numberMatch) {
    return parseFloat(numberMatch[1]);
  }

  return undefined;
}

function extractDate(text: string): string | undefined {
  const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  if (dateMatch) {
    return new Date(dateMatch[1]).toISOString().split('T')[0];
  }

  const isoDateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoDateMatch) {
    return isoDateMatch[1];
  }

  return undefined;
}

function extractDueDate(text: string): string | undefined {
  const dueDateMatch = text.match(/due[\s:]*(?:date[\s:]*)?(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  if (dueDateMatch) {
    return new Date(dueDateMatch[1]).toISOString().split('T')[0];
  }

  return undefined;
}

function isBill(text: string): boolean {
  const lowerText = text.toLowerCase();
  const matches = BILL_KEYWORDS.filter((keyword) => lowerText.includes(keyword)).length;
  return matches >= 2;
}

export function mockOCRProcessing(rawText: string): OCRResult {
  if (!rawText || rawText.length === 0) {
    return {
      raw_text: '',
      confidence_score: 0,
    };
  }

  const cardInfo = extractCardInfo(rawText);
  const vendor = extractVendor(rawText);
  const amount = extractAmount(rawText);
  const date = extractDate(rawText);
  const dueDate = extractDueDate(rawText);
  const billFlag = isBill(rawText);

  let confidence = 0;
  if (vendor) confidence += 0.2;
  if (amount) confidence += 0.2;
  if (date) confidence += 0.2;
  if (cardInfo.cardType) confidence += 0.2;
  if (billFlag && dueDate) confidence += 0.2;

  return {
    vendor_name: vendor,
    amount,
    date,
    due_date: dueDate,
    card_last_four: cardInfo.lastFour,
    is_bill: billFlag,
    raw_text: rawText,
    confidence_score: Math.min(confidence, 1),
  };
}

export function formatReceiptFileName(vendor: string, amount: number, date: string, cardLast4: string): string {
  const vendorShort = vendor.split(' ')[0].substring(0, 3).toUpperCase();
  const amountCents = Math.round(amount * 100).toString().padStart(4, '0');
  const dateObj = new Date(date);
  const dateStr = [
    String(dateObj.getMonth() + 1).padStart(2, '0'),
    String(dateObj.getDate()).padStart(2, '0'),
    dateObj.getFullYear(),
  ].join('');

  return `${vendorShort}_${amountCents}_${dateStr}`;
}
