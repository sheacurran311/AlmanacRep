-- Create role types enum if not exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'tenant_admin', 'manager', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enhanced tenants table with more configuration options
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE,
    settings JSONB DEFAULT '{}',
    max_users INTEGER DEFAULT 10000,
    max_rewards INTEGER DEFAULT 1000,
    features JSONB DEFAULT '{"web3_enabled": false, "nft_enabled": false}',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced users table with web3 and RBAC support
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    email VARCHAR(255),
    password_hash VARCHAR(255),
    role user_role NOT NULL DEFAULT 'user',
    permissions JSONB DEFAULT '{}',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email, tenant_id)
);

-- Create web3_wallets table
CREATE TABLE IF NOT EXISTS web3_wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    tenant_id INTEGER REFERENCES tenants(id),
    wallet_address VARCHAR(255) NOT NULL,
    web3_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wallet_address, tenant_id)
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points INTEGER NOT NULL,
    reward_type VARCHAR(50) DEFAULT 'POINTS',
    category VARCHAR(50),
    target_audience JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create loyalty points table
CREATE TABLE IF NOT EXISTS loyalty_points (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    tenant_id INTEGER REFERENCES tenants(id),
    points INTEGER NOT NULL DEFAULT 0,
    lifetime_points INTEGER NOT NULL DEFAULT 0,
    tier VARCHAR(50) DEFAULT 'bronze',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP,
    points_history JSONB DEFAULT '[]',
    UNIQUE(user_id, tenant_id)
);

-- Create points transactions table
CREATE TABLE IF NOT EXISTS points_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    tenant_id INTEGER REFERENCES tenants(id),
    points INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(255),
    category VARCHAR(50),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Create merkle trees table
CREATE TABLE IF NOT EXISTS merkle_trees (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    max_depth INTEGER NOT NULL,
    max_buffer_size INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tenant settings table
CREATE TABLE IF NOT EXISTS tenant_settings (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    key VARCHAR(255) NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, key)
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(255) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tenant namespaces table
CREATE TABLE IF NOT EXISTS tenant_namespaces (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) UNIQUE,
    schema_name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
DO $$ 
BEGIN
    ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
    ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
    ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE merkle_trees ENABLE ROW LEVEL SECURITY;
    ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

-- Create RLS Policies with proper error handling
DO $$ 
BEGIN
    DROP POLICY IF EXISTS tenant_isolation_policy ON tenants;
    CREATE POLICY tenant_isolation_policy ON tenants
        USING (id::text = current_setting('app.current_tenant_id', true));
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS tenant_user_isolation_policy ON users;
    CREATE POLICY tenant_user_isolation_policy ON users
        USING (tenant_id::text = current_setting('app.current_tenant_id', true));
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS tenant_reward_isolation_policy ON rewards;
    CREATE POLICY tenant_reward_isolation_policy ON rewards
        USING (tenant_id::text = current_setting('app.current_tenant_id', true));
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS tenant_points_isolation_policy ON loyalty_points;
    CREATE POLICY tenant_points_isolation_policy ON loyalty_points
        USING (tenant_id::text = current_setting('app.current_tenant_id', true));
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS tenant_transaction_isolation_policy ON points_transactions;
    CREATE POLICY tenant_transaction_isolation_policy ON points_transactions
        USING (tenant_id::text = current_setting('app.current_tenant_id', true));
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

-- Add indexes with error handling
DO $$ 
BEGIN
    CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_rewards_tenant ON rewards(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(reward_type);
    CREATE INDEX IF NOT EXISTS idx_points_tenant ON loyalty_points(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_points_user ON loyalty_points(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON points_transactions(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_user ON points_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON points_transactions(transaction_type);
EXCEPTION
    WHEN undefined_table OR undefined_column THEN
        NULL;
END $$;
