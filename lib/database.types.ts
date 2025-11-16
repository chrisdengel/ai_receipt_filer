export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          subscription_status: string;
          subscription_tier: string;
          subscription_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          subscription_status?: string;
          subscription_tier?: string;
          subscription_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          subscription_status?: string;
          subscription_tier?: string;
          subscription_expires_at?: string | null;
          updated_at?: string;
        };
      };
      payment_methods: {
        Row: {
          id: string;
          user_id: string;
          method_type: string;
          card_type: string | null;
          last_four: string;
          nickname: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          method_type: string;
          card_type?: string | null;
          last_four: string;
          nickname?: string | null;
          is_default?: boolean;
        };
        Update: {
          nickname?: string | null;
          is_default?: boolean;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_path: string;
          document_type: string;
          status: string;
          vendor_name: string | null;
          amount: number | null;
          currency: string;
          document_date: string | null;
          payment_method_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          file_name: string;
          file_path: string;
          document_type: string;
          status?: string;
          vendor_name?: string | null;
          amount?: number | null;
          currency?: string;
          document_date?: string | null;
          payment_method_id?: string | null;
          notes?: string | null;
        };
        Update: {
          status?: string;
          vendor_name?: string | null;
          amount?: number | null;
          document_date?: string | null;
          payment_method_id?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      documents_ocr_data: {
        Row: {
          id: string;
          document_id: string;
          raw_text: string | null;
          detected_card_last_four: string | null;
          detected_vendor: string | null;
          detected_amount: number | null;
          detected_date: string | null;
          detected_due_date: string | null;
          confidence_score: number | null;
          created_at: string;
        };
      };
      bills: {
        Row: {
          id: string;
          user_id: string;
          document_id: string;
          vendor_name: string;
          amount: number;
          due_date: string;
          paid_at: string | null;
          paid_with_payment_method_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          document_id: string;
          vendor_name: string;
          amount: number;
          due_date: string;
          paid_at?: string | null;
          paid_with_payment_method_id?: string | null;
          notes?: string | null;
        };
        Update: {
          paid_at?: string | null;
          paid_with_payment_method_id?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      receipts: {
        Row: {
          id: string;
          user_id: string;
          document_id: string;
          vendor_name: string;
          amount: number;
          receipt_date: string;
          payment_method_id: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          document_id: string;
          vendor_name: string;
          amount: number;
          receipt_date: string;
          payment_method_id: string;
          notes?: string | null;
        };
        Update: {
          notes?: string | null;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string | null;
          color: string | null;
          created_at: string;
        };
      };
      document_categories: {
        Row: {
          id: string;
          document_id: string;
          category_id: string;
        };
      };
      bank_statements: {
        Row: {
          id: string;
          user_id: string;
          payment_method_id: string;
          statement_date: string;
          file_path: string | null;
          processed: boolean;
          created_at: string;
        };
      };
      reconciliation_matches: {
        Row: {
          id: string;
          user_id: string;
          receipt_id: string;
          bank_statement_id: string;
          match_score: number | null;
          matched_at: string;
        };
      };
    };
  };
};
