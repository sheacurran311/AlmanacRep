import { Request, Response } from 'express';
import { supabase } from '../supabaseClient';
import { handleError } from '../utils/errorHandler';

export const getDashboardStats = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;

  try {
    const { data, error } = await supabase.rpc('get_dashboard_stats', {
      p_tenant_id: tenantId
    });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};