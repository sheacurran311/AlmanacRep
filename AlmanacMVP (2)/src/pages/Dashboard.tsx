import React, { useState, useEffect } from 'react';
import { Grid, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import ErrorSnackbar from '../components/ErrorSnackbar';
import LoadingSpinner from '../components/LoadingSpinner';

interface DashboardStats {
  totalUsers: number;
  activeCampaigns: number;
  totalRewards: number;
  totalPointsAwarded: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { client } = useAuth();

  useEffect(() => {
    fetchDashboardStats();
  }, [client]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        p_tenant_id: client?.tenantId
      });

      if (error) throw error;

      setStats(data);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to fetch dashboard statistics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h5" component="h2">
                {stats?.totalUsers || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Campaigns
              </Typography>
              <Typography variant="h5" component="h2">
                {stats?.activeCampaigns || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Rewards
              </Typography>
              <Typography variant="h5" component="h2">
                {stats?.totalRewards || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Points Awarded
              </Typography>
              <Typography variant="h5" component="h2">
                {stats?.totalPointsAwarded || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <ErrorSnackbar
        open={!!error}
        message={error || ''}
        onClose={() => setError(null)}
      />
    </div>
  );
};

export default Dashboard;