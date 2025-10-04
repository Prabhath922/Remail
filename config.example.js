// Email Configuration Example
// Copy this file to config.js and fill in your email credentials

module.exports = {
  email: {
    host: 'imap.gmail.com',
    port: 993,
    user: 'your-email@gmail.com',
    password: 'your-app-password', // Use app-specific password for Gmail
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  },
  app: {
    port: 3000,
    sessionSecret: 'your-secret-key-here'
  }
};
