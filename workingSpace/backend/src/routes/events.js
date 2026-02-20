const express = require('express');
const Event = require('../models/Event');
const { authenticate, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/events
router.get('/', async (req, res, next) => {
  try {
    const events = await Event.getAll();
    res.json(events);
  } catch (error) {
    next(error);
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
        status: 404
      });
    }

    // Get participants
    const participants = await Event.getParticipants(req.params.id);
    event.participants = participants;

    res.json(event);
  } catch (error) {
    next(error);
  }
});

// POST /api/events (admin)
router.post('/', isAdmin, async (req, res, next) => {
  try {
    const { title, description, event_date, location, max_participants } = req.body;

    if (!title || !event_date) {
      return res.status(400).json({
        error: 'Title and event date are required',
        status: 400
      });
    }

    const event = await Event.create({
      title,
      description,
      event_date,
      location,
      max_participants,
      created_by: req.user.id
    });

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
});

// PUT /api/events/:id (admin)
router.put('/:id', isAdmin, async (req, res, next) => {
  try {
    const { title, description, event_date, location, max_participants } = req.body;

    const updatedEvent = await Event.update(req.params.id, {
      title,
      description,
      event_date,
      location,
      max_participants
    });

    res.json(updatedEvent);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/events/:id (admin)
router.delete('/:id', isAdmin, async (req, res, next) => {
  try {
    await Event.delete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/events/:id/participants/:userId (admin)
router.post('/:id/participants/:userId', isAdmin, async (req, res, next) => {
  try {
    await Event.addParticipant(req.params.id, req.params.userId);
    res.json({ message: 'Participant added successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/events/:id/participants/:userId (admin)
router.delete('/:id/participants/:userId', isAdmin, async (req, res, next) => {
  try {
    await Event.removeParticipant(req.params.id, req.params.userId);
    res.json({ message: 'Participant removed successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/events/:id/register (user registers themselves)
router.post('/:id/register', async (req, res, next) => {
  try {
    await Event.addParticipant(req.params.id, req.user.id);
    res.json({ message: 'Successfully registered for event' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/events/:id/register (user unregisters themselves)
router.delete('/:id/register', async (req, res, next) => {
  try {
    await Event.removeParticipant(req.params.id, req.user.id);
    res.json({ message: 'Successfully unregistered from event' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
