export interface ReceiptRecord {
  id: string;
  vendor_name: string;
  amount: number;
  receipt_date: string;
  payment_method: string;
  notes?: string;
}

export interface BillRecord {
  id: string;
  vendor_name: string;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_date?: string;
  notes?: string;
}

export function generateReceiptCSV(receipts: ReceiptRecord[]): string {
  const headers = ['Vendor', 'Amount', 'Date', 'Payment Method', 'Notes'];
  const rows = receipts.map((receipt) => [
    `"${receipt.vendor_name}"`,
    receipt.amount.toFixed(2),
    new Date(receipt.receipt_date).toLocaleDateString(),
    `"${receipt.payment_method}"`,
    `"${receipt.notes || ''}"`,
  ]);

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
  return csvContent;
}

export function generateBillCSV(bills: BillRecord[]): string {
  const headers = ['Vendor', 'Amount', 'Due Date', 'Status', 'Paid Date', 'Notes'];
  const rows = bills.map((bill) => [
    `"${bill.vendor_name}"`,
    bill.amount.toFixed(2),
    new Date(bill.due_date).toLocaleDateString(),
    bill.paid ? 'Paid' : 'Unpaid',
    bill.paid_date ? new Date(bill.paid_date).toLocaleDateString() : '',
    `"${bill.notes || ''}"`,
  ]);

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
  return csvContent;
}

export function generateCombinedExpenseCSV(receipts: ReceiptRecord[], bills: BillRecord[]): string {
  const headers = ['Type', 'Vendor', 'Amount', 'Date', 'Status', 'Payment Method', 'Notes'];

  const receiptRows = receipts.map((receipt) => [
    'Receipt',
    `"${receipt.vendor_name}"`,
    receipt.amount.toFixed(2),
    new Date(receipt.receipt_date).toLocaleDateString(),
    'Paid',
    `"${receipt.payment_method}"`,
    `"${receipt.notes || ''}"`,
  ]);

  const billRows = bills.map((bill) => [
    'Bill',
    `"${bill.vendor_name}"`,
    bill.amount.toFixed(2),
    new Date(bill.due_date).toLocaleDateString(),
    bill.paid ? 'Paid' : 'Unpaid',
    '',
    `"${bill.notes || ''}"`,
  ]);

  const csvContent = [headers, ...receiptRows, ...billRows]
    .map((row) => row.join(','))
    .join('\n');
  return csvContent;
}

export function downloadCSV(filename: string, csvContent: string): void {
  if (typeof window !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function printReceipts(receipts: ReceiptRecord[]): void {
  if (typeof window !== 'undefined') {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      let html = `
        <html>
          <head>
            <title>Receipt Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              h1 { text-align: center; }
            </style>
          </head>
          <body>
            <h1>Receipt Report</h1>
            <table>
              <tr>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Payment Method</th>
                <th>Notes</th>
              </tr>
      `;

      receipts.forEach((receipt) => {
        html += `
          <tr>
            <td>${receipt.vendor_name}</td>
            <td>$${receipt.amount.toFixed(2)}</td>
            <td>${new Date(receipt.receipt_date).toLocaleDateString()}</td>
            <td>${receipt.payment_method}</td>
            <td>${receipt.notes || ''}</td>
          </tr>
        `;
      });

      html += `
            </table>
          </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }
}
