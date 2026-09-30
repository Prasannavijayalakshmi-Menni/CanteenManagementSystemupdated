const express = require('express');
const router = express.Router();
const Token = require('../models/Token');

// GET all tokens with filtering and sorting
router.get('/', async (req, res) => {
  try {
    const { status, category, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const tokens = await Token.find(filter).sort(sortOptions);
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET token statistics
router.get('/stats', async (req, res) => {
  try {
    const totalTokens = await Token.countDocuments();
    const pendingTokens = await Token.countDocuments({ status: 'Pending' });
    const preparingTokens = await Token.countDocuments({ status: 'Preparing' });
    const servedTokens = await Token.countDocuments({ status: 'Served' });
    const cancelledTokens = await Token.countDocuments({ status: 'Cancelled' });
    
    // Category-wise counts
    const categoryStats = await Token.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalRevenue: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      }
    ]);

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysTokens = await Token.countDocuments({
      createdAt: { $gte: today }
    });
    const todaysRevenue = await Token.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          status: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      }
    ]);

    res.json({
      total: totalTokens,
      pending: pendingTokens,
      preparing: preparingTokens,
      served: servedTokens,
      cancelled: cancelledTokens,
      today: {
        tokens: todaysTokens,
        revenue: todaysRevenue[0]?.total || 0
      },
      categories: categoryStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single token
router.get('/:id', async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }
    res.json(token);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new token
router.post('/', async (req, res) => {
  try {
    const token = new Token(req.body);
    const newToken = await token.save();
    res.status(201).json(newToken);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update token
router.put('/:id', async (req, res) => {
  try {
    const token = await Token.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }

    res.json(token);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PATCH update token status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    let token;

    if (status === 'Served') {
      token = await Token.findById(req.params.id);
      if (token) {
        await token.markAsServed();
      }
    } else {
      token = await Token.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
    }

    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }

    res.json(token);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE token
router.delete('/:id', async (req, res) => {
  try {
    const token = await Token.findByIdAndDelete(req.params.id);
    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }
    res.json({ message: 'Token deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
//end points
