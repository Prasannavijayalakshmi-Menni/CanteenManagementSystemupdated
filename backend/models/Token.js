const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts']
  },
  status: {
    type: String,
    enum: ['Pending', 'Preparing', 'Served', 'Cancelled'],
    default: 'Pending'
  },
  image: {
    type: String,
    default: ''
  },
  customerName: {
    type: String,
    default: 'Walk-in Customer'
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  specialInstructions: {
    type: String,
    default: ''
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  servedAt: {
    type: Date
  }
});

// Index for better query performance
tokenSchema.index({ status: 1, createdAt: -1 });
tokenSchema.index({ category: 1 });

// Method to mark token as served
tokenSchema.methods.markAsServed = function() {
  this.status = 'Served';
  this.servedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Token', tokenSchema);
//  defines scheme for the token status