const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Member = require('../models/Member');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const bcrypt = require('bcryptjs');

// GET /api/members
router.get('/', authenticate, async (req, res, next) => {
  try {
    const members = await Member.getAll();
    res.json(members);
  } catch (error) {
    next(error);
  }
});

// GET /api/members/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: { message: 'Member not found' } });
    }
    
    const tags = await Member.getTags(req.params.id);
    res.json({ ...member, tags });
  } catch (error) {
    next(error);
  }
});

// POST /api/members (admin only)
router.post('/', 
  authenticate, 
  authorize('admin'),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
      }

      const { email, password, first_name, last_name, phone } = req.body;

      const password_hash = await bcrypt.hash(password, 10);

      const member = await Member.create({
        email,
        password_hash,
        first_name,
        last_name,
        phone
      });

      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/members/:id (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone } = req.body;
    
    const updatedMember = await Member.update(req.params.id, {
      first_name,
      last_name,
      email,
      phone
    });

    if (!updatedMember) {
      return res.status(404).json({ error: { message: 'Member not found' } });
    }

    res.json(updatedMember);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/members/:id (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const deleted = await Member.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: { message: 'Member not found' } });
    }
    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/members/:id/tags/:tagId (admin only)
router.post('/:id/tags/:tagId', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await Member.addTag(req.params.id, req.params.tagId);
    res.json({ message: 'Tag added successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/members/:id/tags/:tagId (admin only)
router.delete('/:id/tags/:tagId', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await Member.removeTag(req.params.id, req.params.tagId);
    res.json({ message: 'Tag removed successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
