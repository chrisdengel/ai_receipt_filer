import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

export type PaymentMethod = Database['public']['Tables']['payment_methods']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];

const generateFileName = (vendor: string, amount: number, date: string, cardLast4?: string) => {
  const vendorShort = vendor.split(' ')[0].substring(0, 3).toUpperCase();
  const amountStr = Math.round(amount * 100).toString();
  const dateStr = new Date(date).toLocaleDateString('en-US', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '');

  if (cardLast4) {
    return `${vendorShort}_${amountStr}_${dateStr}_${cardLast4}`;
  }
  return `${vendorShort}_${amountStr}_${dateStr}`;
};

export const documentService = {
  async createPaymentMethod(
    userId: string,
    methodType: 'credit_card' | 'debit_card' | 'bank_account',
    cardType: string | null,
    lastFour: string,
    nickname: string | null
  ): Promise<PaymentMethod> {
    const { data, error } = await supabase
      .from('payment_methods')
      .insert([
        {
          user_id: userId,
          method_type: methodType,
          card_type: cardType,
          last_four: lastFour,
          nickname: nickname || `${cardType} ${lastFour}`,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  async createDocument(
    userId: string,
    fileName: string,
    filePath: string,
    documentType: 'receipt' | 'bill' | 'other',
    vendorName?: string,
    amount?: number,
    documentDate?: string,
    paymentMethodId?: string
  ): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .insert([
        {
          user_id: userId,
          file_name: fileName,
          file_path: filePath,
          document_type: documentType,
          status: 'draft',
          vendor_name: vendorName,
          amount: amount ? parseFloat(amount.toString()) : null,
          document_date: documentDate,
          payment_method_id: paymentMethodId,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createReceipt(
    userId: string,
    documentId: string,
    vendorName: string,
    amount: number,
    receiptDate: string,
    paymentMethodId: string,
    notes?: string
  ) {
    const { data, error } = await supabase
      .from('receipts')
      .insert([
        {
          user_id: userId,
          document_id: documentId,
          vendor_name: vendorName,
          amount: parseFloat(amount.toString()),
          receipt_date: receiptDate,
          payment_method_id: paymentMethodId,
          notes: notes || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createBill(
    userId: string,
    documentId: string,
    vendorName: string,
    amount: number,
    dueDate: string,
    notes?: string
  ) {
    const { data, error } = await supabase
      .from('bills')
      .insert([
        {
          user_id: userId,
          document_id: documentId,
          vendor_name: vendorName,
          amount: parseFloat(amount.toString()),
          due_date: dueDate,
          notes: notes || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markBillAsPaid(billId: string, paymentMethodId: string) {
    const { data, error } = await supabase
      .from('bills')
      .update({
        paid_at: new Date().toISOString(),
        paid_with_payment_method_id: paymentMethodId,
      })
      .eq('id', billId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getReceiptsByPaymentMethod(userId: string, paymentMethodId: string) {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('user_id', userId)
      .eq('payment_method_id', paymentMethodId)
      .order('receipt_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getUnpaidBills(userId: string) {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId)
      .is('paid_at', null)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async uploadDocumentFile(userId: string, fileName: string, fileData: Blob) {
    const filePath = `${userId}/${Date.now()}_${fileName}`;

    const { error } = await supabase.storage
      .from('documents')
      .upload(filePath, fileData);

    if (error) throw error;
    return filePath;
  },

  async getDownloadUrl(filePath: string): Promise<string> {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
};
