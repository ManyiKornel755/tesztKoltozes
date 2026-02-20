const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const RaceReport = require('../models/RaceReport');
const PDFGenerator = require('../services/pdfGenerator');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const path = require('path');

// GET /api/race-reports
router.get('/', authenticate, async (req, res, next) => {
  try {
    const reports = await RaceReport.getAll();
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

// GET /api/race-reports/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const report = await RaceReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: { message: 'Race report not found' } });
    }

    const participants = await RaceReport.getParticipants(req.params.id);
    res.json({ ...report, participants });
  } catch (error) {
    next(error);
  }
});

// POST /api/race-reports (admin only)
router.post('/', 
  authenticate, 
  authorize('admin'),
  [
    body('race_name').notEmpty().withMessage('Race name is required'),
    body('race_date').isDate().withMessage('Valid race date is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
      }

      const { race_name, race_date, location, status } = req.body;

      const newReport = await RaceReport.create({
        race_name,
        race_date,
        location,
        status: status || 'draft',
        created_by: req.user.id
      });

      res.status(201).json(newReport);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/race-reports/:id (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { race_name, race_date, location, status } = req.body;

    const updatedReport = await RaceReport.update(req.params.id, {
      race_name,
      race_date,
      location,
      status
    });

    if (!updatedReport) {
      return res.status(404).json({ error: { message: 'Race report not found' } });
    }

    res.json(updatedReport);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/race-reports/:id (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const deleted = await RaceReport.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: { message: 'Race report not found' } });
    }
    res.json({ message: 'Race report deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/race-reports/:id/participants (admin only)
router.post('/:id/participants', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { user_id, name, sail_number, boat_class, position, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: { message: 'Participant name is required' } });
    }

    const result = await RaceReport.addParticipant(req.params.id, {
      user_id,
      name,
      sail_number,
      boat_class,
      position,
      notes
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/race-reports/:id/participants/bulk (admin only)
router.post('/:id/participants/bulk', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { participants } = req.body;

    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ error: { message: 'Participants array is required' } });
    }

    const result = await RaceReport.addParticipantsBulk(req.params.id, participants);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// PUT /api/race-reports/:id/participants/:participantId (admin only)
router.put('/:id/participants/:participantId', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { name, sail_number, boat_class, position, notes } = req.body;

    const updated = await RaceReport.updateParticipant(req.params.participantId, {
      name,
      sail_number,
      boat_class,
      position,
      notes
    });

    if (!updated) {
      return res.status(404).json({ error: { message: 'Participant not found' } });
    }

    res.json({ message: 'Participant updated successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/race-reports/:id/participants/:participantId (admin only)
router.delete('/:id/participants/:participantId', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const deleted = await RaceReport.removeParticipant(req.params.participantId);
    if (!deleted) {
      return res.status(404).json({ error: { message: 'Participant not found' } });
    }
    res.json({ message: 'Participant removed successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/race-reports/:id/export - PDF export
router.get('/:id/export', authenticate, async (req, res, next) => {
  try {
    const report = await RaceReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: { message: 'Race report not found' } });
    }

    const pdfPath = await PDFGenerator.generateRaceReport(req.params.id);
    res.download(pdfPath, `race_report_${report.race_name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
