const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Document = require('../models/Document');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const path = require('path');
const fs = require('fs');

// GET /api/documents
router.get('/', authenticate, async (req, res, next) => {
  try {
    const documents = await Document.getAll();
    res.json(documents);
  } catch (error) {
    next(error);
  }
});

// GET /api/documents/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: { message: 'Document not found' } });
    }
    res.json(document);
  } catch (error) {
    next(error);
  }
});

// GET /api/documents/:id/download
router.get('/:id/download', authenticate, async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: { message: 'Document not found' } });
    }

    const filePath = path.join(process.cwd(), document.file_path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: { message: 'File not found on server' } });
    }

    res.download(filePath, path.basename(document.file_path));
  } catch (error) {
    next(error);
  }
});

// POST /api/documents (admin only)
router.post('/', 
  authenticate, 
  authorize('admin'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('file_path').notEmpty().withMessage('File path is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
      }

      const { title, description, file_path, category } = req.body;

      const newDocument = await Document.create({
        title,
        description,
        file_path,
        category,
        uploaded_by: req.user.id
      });

      res.status(201).json(newDocument);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/documents/:id (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { title, description, category } = req.body;

    const updatedDocument = await Document.update(req.params.id, {
      title,
      description,
      category
    });

    if (!updatedDocument) {
      return res.status(404).json({ error: { message: 'Document not found' } });
    }

    res.json(updatedDocument);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/documents/:id (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: { message: 'Document not found' } });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), document.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Document.delete(req.params.id);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
