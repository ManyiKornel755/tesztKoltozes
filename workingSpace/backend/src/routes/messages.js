const express = require('express');
const Message = require('../models/Message');
const { authenticate, isAdmin } = require('../middlewares/auth');
const { sendNewsletterToRecipients } = require('../services/emailService');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/messages
router.get('/', async (req, res, next) => {
  try {
    const messages = await Message.getAll();
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

// GET /api/messages/:id
router.get('/:id', async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        error: 'Message not found',
        status: 404
      });
    }

    // Get recipients
    const recipients = await Message.getRecipients(req.params.id);
    message.recipients = recipients;

    res.json(message);
  } catch (error) {
    next(error);
  }
});

// POST /api/messages (admin)
router.post('/', isAdmin, async (req, res, next) => {
  try {
    const { subject, body } = req.body;

    if (!subject || !body) {
      return res.status(400).json({
        error: 'Subject and body are required',
        status: 400
      });
    }

    const message = await Message.create({
      subject,
      body,
      created_by_user_id: req.user.id
    });

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

// PUT /api/messages/:id (admin)
router.put('/:id', isAdmin, async (req, res, next) => {
  try {
    const { subject, body, status } = req.body;

    const updatedMessage = await Message.update(req.params.id, {
      subject,
      body,
      status
    });

    res.json(updatedMessage);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/messages/:id (admin)
router.delete('/:id', isAdmin, async (req, res, next) => {
  try {
    await Message.delete(req.params.id);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/messages/:id/recipients (admin) - Add recipients
router.post('/:id/recipients', isAdmin, async (req, res, next) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: 'User IDs array is required',
        status: 400
      });
    }

    const recipients = await Message.addRecipients(req.params.id, userIds);
    res.json(recipients);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/messages/:id/recipients/:userId (admin) - Remove recipient
router.delete('/:id/recipients/:userId', isAdmin, async (req, res, next) => {
  try {
    await Message.removeRecipient(req.params.id, req.params.userId);
    res.json({ message: 'Recipient removed successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/messages/:id/send (admin) - Send message/newsletter
router.post('/:id/send', isAdmin, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        error: 'Message not found',
        status: 404
      });
    }

    if (message.status === 'sent') {
      return res.status(400).json({
        error: 'Message has already been sent',
        status: 400
      });
    }

    // Get recipients
    const recipients = await Message.getRecipients(req.params.id);

    if (recipients.length === 0) {
      return res.status(400).json({
        error: 'No recipients added to this message',
        status: 400
      });
    }

    // Send emails
    await sendNewsletterToRecipients(message.subject, message.body, recipients);

    // Update message status
    await Message.send(req.params.id);

    res.json({
      message: 'Newsletter sent successfully',
      recipients_count: recipients.length
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
