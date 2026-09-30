import React from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  AccessTime as PendingIcon,
  LocalFireDepartment as PreparingIcon,
  CheckCircle as ServedIcon,
  TrendingUp as RevenueIcon
} from '@mui/icons-material';

const StatCard = ({ icon, title, value, color, subtitle }) => {
  return (
    <Card sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ p: 1, borderRadius: 2, background: `${color}20`, color: color, mr: 2 }}>
          {icon}
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: color }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </Card>
  );
};

const StatsBar = ({ stats, loading }) => {
  if (loading) {
    return (
      <Box sx={{ mb: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  const {
    total = 0,
    pending = 0,
    preparing = 0,
    served = 0,
    today = { tokens: 0, revenue: 0 }
  } = stats;

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            icon={<RestaurantIcon />}
            title="Total Tokens"
            value={total}
            color="#2E7D32"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            icon={<PendingIcon />}
            title="Pending"
            value={pending}
            color="#FF9800"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            icon={<PreparingIcon />}
            title="Preparing"
            value={preparing}
            color="#2196F3"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            icon={<ServedIcon />}
            title="Served"
            value={served}
            color="#4CAF50"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            icon={<RevenueIcon />}
            title="Today's Revenue"
            value={`₹${today.revenue}`}
            color="#9C27B0"
            subtitle={`${today.tokens} orders`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            icon={<TrendingUp />}
            title="Efficiency"
            value={`${total > 0 ? Math.round((served / total) * 100) : 0}%`}
            color="#00BCD4"
            subtitle="Completion Rate"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default StatsBar;