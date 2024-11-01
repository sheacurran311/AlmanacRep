-- Enable Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE merkle_trees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY tenant_isolation ON tenants
  FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM tenant_admins 
    WHERE tenant_id = id
  ));

CREATE POLICY tenant_user_isolation ON users
  FOR ALL
  USING (auth.tenant_id()::text = tenant_id::text);

-- Create required indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_points_tenant ON loyalty_points(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON points_transactions(tenant_id);

-- Set up realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE loyalty_points;
ALTER PUBLICATION supabase_realtime ADD TABLE points_transactions;
