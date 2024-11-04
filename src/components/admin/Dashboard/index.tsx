import React from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography
} from '@mui/material';
import { ApexOptions } from 'apexcharts';
import ReactApexChart from 'react-apexcharts';
import DashboardCard from '../DashboardCard';
import { useAuth } from '@client/hooks/useAuth';

const Dashboard: React.FC = (): JSX.Element => {
  const { user } = useAuth();

  const chartOptions: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: {
        show: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    grid: {
      strokeDashArray: 0
    }
  };

  const series = [{
    name: 'Points Awarded',
    data: [30, 40, 45, 50, 49, 60, 70, 91]
  }];

  return (
    <Container maxWidth={false}>
      <Box pt={3} pb={8}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.email}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard
              title="Total Users"
              value="1,234"
              icon="users"
              trend="+12%"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard
              title="Active Rewards"
              value="45"
              icon="gift"
              trend="+5%"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard
              title="Points Issued"
              value="123.4K"
              icon="chart"
              trend="+18%"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard
              title="NFTs Minted"
              value="89"
              icon="token"
              trend="+8%"
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Points Distribution
              </Typography>
              <ReactApexChart
                options={chartOptions}
                series={series}
                type="area"
                height={350}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard;
