CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_tenant_id UUID)
RETURNS TABLE (
  total_users BIGINT,
  active_campaigns BIGINT,
  total_rewards BIGINT,
  total_points_awarded BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM "user" WHERE tenant_id = p_tenant_id) AS total_users,
    (SELECT COUNT(*) FROM campaigns WHERE tenant_id = p_tenant_id AND active = true) AS active_campaigns,
    (SELECT COUNT(*) FROM rewards WHERE tenant_id = p_tenant_id) AS total_rewards,
    (SELECT COALESCE(SUM(points), 0) FROM "user" WHERE tenant_id = p_tenant_id) AS total_points_awarded;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;