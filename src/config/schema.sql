-- Enable Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE merkle_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create role types enum
CREATE TYPE user_role AS ENUM ('super_admin', 'tenant_admin', 'manager', 'user');

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
    wallet_address VARCHAR(255),
    role user_role NOT NULL DEFAULT 'user',
    permissions JSONB DEFAULT '{}',
    last_login TIMESTAMP,
    web3_metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email, tenant_id),
    UNIQUE(wallet_address, tenant_id)
);

-- Create RBAC tables
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS role_assignments (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    user_id INTEGER REFERENCES users(id),
    role_id INTEGER REFERENCES roles(id),
    assigned_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, user_id, role_id)
);

-- Enhanced rewards table with categories and targeting
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

-- Enhanced loyalty_points table with expiry and tiers
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

-- Enhanced points_transactions table with more metadata
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

-- Create tenant namespaces table
CREATE TABLE IF NOT EXISTS tenant_namespaces (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) UNIQUE,
    schema_name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create RLS Policies

-- Tenant access policy
CREATE POLICY tenant_isolation_policy ON tenants
    USING (id = current_setting('app.current_tenant_id')::INTEGER);

-- User access policy
CREATE POLICY tenant_user_isolation_policy ON users
    USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- Rewards access policy
CREATE POLICY tenant_reward_isolation_policy ON rewards
    USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- Points access policy
CREATE POLICY tenant_points_isolation_policy ON loyalty_points
    USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- Transactions access policy
CREATE POLICY tenant_transaction_isolation_policy ON points_transactions
    USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- Create functions for tenant isolation
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id INTEGER)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Create function to create tenant schema
CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_id INTEGER)
RETURNS VOID AS $$
DECLARE
    schema_name TEXT;
BEGIN
    schema_name := 'tenant_' || tenant_id;
    EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || schema_name;
    INSERT INTO tenant_namespaces (tenant_id, schema_name) 
    VALUES (tenant_id, schema_name)
    ON CONFLICT (tenant_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_rewards_tenant ON rewards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_points_tenant ON loyalty_points(tenant_id);
CREATE INDEX IF NOT EXISTS idx_points_user ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON points_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON points_transactions(transaction_type);
