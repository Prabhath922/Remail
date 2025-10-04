const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const EmailService = require('./services/emailService');

// Try to load config, fallback to example
let config;
try {
  config = require('./config');
} catch (error) {
  console.log('Config file not found, using example config. Please copy config.example.js to config.js and configure your email settings.');
  config = require('./config.example');
}

const app = express();
const emailService = new EmailService(config);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get sender list
app.get('/api/senders', async (req, res) => {
  try {
    const senders = await emailService.getSenderList();
    res.json({ success: true, senders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add sender to list
app.post('/api/senders', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const added = await emailService.addSender(email);
    if (added) {
      res.json({ success: true, message: 'Sender added successfully' });
    } else {
      res.json({ success: false, message: 'Sender already exists' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove sender from list
app.delete('/api/senders/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const removed = await emailService.removeSender(email);
    if (removed) {
      res.json({ success: true, message: 'Sender removed successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Sender not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get emails from senders
app.get('/api/emails', async (req, res) => {
  try {
    const { daysOld = 30 } = req.query;
    const emails = await emailService.getEmailsFromSenders(parseInt(daysOld));
    res.json({ success: true, emails });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete emails
app.post('/api/emails/delete', async (req, res) => {
  try {
    const { emailUids } = req.body;
    if (!emailUids || !Array.isArray(emailUids)) {
      return res.status(400).json({ success: false, error: 'Email UIDs are required' });
    }

    const deletedUids = await emailService.deleteEmails(emailUids);
    res.json({ success: true, deletedCount: deletedUids.length, deletedUids });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get email statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await emailService.getEmailStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test email connection
app.get('/api/test-connection', async (req, res) => {
  try {
    await emailService.connect();
    emailService.disconnect();
    res.json({ success: true, message: 'Connection successful' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = config.app.port || 3000;
app.listen(PORT, () => {
  console.log(`Remail server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to access the application`);
});
