const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const PDFDocument = require('pdfkit');
const UserDocument = require('../models/UserDocument');
const User = require('../models/User');
const { authenticate, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// POST /api/user-documents/preview/:userId (admin)
router.post('/preview/:userId', isAdmin, async (req, res, next) => {
  try {
    const { document_type } = req.body;

    if (!document_type) {
      return res.status(400).json({
        error: 'Document type is required',
        status: 400
      });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 404
      });
    }

    // Generate preview without saving
    const previewData = {
      document_type,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        membership_status: user.membership_status
      },
      generated_at: new Date().toISOString(),
      // KRITIKUS: req.user.id használata, NEM req.user.userId!
      generated_by: req.user.id
    };

    res.json(previewData);
  } catch (error) {
    next(error);
  }
});

// POST /api/user-documents/generate/:userId (admin)
router.post('/generate/:userId', isAdmin, async (req, res, next) => {
  try {
    const { document_type } = req.body;

    if (!document_type) {
      return res.status(400).json({
        error: 'Document type is required',
        status: 400
      });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 404
      });
    }

    // Create documents directory if it doesn't exist
    const documentsDir = path.join(__dirname, '../../documents');
    await fs.mkdir(documentsDir, { recursive: true });

    // Generate filename
    const filename = `${document_type}_${user.id}_${Date.now()}.pdf`;
    const filePath = path.join(documentsDir, filename);

    // Generate PDF
    await generatePDF(filePath, user, document_type);

    // Save to database
    // KRITIKUS: req.user.id használata, NEM req.user.userId!
    const document = await UserDocument.create({
      user_id: user.id,
      document_type,
      file_path: filePath,
      generated_by: req.user.id
    });

    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
});

// GET /api/user-documents/:userId (admin)
router.get('/:userId', isAdmin, async (req, res, next) => {
  try {
    const documents = await UserDocument.getByUserId(req.params.userId);
    res.json(documents);
  } catch (error) {
    next(error);
  }
});

// GET /api/user-documents/:id/download
router.get('/:id/download', async (req, res, next) => {
  try {
    const document = await UserDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        error: 'Document not found',
        status: 404
      });
    }

    // KRITIKUS: req.user.id használata, NEM req.user.userId!
    // Check if user owns the document or is admin
    const user = await User.findById(req.user.id);
    const Role = require('../models/Role');
    const userRoles = await Role.getUserRoles(req.user.id);
    const isAdmin = userRoles.some(role => role.name === 'admin');

    if (document.user_id !== req.user.id && !isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        status: 403
      });
    }

    // Check if file exists
    try {
      await fs.access(document.file_path);
    } catch (error) {
      return res.status(404).json({
        error: 'File not found',
        status: 404
      });
    }

    // Send file
    res.download(document.file_path, path.basename(document.file_path));
  } catch (error) {
    next(error);
  }
});

// DELETE /api/user-documents/:id (admin)
router.delete('/:id', isAdmin, async (req, res, next) => {
  try {
    const result = await UserDocument.delete(req.params.id);

    // Delete file from filesystem
    try {
      await fs.unlink(result.file_path);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Continue even if file deletion fails
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate PDF
async function generatePDF(filePath, user, documentType) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = require('fs').createWriteStream(filePath);

    doc.pipe(stream);

    // Add content to PDF
    doc.fontSize(20).text(`BMFVSE - ${documentType.toUpperCase()}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown(2);

    // User information
    doc.fontSize(14).text('User Information', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Name: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    if (user.phone) doc.text(`Phone: ${user.phone}`);
    if (user.address) doc.text(`Address: ${user.address}`);
    doc.text(`Membership Status: ${user.membership_status}`);

    doc.moveDown(2);

    // Document-specific content
    switch (documentType) {
      case 'membership_certificate':
        doc.fontSize(14).text('Membership Certificate', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text('This certifies that the above-named person is a member of BMFVSE.');
        doc.text(`Status: ${user.membership_status}`);
        break;

      case 'attendance_certificate':
        doc.fontSize(14).text('Attendance Certificate', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text('This certifies attendance and participation in BMFVSE activities.');
        break;

      default:
        doc.fontSize(12).text(`Document type: ${documentType}`);
    }

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

module.exports = router;
