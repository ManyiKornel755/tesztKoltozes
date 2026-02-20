const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      html,
      text: text || undefined
    };

    const result = await sgMail.send(msg);
    console.log(`Email sent to ${to}`);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
    }
    throw error;
  }
};

const sendBulkEmail = async (emails) => {
  try {
    const messages = emails.map(({ to, subject, html, text }) => ({
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      html,
      text: text || undefined
    }));

    const result = await sgMail.send(messages);
    console.log(`Bulk email sent to ${emails.length} recipients`);
    return result;
  } catch (error) {
    console.error('Error sending bulk email:', error);
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
    }
    throw error;
  }
};

const sendNewsletterToRecipients = async (subject, body, recipients) => {
  try {
    const emails = recipients.map(recipient => ({
      to: recipient.email,
      subject,
      html: body
    }));

    return await sendBulkEmail(emails);
  } catch (error) {
    console.error('Error sending newsletter:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  sendNewsletterToRecipients
};
