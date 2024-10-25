-- Add role column to clients table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'role') THEN
        ALTER TABLE clients
        ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user';
    END IF;
END $$;

-- Create an index on the role column for faster queries if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_clients_role') THEN
        CREATE INDEX idx_clients_role ON clients(role);
    END IF;
END $$;

-- Update existing clients to have 'admin' role (you may want to adjust this based on your needs)
UPDATE clients SET role = 'admin' WHERE id IN (SELECT id FROM clients LIMIT 1);

-- Add a check constraint to ensure only valid roles are inserted if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_valid_role' AND table_name = 'clients') THEN
        ALTER TABLE clients
        ADD CONSTRAINT check_valid_role
        CHECK (role IN ('admin', 'manager', 'user'));
    END IF;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';