import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  TablePagination,
  Button,
  Chip
} from '@mui/material';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import ErrorSnackbar from '../components/ErrorSnackbar';
import LoadingSpinner from '../components/LoadingSpinner';

interface Campaign {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  points_reward: number;
  active: boolean;
}

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const { client } = useAuth();

  useEffect(() => {
    fetchCampaigns();
  }, [client, page, rowsPerPage]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      if (!client?.tenantId) {
        throw new Error('Tenant ID is not available');
      }
      const { data, error, count } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact' })
        .eq('tenant_id', client.tenantId)
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCampaigns(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to fetch campaigns. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Campaigns
      </Typography>
      <Button variant="contained" color="primary" style={{ marginBottom: '1rem' }}>
        Create New Campaign
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Points Reward</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell>{campaign.name}</TableCell>
                <TableCell>{campaign.description}</TableCell>
                <TableCell>{new Date(campaign.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(campaign.end_date).toLocaleDateString()}</TableCell>
                <TableCell>{campaign.points_reward}</TableCell>
                <TableCell>
                  <Chip 
                    label={campaign.active ? 'Active' : 'Inactive'} 
                    color={campaign.active ? 'success' : 'default'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <ErrorSnackbar
        open={!!error}
        message={error || ''}
        onClose={() => setError(null)}
      />
    </div>
  );
};

export default Campaigns;