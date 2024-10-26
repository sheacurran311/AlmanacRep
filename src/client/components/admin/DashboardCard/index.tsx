import React from 'react';
import {
  Box,
  Card,
  Typography,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Person as PersonIcon,
  CardGiftcard as GiftIcon,
  ShowChart as ChartIcon,
  Token as TokenIcon
} from '@mui/icons-material';
import type { DashboardCardProps } from '../types';

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  trend
}) => {
  const theme = useTheme();

  const getIcon = () => {
    switch (icon) {
      case 'users':
        return <PersonIcon />;
      case 'gift':
        return <GiftIcon />;
      case 'chart':
        return <ChartIcon />;
      case 'token':
        return <TokenIcon />;
      default:
        return null;
    }
  };

  const isPositiveTrend = trend.startsWith('+');

  return (
    <Card sx={{ height: '100%', p: 2 }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: theme.palette.primary.light,
            borderRadius: 1,
            p: 1,
            color: theme.palette.primary.main
          }}
        >
          {getIcon()}
        </Box>
      </Box>
      <Box display="flex" alignItems="center" mt={2}>
        {isPositiveTrend ? (
          <TrendingUpIcon color="success" />
        ) : (
          <TrendingDownIcon color="error" />
        )}
        <Typography
          variant="body2"
          sx={{
            color: isPositiveTrend
              ? theme.palette.success.main
              : theme.palette.error.main,
            ml: 1
          }}
        >
          {trend}
        </Typography>
      </Box>
    </Card>
  );
};

export default DashboardCard;
