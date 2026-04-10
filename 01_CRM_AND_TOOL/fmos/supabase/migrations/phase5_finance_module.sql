-- Phase 5: Finance Module
-- Invoices, Invoice Line Items, and Expenses

-- 1. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL, -- FM-2026-001
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'overdue', 'cancelled')),
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  gst_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  paid_at TIMESTAMPTZ,
  paid_amount NUMERIC(15,2) DEFAULT 0,
  notes TEXT,
  pdf_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Invoice Line Items Table
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL CHECK (category IN ('Ad Spend', 'Subscription', 'Stipend/Salary', 'Office', 'Tools & Software', 'Misc')),
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL, -- for attributing ad spend to a client
  is_recurring BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS Policies

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins have full access to invoices" 
  ON invoices FOR ALL 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins have full access to invoice_line_items" 
  ON invoice_line_items FOR ALL 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins have full access to expenses" 
  ON expenses FOR ALL 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Clients can view their own invoices
CREATE POLICY "Clients can view their own invoices" 
  ON invoices FOR SELECT 
  TO authenticated 
  USING (client_id IN (SELECT id FROM clients WHERE created_by = auth.uid() OR id IN (SELECT client_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Clients can view their own line items" 
  ON invoice_line_items FOR SELECT 
  TO authenticated 
  USING (invoice_id IN (SELECT id FROM invoices WHERE client_id IN (SELECT id FROM clients WHERE created_by = auth.uid() OR id IN (SELECT client_id FROM profiles WHERE id = auth.uid()))));

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Note: Overdue marking is handled via a Server Action instead of a cron, per user clarification.
