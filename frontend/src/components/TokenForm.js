import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  MenuItem,
  Box,
  Typography,
  Chip,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const menuItems = [
  { name: 'Masala Dosa', price: 80, category: 'Breakfast', preparationTime: 10 },
  { name: 'Butter Chicken', price: 220, category: 'Lunch', preparationTime: 25 },
  { name: 'Biryani', price: 180, category: 'Lunch', preparationTime: 20 },
  { name: 'Paneer Tikka', price: 160, category: 'Dinner', preparationTime: 15 },
  { name: 'Samosa', price: 40, category: 'Snacks', preparationTime: 8 },
  { name: 'Chai', price: 20, category: 'Beverages', preparationTime: 5 },
  { name: 'Gulab Jamun', price: 60, category: 'Desserts', preparationTime: 3 },
  { name: 'Noodles', price: 120, category: 'Lunch', preparationTime: 12 },
  { name: 'Pizza', price: 200, category: 'Dinner', preparationTime: 18 },
  { name: 'Burger', price: 150, category: 'Snacks', preparationTime: 10 },
  { name: 'Sandwich', price: 90, category: 'Breakfast', preparationTime: 7 },
  { name: 'Salad', price: 110, category: 'Lunch', preparationTime: 5 }
];

const TokenForm = ({ open, token, onCreate, onUpdate, onClose, foodImages }) => {
  const [formData, setFormData] = useState({
    itemName: '',
    price: '',
    category: 'Lunch',
    status: 'Pending',
    customerName: 'Walk-in Customer',
    quantity: 1,
    specialInstructions: '',
    preparationTime: 15
  });

  const [selectedMenuItem, setSelectedMenuItem] = useState(null);

  useEffect(() => {
    if (token) {
      setFormData({
        itemName: token.itemName,
        price: token.price,
        category: token.category,
        status: token.status,
        customerName: token.customerName,
        quantity: token.quantity,
        specialInstructions: token.specialInstructions,
        preparationTime: token.preparationTime
      });
    } else {
      setFormData({
        itemName: '',
        price: '',
        category: 'Lunch',
        status: 'Pending',
        customerName: 'Walk-in Customer',
        quantity: 1,
        specialInstructions: '',
        preparationTime: 15
      });
    }
    setSelectedMenuItem(null);
  }, [token, open]);

  const handleMenuItemSelect = (item) => {
    setSelectedMenuItem(item);
    setFormData(prev => ({
      ...prev,
      itemName: item.name,
      price: item.price,
      category: item.category,
      preparationTime: item.preparationTime
    }));
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const tokenData = {
      ...formData,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      preparationTime: parseInt(formData.preparationTime)
    };

    if (token) {
      onUpdate(token._id, tokenData);
    } else {
      onCreate(tokenData);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {token ? <EditIcon sx={{ mr: 1 }} /> : <AddIcon sx={{ mr: 1 }} />}
          {token ? 'Edit Food Token' : 'Create New Food Token'}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {/* Quick Menu Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            🍽️ Quick Menu Selection
          </Typography>
          <Grid container spacing={1}>
            {menuItems.map((item) => (
              <Grid item xs={6} sm={4} key={item.name}>
                <Chip
                  avatar={<Avatar src={foodImages[item.name]} />}
                  label={`${item.name} - ₹${item.price}`}
                  onClick={() => handleMenuItemSelect(item)}
                  color={selectedMenuItem?.name === item.name ? 'primary' : 'default'}
                  variant={selectedMenuItem?.name === item.name ? 'filled' : 'outlined'}
                  sx={{ mb: 1, width: '100%', justifyContent: 'flex-start' }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Item Name"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price (₹)"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                inputProps={{ step: "0.01", min: "0" }}
                required
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                variant="outlined"
              >
                <MenuItem value="Breakfast">🍳 Breakfast</MenuItem>
                <MenuItem value="Lunch">🍛 Lunch</MenuItem>
                <MenuItem value="Dinner">🍽️ Dinner</MenuItem>
                <MenuItem value="Snacks">🍕 Snacks</MenuItem>
                <MenuItem value="Beverages">☕ Beverages</MenuItem>
                <MenuItem value="Desserts">🍰 Desserts</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                variant="outlined"
              >
                <MenuItem value="Pending">⏳ Pending</MenuItem>
                <MenuItem value="Preparing">👨‍🍳 Preparing</MenuItem>
                <MenuItem value="Served">✅ Served</MenuItem>
                <MenuItem value="Cancelled">❌ Cancelled</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Name"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                inputProps={{ min: "1" }}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Preparation Time (minutes)"
                name="preparationTime"
                type="number"
                value={formData.preparationTime}
                onChange={handleChange}
                inputProps={{ min: "1" }}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Special Instructions"
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleChange}
                variant="outlined"
                placeholder="Any special requests or dietary restrictions..."
              />
            </Grid>

            {/* Summary */}
            {formData.itemName && formData.price && (
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 100%)',
                  borderRadius: 2,
                  border: '1px solid #C8E6C9'
                }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Order Summary
                  </Typography>
                  <Typography variant="body2">
                    <strong>Item:</strong> {formData.itemName}<br/>
                    <strong>Quantity:</strong> {formData.quantity}<br/>
                    <strong>Total Price:</strong> ₹{(formData.price * formData.quantity).toFixed(2)}<br/>
                    <strong>Preparation Time:</strong> ~{formData.preparationTime} minutes
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </form>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" size="large">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          size="large"
          sx={{
            background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)'
            }
          }}
        >
          {token ? 'Update Token' : 'Create Token'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TokenForm;