import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Box,
  IconButton,
  Menu,
  MenuItem,
  CardActions
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  LocalFireDepartment as FireIcon
} from '@mui/icons-material';

const TokenCard = ({ token, onEdit, onDelete, onStatusUpdate }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': '#FF9800',
      'Preparing': '#2196F3',
      'Served': '#4CAF50',
      'Cancelled': '#F44336'
    };
    return colors[status] || '#757575';
  };

  return (
    <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 3 }}>
      <CardMedia
        component="img"
        height="140"
        image={token.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'}
        alt={token.itemName}
      />
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            {token.itemName}
          </Typography>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={token.category}
            size="small"
            variant="outlined"
          />
          <Chip
            label={token.status}
            size="small"
            sx={{
              background: getStatusColor(token.status),
              color: 'white',
              fontWeight: 600
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            👤 {token.customerName}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            Qty: {token.quantity}
          </Typography>
        </Box>

        <Typography variant="h6" color="primary" sx={{ fontWeight: 700, textAlign: 'center', my: 1 }}>
          ₹{token.price * token.quantity}
        </Typography>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
          ⏰ {new Date(token.createdAt).toLocaleTimeString()}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        {token.status === 'Pending' && (
          <IconButton
            size="small"
            onClick={() => onStatusUpdate(token._id, 'Preparing')}
            sx={{ color: '#2196F3' }}
          >
            <FireIcon />
          </IconButton>
        )}
        
        {token.status === 'Preparing' && (
          <IconButton
            size="small"
            onClick={() => onStatusUpdate(token._id, 'Served')}
            sx={{ color: '#4CAF50' }}
          >
            <CheckIcon />
          </IconButton>
        )}

        <IconButton
          size="small"
          onClick={() => onEdit(token)}
          sx={{ color: '#1976d2' }}
        >
          <EditIcon />
        </IconButton>
      </CardActions>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { onEdit(token); handleMenuClose(); }}>
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => { onDelete(token._id); handleMenuClose(); }} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Card>
  );
};

<CardMedia
  component="img"
  height="160"
  image={token.image || getFallbackImage(token.category)}
  alt={token.itemName}
  onError={(e) => {
    e.target.src = getFallbackImage(token.category);
  }}
  sx={{
    objectFit: 'cover',
    borderBottom: '3px solid #2E7D32'
  }}
/>
const getFallbackImage = (category) => {
  const fallbackImages = {
    'Breakfast': 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=300&fit=crop',
    'Lunch': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
    'Dinner': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
    'Snacks': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
    'Beverages': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop',
    'Desserts': 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=300&fit=crop'
  };
  return fallbackImages[category] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
};
export default TokenCard;