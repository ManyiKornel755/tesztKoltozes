const express = require('express');
const Certificate = require('../models/Certificate');
const { authenticate, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/certificates (admin only)
router.get('/', isAdmin, async (req, res, next) => {
  try {
    const certificates = await Certificate.getAll();
    res.json(certificates);
  } catch (error) {
    next(error);
  }
});

// GET /api/certificates/my (current user's certificates)
router.get('/my', async (req, res, next) => {
  try {
    const certificates = await Certificate.getByUserId(req.user.id);
    res.json(certificates);
  } catch (error) {
    next(error);
  }
});

// GET /api/certificates/:id
router.get('/:id', async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        error: 'Certificate not found',
        status: 404
      });
    }

    // Check if user owns the certificate or is admin
    const Role = require('../models/Role');
    const userRoles = await Role.getUserRoles(req.user.id);
    const userIsAdmin = userRoles.some(role => role.name === 'admin');

    if (certificate.user_id !== req.user.id && !userIsAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        status: 403
      });
    }

    res.json(certificate);
  } catch (error) {
    next(error);
  }
});

// POST /api/certificates (admin only)
router.post('/', isAdmin, async (req, res, next) => {
  try {
    const { user_id, title, content, issue_date, valid_until } = req.body;

    if (!user_id || !title || !content || !issue_date) {
      return res.status(400).json({
        error: 'user_id, title, content, and issue_date are required',
        status: 400
      });
    }

    const certificate = await Certificate.create({
      user_id,
      title,
      content,
      issue_date,
      valid_until
    });

    res.status(201).json(certificate);
  } catch (error) {
    next(error);
  }
});

// PUT /api/certificates/:id (admin only)
router.put('/:id', isAdmin, async (req, res, next) => {
  try {
    const { title, content, issue_date, valid_until } = req.body;

    const certificate = await Certificate.update(req.params.id, {
      title,
      content,
      issue_date,
      valid_until
    });

    if (!certificate) {
      return res.status(404).json({
        error: 'Certificate not found',
        status: 404
      });
    }

    res.json(certificate);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/certificates/:id (admin only)
router.delete('/:id', isAdmin, async (req, res, next) => {
  try {
    await Certificate.delete(req.params.id);
    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
