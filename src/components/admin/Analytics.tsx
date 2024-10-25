import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/lab';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface AnalyticsData {
  userMetrics: {
    total_users: number;
    active_users: number;
    new_users: number;
    avg_user_lifetime_days: number;
  };
  rewardsAnalytics: Array<{
    category: string;
    total_rewards: number;
    active_rewards: number;
    avg_points_cost: number;
  }>;
  pointsAnalytics: Array<{
    date: string;
    transaction_type: string;
    transaction_count: number;
    total_points: number;
    avg_points_per_transaction: number;
  }>;
  nftAnalytics: Array<{
    date: string;
    total_minted: number;
    unique_minters: number;
    avg_mints_per_user: number;
  }>;
}

const Analytics: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [startDate, endDate]);

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/analytics/dashboard?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeframeChange = (event: any) => {
    const value = event.target.value;
    setTimeframe(value);
    
    const end = new Date();
    let start = new Date();
    
    switch (value) {
      case '7d':
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
    }
    
    setStartDate(start);
    setEndDate(end);
  };

  if (loading || !analyticsData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const userMetricsChart: ApexOptions = {
    chart: {
      type: 'bar',
      stacked: true
    },
    plotOptions: {
      bar: {
        horizontal: false
      }
    },
    series: [
      {
        name: 'Active Users',
        data: [analyticsData.userMetrics.active_users]
      },
      {
        name: 'New Users',
        data: [analyticsData.userMetrics.new_users]
      }
    ],
    xaxis: {
      categories: ['Users']
    }
  };

  const pointsChart: ApexOptions = {
    chart: {
      type: 'line'
    },
    series: [{
      name: 'Points Transactions',
      data: analyticsData.pointsAnalytics.map(item => ({
        x: new Date(item.date).getTime(),
        y: item.total_points
      }))
    }],
    xaxis: {
      type: 'datetime'
    }
  };

  return (
    <Container maxWidth={false}>
      <Box pt={3} pb={8}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Analytics Dashboard</Typography>
          <FormControl variant="outlined" style={{ minWidth: 120 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              onChange={handleTimeframeChange}
              label="Timeframe"
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={3}>
          {/* User Metrics */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                User Metrics
              </Typography>
              <ReactApexChart
                options={userMetricsChart}
                series={userMetricsChart.series}
                type="bar"
                height={350}
              />
            </Paper>
          </Grid>

          {/* Points Analytics */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Points Distribution
              </Typography>
              <ReactApexChart
                options={pointsChart}
                series={pointsChart.series}
                type="line"
                height={350}
              />
            </Paper>
          </Grid>

          {/* Rewards Analytics */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Rewards Analytics
              </Typography>
              <Grid container spacing={2}>
                {analyticsData.rewardsAnalytics.map((reward) => (
                  <Grid item xs={12} sm={6} md={3} key={reward.category}>
                    <Box p={2} border={1} borderColor="divider" borderRadius={1}>
                      <Typography variant="subtitle1">{reward.category}</Typography>
                      <Typography variant="h6">{reward.total_rewards} Total</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {reward.active_rewards} Active
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Analytics;
