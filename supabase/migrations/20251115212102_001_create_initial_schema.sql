/*
  # Create Initial Database Schema

  ## Overview
  This migration sets up the complete database schema for the Smart Receipt & Document Manager app.
  
  ## New Tables
  1. `users` - Extended user profiles with subscription data
  2. `payment_methods` - Stores user payment methods (credit cards, bank accounts)
  3. `documents` - Core documents table with metadata
  4. `documents_ocr_data` - OCR extracted text and detected fields
  5. `bills` - Tracks unpaid bills with due dates
  6. `receipts` - Tracks paid bills/receipts with payment details
  7. `categories` - Tax and expense categories
  8. `document_categories` - Junction table for document-category mapping
  9. `bank_statements` - For bank statement reconciliation
  10. `reconciliation_matches` - Matches between receipts and bank statements

  ## Security
  - All tables have RLS enabled
  - Policies restrict users to their own data
  - Service role access for backend operations
*/

-- Create extended users profile
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  subscription_status text DEFAULT 'free',
  subscription_tier text DEFAULT 'free',
  subscription_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method_type text NOT NULL CHECK (method_type IN ('credit_card', 'debit_card', 'bank_account')),
  card_type text,
  last_four text NOT NULL,
  nickname text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, last_four)
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payment methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('receipt', 'bill', 'other')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'filed', 'archived')),
  vendor_name text,
  amount decimal(10, 2),
  currency text DEFAULT 'USD',
  document_date date,
  payment_method_id uuid REFERENCES payment_methods(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own documents"
  ON documents FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id);
CREATE INDEX IF NOT EXISTS documents_document_date_idx ON documents(document_date);
CREATE INDEX IF NOT EXISTS documents_vendor_name_idx ON documents(vendor_name);

-- Create OCR data table
CREATE TABLE IF NOT EXISTS documents_ocr_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  raw_text text,
  detected_card_last_four text,
  detected_vendor text,
  detected_amount decimal(10, 2),
  detected_date date,
  detected_due_date date,
  confidence_score decimal(3, 2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents_ocr_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read OCR data for own documents"
  ON documents_ocr_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = documents_ocr_data.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Create bills table (for unpaid bills)
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  vendor_name text NOT NULL,
  amount decimal(10, 2) NOT NULL,
  due_date date NOT NULL,
  paid_at timestamptz,
  paid_with_payment_method_id uuid REFERENCES payment_methods(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bills"
  ON bills FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS bills_due_date_idx ON bills(due_date);
CREATE INDEX IF NOT EXISTS bills_paid_at_idx ON bills(paid_at);

-- Create receipts table (for paid bills)
CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  vendor_name text NOT NULL,
  amount decimal(10, 2) NOT NULL,
  receipt_date date NOT NULL,
  payment_method_id uuid NOT NULL REFERENCES payment_methods(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own receipts"
  ON receipts FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS receipts_receipt_date_idx ON receipts(receipt_date);
CREATE INDEX IF NOT EXISTS receipts_payment_method_id_idx ON receipts(payment_method_id);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text CHECK (type IN ('expense', 'tax', 'personal')),
  color text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own categories"
  ON categories FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create document categories junction table
CREATE TABLE IF NOT EXISTS document_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE(document_id, category_id)
);

ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage categories for own documents"
  ON document_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_categories.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Create bank statements table
CREATE TABLE IF NOT EXISTS bank_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_method_id uuid NOT NULL REFERENCES payment_methods(id),
  statement_date date NOT NULL,
  file_path text,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, payment_method_id, statement_date)
);

ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bank statements"
  ON bank_statements FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create reconciliation matches table
CREATE TABLE IF NOT EXISTS reconciliation_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receipt_id uuid NOT NULL REFERENCES receipts(id),
  bank_statement_id uuid NOT NULL REFERENCES bank_statements(id),
  match_score decimal(3, 2),
  matched_at timestamptz DEFAULT now(),
  UNIQUE(receipt_id, bank_statement_id)
);

ALTER TABLE reconciliation_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reconciliation matches"
  ON reconciliation_matches FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());