const express = require('express');
const Role = require('../models/Role');
const { authenticate, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication and admin access
router.use(authenticate);
router.use(isAdmin);

// GET /api/roles (admin)
router.get('/', async (req, res, next) => {
  try {
    const roles = await Role.getAll();
    res.json(roles);
  } catch (error) {
    next(error);
  }
});

// GET /api/roles/:id (admin)
router.get('/:id', async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        error: 'Role not found',
        status: 404
      });
    }

    res.json(role);
  } catch (error) {
    next(error);
  }
});

// POST /api/roles (admin)
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Role name is required',
        status: 400
      });
    }

    const role = await Role.create({ name, description });
    res.status(201).json(role);
  } catch (error) {
    next(error);
  }
});

// PUT /api/roles/:id (admin)
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const updatedRole = await Role.update(req.params.id, {
      name,
      description
    });

    res.json(updatedRole);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/roles/:id (admin)
router.delete('/:id', async (req, res, next) => {
  try {
    await Role.delete(req.params.id);
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/roles/:id/assign/:userId (admin)
router.post('/:id/assign/:userId', async (req, res, next) => {
  try {
    await Role.assignToUser(req.params.userId, req.params.id);
    res.json({ message: 'Role assigned to user successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/roles/:id/assign/:userId (admin)
router.delete('/:id/assign/:userId', async (req, res, next) => {
  try {
    await Role.removeFromUser(req.params.userId, req.params.id);
    res.json({ message: 'Role removed from user successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/roles/user/:userId (admin)
router.get('/user/:userId', async (req, res, next) => {
  try {
    const roles = await Role.getUserRoles(req.params.userId);
    res.json(roles);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
