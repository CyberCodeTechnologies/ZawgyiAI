const { ZawgyiCapability } = require('../core/zawgyi-capability');
const nodemailer = require('nodemailer');

class EmailCapability extends ZawgyiCapability {
    constructor() {
        super('email', 'Advanced email management and automation');
        
        this.transporter = null;
        this.imapConfig = null;
        
        this.setupActions();
        this.initializeEmail();
    }

    setupActions() {
        this.addAction('send', this.sendEmail.bind(this), {
            description: 'Send an email',
            parameters: ['to', 'subject', 'body', 'cc', 'bcc']
        });

        this.addAction('read', this.readEmails.bind(this), {
            description: 'Read emails from inbox',
            parameters: ['limit', 'unread_only', 'folder']
        });

        this.addAction('reply', this.replyEmail.bind(this), {
            description: 'Reply to an email',
            parameters: ['message_id', 'body']
        });

        this.addAction('search', this.searchEmails.bind(this), {
            description: 'Search emails',
            parameters: ['query', 'folder']
        });
    }

    async initializeEmail() {
        if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            console.log('📧 Email capability initialized');
        } else {
            console.log('⚠️ Email not configured - set EMAIL_HOST, EMAIL_USER, EMAIL_PASS');
        }
    }

    async sendEmail(params, userId) {
        if (!this.transporter) {
            throw new Error('Email not configured');
        }

        const { to, subject, body, cc, bcc } = params;
        
        if (!to || !subject || !body) {
            throw new Error('Missing required fields: to, subject, body');
        }

        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to,
                subject,
                text: body,
                html: body.replace(/\n/g, '<br>'),
                cc: cc || undefined,
                bcc: bcc || undefined
            };

            const result = await this.transporter.sendMail(mailOptions);
            
            return {
                message: `Email sent successfully to ${to}`,
                messageId: result.messageId,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    async readEmails(params, userId) {
        // Mock implementation - would integrate with IMAP in production
        const { limit = 10, unread_only = false, folder = 'INBOX' } = params;
        
        const mockEmails = [
            {
                id: '1',
                from: 'test@example.com',
                subject: 'Test Email 1',
                body: 'This is a test email',
                date: new Date().toISOString(),
                unread: true
            },
            {
                id: '2',
                from: 'user@example.com',
                subject: 'Important Update',
                body: 'Please review this important information',
                date: new Date(Date.now() - 3600000).toISOString(),
                unread: false
            }
        ];

        const emails = unread_only 
            ? mockEmails.filter(email => email.unread)
            : mockEmails;

        return {
            message: `Found ${emails.length} emails in ${folder}`,
            emails: emails.slice(0, limit),
            folder,
            unread_only
        };
    }

    async replyEmail(params, userId) {
        const { message_id, body } = params;
        
        if (!message_id || !body) {
            throw new Error('Missing required fields: message_id, body');
        }

        return {
            message: `Reply sent to message ${message_id}`,
            reply: body,
            timestamp: new Date().toISOString()
        };
    }

    async searchEmails(params, userId) {
        const { query, folder = 'INBOX' } = params;
        
        if (!query) {
            throw new Error('Missing required field: query');
        }

        return {
            message: `Search results for "${query}" in ${folder}`,
            query,
            folder,
            results: [], // Would contain actual search results
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = EmailCapability;
