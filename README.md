# Remail - Email Management Application

Remail is a powerful email management application that helps you organize and delete emails from specific senders that have been in your inbox for a significant amount of time. It provides an intuitive web interface for managing sender lists and bulk deleting old emails.

## Features

- **Sender List Management**: Add and remove email addresses from your sender list
- **Email Filtering**: Filter emails by age (7 days to 1 year)
- **Bulk Deletion**: Select and delete multiple emails at once with tap-to-delete functionality
- **Statistics Dashboard**: View email statistics and sender breakdowns
- **Real-time Connection Status**: Monitor your email server connection
- **Responsive Design**: Works on desktop and mobile devices
- **Secure**: Uses IMAP for read-only access and secure deletion

## Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)
- Email account with IMAP access enabled
- App-specific password (for Gmail and other providers)

## Installation

1. **Clone or download the project**
   ```bash
   cd /Users/prabhathsundarapalli/Desktop/remail
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure email settings**
   ```bash
   cp config.example.js config.js
   ```
   
   Edit `config.js` with your email credentials:
   ```javascript
   module.exports = {
     email: {
       host: 'imap.gmail.com',        // Your IMAP server
       port: 993,                     // IMAP port (usually 993 for SSL)
       user: 'your-email@gmail.com',  // Your email address
       password: 'your-app-password', // App-specific password
       tls: true,
       tlsOptions: { rejectUnauthorized: false }
     },
     app: {
       port: 3000,
       sessionSecret: 'your-secret-key-here'
     }
   };
   ```

## Email Provider Setup

### Gmail Setup
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password in your config.js file

### Outlook/Hotmail Setup
1. Enable IMAP access in your Outlook settings
2. Use these settings:
   ```javascript
   host: 'outlook.office365.com',
   port: 993,
   tls: true
   ```

### Yahoo Mail Setup
1. Enable IMAP access in Yahoo Mail settings
2. Generate an App Password
3. Use these settings:
   ```javascript
   host: 'imap.mail.yahoo.com',
   port: 993,
   tls: true
   ```

## Usage

1. **Start the application**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

2. **Open your browser**
   Navigate to `http://localhost:3000`

3. **Add Senders**
   - Go to the "Sender List" tab
   - Add email addresses of senders whose emails you want to manage
   - Click "Add Sender" to add them to your list

4. **Delete Emails**
   - Go to the "Delete Emails" tab
   - Select the age filter (how old emails should be)
   - Click "Load Emails" to fetch emails from your sender list
   - Select individual emails or use "Select All"
   - Click "Delete Selected" to remove them

5. **View Statistics**
   - Go to the "Statistics" tab
   - View overview of your email management data
   - See breakdown by sender

## File Structure

```
remail/
├── public/                 # Frontend files
│   ├── index.html         # Main HTML interface
│   ├── styles.css         # CSS styling
│   └── script.js          # Frontend JavaScript
├── services/              # Backend services
│   └── emailService.js    # Email management service
├── data/                  # Data storage (auto-created)
│   └── senderList.json    # Sender list storage
├── server.js              # Main server file
├── config.example.js      # Configuration template
├── config.js              # Your configuration (create this)
├── package.json           # Node.js dependencies
└── README.md              # This file
```

## API Endpoints

- `GET /api/senders` - Get list of senders
- `POST /api/senders` - Add a sender
- `DELETE /api/senders/:email` - Remove a sender
- `GET /api/emails?daysOld=X` - Get emails older than X days
- `POST /api/emails/delete` - Delete selected emails
- `GET /api/stats` - Get email statistics
- `GET /api/test-connection` - Test email connection

## Security Considerations

- **App Passwords**: Always use app-specific passwords, never your main account password
- **IMAP Access**: The application only reads email headers and deletes emails - it doesn't send emails
- **Local Storage**: Sender lists are stored locally in JSON format
- **HTTPS**: For production use, consider setting up HTTPS

## Troubleshooting

### Connection Issues
- Verify your email credentials in `config.js`
- Check if IMAP is enabled for your email provider
- Ensure you're using an app-specific password (not your regular password)
- Check firewall settings if connecting to corporate email

### Permission Errors
- Make sure the application has write permissions to create the `data/` directory
- Check that your email account allows IMAP access

### No Emails Found
- Verify senders are added to your sender list
- Check if the time filter is appropriate
- Ensure emails from those senders exist in your inbox

## Development

To contribute or modify the application:

1. Install development dependencies:
   ```bash
   npm install --save-dev nodemon
   ```

2. Run in development mode:
   ```bash
   npm run dev
   ```

3. The application will auto-restart when you make changes to the code.

## License

MIT License - feel free to use and modify as needed.

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify your email provider's IMAP settings
3. Ensure all dependencies are properly installed
4. Check the console for error messages

## Features Roadmap

- [ ] Email preview before deletion
- [ ] Backup emails before deletion
- [ ] Scheduled email cleanup
- [ ] Multiple email account support
- [ ] Email export functionality
- [ ] Advanced filtering options
- [ ] Email templates management
# Test commit for contribution graph
