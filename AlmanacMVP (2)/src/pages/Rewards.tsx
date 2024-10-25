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
  Button
} from '@mui/material';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import ErrorSnackbar from '../components/ErrorSnackbar';
import LoadingSpinner from '../components/LoadingSpinner';

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  quantity: number;
}

const Rewards: React.FC = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const { client } = useAuth();

  useEffect(() => {
    // Fetch rewards when client changes, or when pagination changes.
    if (client?.tenantId) {
      fetchRewards();
    } else {
      setLoading(false);
    }
  }, [client, page, rowsPerPage]);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!client?.tenantId) {
        throw new Error('Tenant ID is not available');
      }

      const { data, error, count } = await supabase
        .from('rewards')
        .select('*', { count: 'exact' })
        .eq('tenant_id', client.tenantId)
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1)
        .order('created_at', { ascending: false });

      if (error) {
        throw error; // Trigger catch block for error handling.
      }

      if (data) {
        setRewards(data);
        setTotalCount(count ?? 0);
      } else {
        setRewards([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      console.error('Error fetching rewards:', err);
      setError(err.message || 'Failed to fetch rewards. Please try again later.');
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
        Rewards
      </Typography>
      <Button variant="contained" color="primary" style={{ marginBottom: '1rem' }}>
        Create New Reward
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
 
