-- SACCO System Database Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SACCOs Master Table
CREATE TABLE IF NOT EXISTS saccos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Admins
CREATE TABLE IF NOT EXISTS admins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sacco_id uuid REFERENCES saccos(id),
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    role text DEFAULT 'admin',
    created_at timestamptz DEFAULT now()
);

-- Members
CREATE TABLE IF NOT EXISTS members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sacco_id uuid REFERENCES saccos(id),
    name text NOT NULL,
    email text UNIQUE,
    phone text,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now()
);

-- Accounts (Savings/Shares)
CREATE TABLE IF NOT EXISTS accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sacco_id uuid REFERENCES saccos(id),
    member_id uuid REFERENCES members(id),
    type text CHECK (type IN ('savings','shares')),
    current_balance numeric DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Savings Transactions
CREATE TABLE IF NOT EXISTS savings_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sacco_id uuid REFERENCES saccos(id),
    account_id uuid REFERENCES accounts(id),
    member_id uuid REFERENCES members(id),
    type text CHECK (type IN ('deposit','withdrawal')),
    amount numeric NOT NULL,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES admins(id)
);

-- Loans
CREATE TABLE IF NOT EXISTS loans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sacco_id uuid REFERENCES saccos(id),
    member_id uuid REFERENCES members(id),
    amount numeric NOT NULL,
    status text CHECK (status IN ('pending','approved','disbursed','repaid','rejected')) DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    approved_by uuid REFERENCES admins(id)
);

-- Loan Repayments
CREATE TABLE IF NOT EXISTS loan_repayments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id uuid REFERENCES loans(id),
    sacco_id uuid REFERENCES saccos(id),
    member_id uuid REFERENCES members(id),
    amount numeric NOT NULL,
    created_at timestamptz DEFAULT now(),
    processed_by uuid REFERENCES admins(id)
);

-- Withdrawal Requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sacco_id uuid REFERENCES saccos(id),
    member_id uuid REFERENCES members(id),
    amount numeric NOT NULL,
    status text CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    approved_by uuid REFERENCES admins(id)
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sacco_id uuid REFERENCES saccos(id),
    user_id uuid,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id uuid,
    created_at timestamptz DEFAULT now()
);


-- RLS Policies (Multi-Tenant Enforcement)
-- Enable RLS on all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's sacco_id from admins table based on auth.uid()
CREATE OR REPLACE FUNCTION get_auth_sacco_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT sacco_id FROM admins WHERE email = auth.jwt() ->> 'email'
$$;

-- Admins Table Policy
CREATE POLICY "Admins can view their own sacco admins"
ON admins
FOR ALL
USING (sacco_id = get_auth_sacco_id());

-- Members Table Policy
CREATE POLICY "Admins can manage members"
ON members
FOR ALL
USING (sacco_id = get_auth_sacco_id());

CREATE POLICY "Members can view themselves"
ON members
FOR SELECT
USING (email = auth.jwt() ->> 'email');

-- Accounts Table Policy
CREATE POLICY "Admins can manage accounts"
ON accounts
FOR ALL
USING (sacco_id = get_auth_sacco_id());

CREATE POLICY "Members can view own accounts"
ON accounts
FOR SELECT
USING (member_id IN (SELECT id FROM members WHERE email = auth.jwt() ->> 'email'));

-- Transactions Policy
CREATE POLICY "Admins can manage transactions"
ON savings_transactions
FOR ALL
USING (sacco_id = get_auth_sacco_id());

CREATE POLICY "Members can view own transactions"
ON savings_transactions
FOR SELECT
USING (member_id IN (SELECT id FROM members WHERE email = auth.jwt() ->> 'email'));

-- Loans Policy
CREATE POLICY "Admins can manage loans"
ON loans
FOR ALL
USING (sacco_id = get_auth_sacco_id());

CREATE POLICY "Members can view own loans"
ON loans
FOR SELECT
USING (member_id IN (SELECT id FROM members WHERE email = auth.jwt() ->> 'email'));

-- Loan Repayments Policy
CREATE POLICY "Admins can manage repayments"
ON loan_repayments
FOR ALL
USING (sacco_id = get_auth_sacco_id());

CREATE POLICY "Members can view own repayments"
ON loan_repayments
FOR SELECT
USING (member_id IN (SELECT id FROM members WHERE email = auth.jwt() ->> 'email'));

-- Withdrawal Requests
CREATE POLICY "Admins can manage withdrawal requests"
ON withdrawal_requests
FOR ALL
USING (sacco_id = get_auth_sacco_id());

CREATE POLICY "Members can create/view withdrawal requests"
ON withdrawal_requests
FOR ALL
USING (member_id IN (SELECT id FROM members WHERE email = auth.jwt() ->> 'email'));

-- Audit Log Policy
CREATE POLICY "Admins can view audit logs"
ON audit_log
FOR SELECT
USING (sacco_id = get_auth_sacco_id());

-- Enable Realtime
alter publication supabase_realtime add table members;
alter publication supabase_realtime add table loans;
alter publication supabase_realtime add table savings_transactions;

-- FUNCTION FOR SACCO ONBOARDING
-- Secure function to create a Sacco and its first Admin
CREATE OR REPLACE FUNCTION create_new_sacco(
    sacco_name text,
    admin_name text,
    admin_email text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to bypass RLS for creation
AS $$
DECLARE
    new_sacco_id uuid;
    new_admin_id uuid;
BEGIN
    -- Check if admin email already exists
    IF EXISTS (SELECT 1 FROM admins WHERE email = admin_email) THEN
        RAISE EXCEPTION 'Admin email already exists';
    END IF;

    -- Create Sacco
    INSERT INTO saccos (name)
    VALUES (sacco_name)
    RETURNING id INTO new_sacco_id;

    -- Create Admin linked to Sacco
    INSERT INTO admins (sacco_id, name, email, role)
    VALUES (new_sacco_id, admin_name, admin_email, 'admin')
    RETURNING id INTO new_admin_id;

    RETURN new_sacco_id;
END;
$$;
