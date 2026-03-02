const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const User = require('../models/User');
const EmailService = require('../services/emailService');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// GET /api/trainings
router.get('/', authenticate, async (req, res, next) => {
  try {
    const trainings = await Event.getAll();
    const trainingEvents = trainings.filter(e => e.event_type === 'training');
    res.json(trainingEvents);
  } catch (error) {
    next(error);
  }
});

// GET /api/trainings/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const training = await Event.findById(req.params.id);
    if (!training || training.event_type !== 'training') {
      return res.status(404).json({ error: { message: 'Training not found' } });
    }
    
    const participants = await Event.getParticipants(req.params.id);
    res.json({ ...training, participants });
  } catch (error) {
    next(error);
  }
});

// POST /api/trainings (admin vagy coach) - KRITIKUS: értesítés küldés!
router.post('/',
  authenticate,
  authorize('admin', 'coach'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('event_date').isISO8601().withMessage('Valid date is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
      }

      const { title, description, event_date, location, target_group_id } = req.body;

      const newTraining = await Event.create({
        title,
        description,
        event_date,
        location,
        target_group_id: target_group_id || null,
        event_type: 'training',
        created_by: req.user.id
      });

      // KRITIKUS: User.getAllWithRoles() használata!
      const users = await User.getAllWithRoles();
      
      // Csak a nem-admin userek kapjanak emailt
      const regularUsers = users.filter(u => 
        u.roles && !u.roles.includes('admin')
      );

      if (regularUsers.length > 0) {
        const recipients = regularUsers.map(u => u.email);
        
        await EmailService.sendBulkEmail(
          recipients,
          `Új edzés: ${title}`,
          `Új edzés lett meghirdetve!\n\nCím: ${title}\nIdőpont: ${new Date(event_date).toLocaleString()}\nHelyszín: ${location || 'Nincs megadva'}\n\nLeírás: ${description || 'Nincs leírás'}`
        );
      }

      res.status(201).json(newTraining);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/trainings/:id (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { title, description, event_date, location } = req.body;

    const updatedTraining = await Event.update(req.params.id, {
      title,
      description,
      event_date,
      location
    });

    if (!updatedTraining) {
      return res.status(404).json({ error: { message: 'Training not found' } });
    }

    res.json(updatedTraining);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/trainings/:id (admin vagy coach)
router.delete('/:id', authenticate, authorize('admin', 'coach'), async (req, res, next) => {
  try {
    const deleted = await Event.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: { message: 'Training not found' } });
    }
    res.json({ message: 'Training deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
