const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

class PDFGenerator {
  static async generateUserDocument(userId, documentType = 'profile') {
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = userRows[0];

    if (!user) {
      throw new Error('User not found');
    }

    const doc = new PDFDocument();
    const fileName = `user_${userId}_${documentType}_${Date.now()}.pdf`;
    const filePath = path.join('uploads', fileName);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text('User Document', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Document Type: ${documentType}`);
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${user.first_name} ${user.last_name}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Phone: ${user.phone || 'N/A'}`);
    doc.text(`Member: ${user.is_member ? 'Yes' : 'No'}`);
    doc.text(`Created: ${new Date(user.created_at).toLocaleString()}`);

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  static async generateRaceReport(raceReportId) {
    const [reportRows] = await pool.query('SELECT * FROM race_reports WHERE id = ?', [raceReportId]);
    const report = reportRows[0];

    if (!report) {
      throw new Error('Race report not found');
    }

    const [participants] = await pool.query(`
      SELECT 
        rp.*,
        u.first_name,
        u.last_name,
        u.email
      FROM race_participants rp
      LEFT JOIN users u ON rp.user_id = u.id
      WHERE rp.race_report_id = ?
      ORDER BY rp.position IS NULL, rp.position ASC
    `, [raceReportId]);

    const doc = new PDFDocument({ margin: 50 });
    const fileName = `race_report_${raceReportId}_${Date.now()}.pdf`;
    const filePath = path.join('uploads', fileName);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(22).text('Race Report', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(16).text(report.race_name, { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12);
    doc.text(`Date: ${new Date(report.race_date).toLocaleDateString()}`);
    doc.text(`Location: ${report.location || 'N/A'}`);
    doc.text(`Status: ${report.status}`);
    doc.moveDown(2);

    doc.fontSize(14).text('Participants', { underline: true });
    doc.moveDown();

    if (participants.length > 0) {
      participants.forEach((p, index) => {
        doc.fontSize(11);
        const position = p.position ? `#${p.position}` : 'N/A';
        const name = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown';
        const sailNumber = p.sail_number || 'N/A';
        const boatClass = p.boat_class || 'N/A';

        doc.text(`${index + 1}. Position: ${position} | ${name} | Sail: ${sailNumber} | Class: ${boatClass}`);
        
        if (p.notes) {
          doc.fontSize(9).text(`   Notes: ${p.notes}`, { color: 'gray' });
        }
        
        doc.moveDown(0.5);
      });
    } else {
      doc.fontSize(11).text('No participants registered yet.', { color: 'gray' });
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }
}

module.exports = PDFGenerator;
