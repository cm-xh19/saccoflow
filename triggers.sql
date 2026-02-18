
-- Automating Account Balance Updates
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Check if it's a deposit or withdrawal
        IF NEW.type = 'deposit' THEN
            UPDATE accounts 
            SET current_balance = current_balance + NEW.amount
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'withdrawal' THEN
            -- Check sufficiency
            -- Optional: Raise error if insufficient funds (handled in app or constraint)
             UPDATE accounts 
            SET current_balance = current_balance - NEW.amount
            WHERE id = NEW.account_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for Savings Transactions
CREATE TRIGGER trigger_update_balance
AFTER INSERT ON savings_transactions
FOR EACH ROW
EXECUTE FUNCTION update_account_balance();

-- Function to handle Loan Disbursement (Simulated)
-- When a loan is 'disbursed', we might credit the member's savings account or hand cash.
-- This trigger listens to loans status change.
CREATE OR REPLACE FUNCTION handle_loan_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changed to 'disbursed'
    IF NEW.status = 'disbursed' AND OLD.status != 'disbursed' THEN
        -- Logic to credit member account could go here, or just log it.
        -- For MVP, we presume manual disbursement or simple record keeping.
        NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_loan_update
AFTER UPDATE ON loans
FOR EACH ROW
EXECUTE FUNCTION handle_loan_status_change();
