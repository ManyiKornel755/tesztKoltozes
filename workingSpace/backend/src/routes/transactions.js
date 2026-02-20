const express = require('express');
const Transaction = require('../models/Transaction');
const { authenticate, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/transactions
router.get('/', async (req, res, next) => {
  try {
    const filters = {
      user_id: req.query.user_id,
      transaction_type: req.query.transaction_type,
      category: req.query.category,
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const transactions = await Transaction.getAll(filters);
    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

// GET /api/transactions/stats (admin)
router.get('/stats', isAdmin, async (req, res, next) => {
  try {
    const stats = await Transaction.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// GET /api/transactions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
        status: 404
      });
    }

    res.json(transaction);
  } catch (error) {
    next(error);
  }
});

// POST /api/transactions (admin)
router.post('/', isAdmin, async (req, res, next) => {
  try {
    const { user_id, amount, transaction_type, category, description } = req.body;

    if (!user_id || !amount || !transaction_type || !category) {
      return res.status(400).json({
        error: 'User ID, amount, transaction type, and category are required',
        status: 400
      });
    }

    if (!['income', 'expense'].includes(transaction_type)) {
      return res.status(400).json({
        error: 'Transaction type must be "income" or "expense"',
        status: 400
      });
    }

    const transaction = await Transaction.create({
      user_id,
      amount,
      transaction_type,
      category,
      description
    });

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
});

// PUT /api/transactions/:id (admin)
router.put('/:id', isAdmin, async (req, res, next) => {
  try {
    const { user_id, amount, transaction_type, category, description, transaction_date } = req.body;

    if (transaction_type && !['income', 'expense'].includes(transaction_type)) {
      return res.status(400).json({
        error: 'Transaction type must be "income" or "expense"',
        status: 400
      });
    }

    const updatedTransaction = await Transaction.update(req.params.id, {
      user_id,
      amount,
      transaction_type,
      category,
      description,
      transaction_date
    });

    res.json(updatedTransaction);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/transactions/:id (admin)
router.delete('/:id', isAdmin, async (req, res, next) => {
  try {
    await Transaction.delete(req.params.id);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
