const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs-extra');
const path = require('path');

class EmailService {
  constructor(config) {
    this.config = config;
    this.imap = null;
    this.senderListPath = path.join(__dirname, '../data/senderList.json');
    this.ensureDataDirectory();
  }

  ensureDataDirectory() {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Initialize sender list if it doesn't exist
    if (!fs.existsSync(this.senderListPath)) {
      fs.writeJsonSync(this.senderListPath, []);
    }
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.imap = new Imap({
        user: this.config.email.user,
        password: this.config.email.password,
        host: this.config.email.host,
        port: this.config.email.port,
        tls: this.config.email.tls,
        tlsOptions: this.config.email.tlsOptions
      });

      this.imap.once('ready', () => {
        console.log('Connected to email server');
        resolve();
      });

      this.imap.once('error', (err) => {
        console.error('IMAP connection error:', err);
        reject(err);
      });

      this.imap.once('end', () => {
        console.log('IMAP connection ended');
      });

      this.imap.connect();
    });
  }

  disconnect() {
    if (this.imap) {
      this.imap.end();
    }
  }

  async getSenderList() {
    try {
      return await fs.readJson(this.senderListPath);
    } catch (error) {
      console.error('Error reading sender list:', error);
      return [];
    }
  }

  async addSender(email) {
    try {
      const senderList = await this.getSenderList();
      if (!senderList.includes(email)) {
        senderList.push(email);
        await fs.writeJson(this.senderListPath, senderList, { spaces: 2 });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding sender:', error);
      return false;
    }
  }

  async removeSender(email) {
    try {
      const senderList = await this.getSenderList();
      const filteredList = senderList.filter(sender => sender !== email);
      await fs.writeJson(this.senderListPath, filteredList, { spaces: 2 });
      return true;
    } catch (error) {
      console.error('Error removing sender:', error);
      return false;
    }
  }

  async getEmailsFromSenders(daysOld = 30) {
    return new Promise(async (resolve, reject) => {
      try {
        const senderList = await this.getSenderList();
        
        // Create a new connection for this operation
        const tempImap = new Imap({
          user: this.config.email.user,
          password: this.config.email.password,
          host: this.config.email.host,
          port: this.config.email.port,
          tls: this.config.email.tls,
          tlsOptions: this.config.email.tlsOptions,
          connTimeout: this.config.email.connTimeout,
          authTimeout: this.config.email.authTimeout,
          keepalive: this.config.email.keepalive
        });

        tempImap.once('ready', () => {
          tempImap.openBox('INBOX', false, (err, box) => {
            if (err) {
              tempImap.end();
              reject(err);
              return;
            }

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            // Search for all emails (we'll filter by date in JavaScript)
            tempImap.search(['ALL'], (err, results) => {
              if (err) {
                tempImap.end();
                reject(err);
                return;
              }

              if (!results || results.length === 0) {
                tempImap.end();
                resolve([]);
                return;
              }

              const fetch = tempImap.fetch(results, {
                bodies: 'HEADER.FIELDS (FROM SUBJECT DATE)',
                struct: true
              });

              const emails = [];

              fetch.on('message', (msg, seqno) => {
                let buffer = '';

                msg.on('body', (stream, info) => {
                  stream.on('data', (chunk) => {
                    buffer += chunk.toString('utf8');
                  });

                  stream.once('end', () => {
                    simpleParser(buffer, (err, parsed) => {
                      if (err) {
                        console.error('Error parsing email:', err);
                        return;
                      }

                      const from = parsed.from?.text || '';
                      const senderEmail = this.extractEmail(from);
                      const emailDate = parsed.date || new Date();
                      const daysOld = Math.floor((new Date() - new Date(emailDate)) / (1000 * 60 * 60 * 24));
                      
                      // Check if sender is in our list AND email is older than cutoff
                      if (senderList.includes(senderEmail) && emailDate < cutoffDate) {
                        emails.push({
                          uid: seqno,
                          from: from,
                          senderEmail: senderEmail,
                          subject: parsed.subject || 'No Subject',
                          date: emailDate,
                          daysOld: daysOld
                        });
                      }
                    });
                  });
                });
              });

              fetch.once('error', (err) => {
                tempImap.end();
                reject(err);
              });

              fetch.once('end', () => {
                tempImap.end();
                resolve(emails);
              });
            });
          });
        });

        tempImap.once('error', (err) => {
          reject(err);
        });

        tempImap.connect();
      } catch (error) {
        reject(error);
      }
    });
  }

  extractEmail(fromString) {
    const emailRegex = /<([^>]+)>/;
    const match = fromString.match(emailRegex);
    return match ? match[1] : fromString;
  }

  async deleteEmails(emailUids) {
    return new Promise((resolve, reject) => {
      if (!emailUids || emailUids.length === 0) {
        resolve([]);
        return;
      }

      // Create a new connection for this operation
      const tempImap = new Imap({
        user: this.config.email.user,
        password: this.config.email.password,
        host: this.config.email.host,
        port: this.config.email.port,
        tls: this.config.email.tls,
        tlsOptions: this.config.email.tlsOptions,
        connTimeout: this.config.email.connTimeout,
        authTimeout: this.config.email.authTimeout,
        keepalive: this.config.email.keepalive
      });

      tempImap.once('ready', () => {
        tempImap.openBox('INBOX', false, (err, box) => {
          if (err) {
            tempImap.end();
            reject(err);
            return;
          }

          // Mark emails for deletion
          tempImap.addFlags(emailUids, '\\Deleted', (err) => {
            if (err) {
              tempImap.end();
              reject(err);
              return;
            }

            // Expunge (permanently delete) the emails
            tempImap.expunge((err) => {
              tempImap.end();
              if (err) {
                reject(err);
                return;
              }
              resolve(emailUids);
            });
          });
        });
      });

      tempImap.once('error', (err) => {
        reject(err);
      });

      tempImap.connect();
    });
  }

  async getEmailStats() {
    const senderList = await this.getSenderList();
    const emails = await this.getEmailsFromSenders(365); // Get emails from last year
    
    const stats = {
      totalSenders: senderList.length,
      totalEmails: emails.length,
      emailsBySender: {}
    };

    emails.forEach(email => {
      if (!stats.emailsBySender[email.senderEmail]) {
        stats.emailsBySender[email.senderEmail] = 0;
      }
      stats.emailsBySender[email.senderEmail]++;
    });

    return stats;
  }
}

module.exports = EmailService;
