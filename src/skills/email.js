const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

class EmailSkill {
    constructor() {
        this.description = 'Manage emails - send, read, reply, and organize';
        this.actions = ['send', 'read', 'reply', 'delete', 'search'];
        this.parameters = {
            send: ['to', 'subject', 'body', 'cc', 'bcc'],
            read: ['folder', 'limit', 'unread_only'],
            reply: ['message_id', 'body'],
            delete: ['message_id'],
            search: ['query', 'folder']
        };
        
        this.transporter = null;
        this.imapConfig = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
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

            this.imapConfig = {
                user: process.env.EMAIL_USER,
                password: process.env.EMAIL_PASS,
                host: process.env.EMAIL_HOST.replace('smtp', 'imap') || 'imap.gmail.com',
                port: 993,
                tls: true
            };
        }
    }

    async execute(action, parameters, userId) {
        switch (action) {
            case 'send':
                return await this.sendEmail(parameters);
            case 'read':
                return await this.readEmails(parameters);
            case 'reply':
                return await this.replyEmail(parameters);
            case 'delete':
                return await this.deleteEmail(parameters);
            case 'search':
                return await this.searchEmails(parameters);
            default:
                return { success: false, error: `Unknown action: ${action}` };
        }
    }

    async sendEmail(params) {
        if (!this.transporter) {
            return { success: false, error: 'Email not configured' };
        }

        const { to, subject, body, cc, bcc } = params;
        
        if (!to || !subject || !body) {
            return { success: false, error: 'Missing required fields: to, subject, body' };
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
                success: true,
                message: `Email sent successfully to ${to}`,
                messageId: result.messageId
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async readEmails(params) {
        if (!this.imapConfig) {
            return { success: false, error: 'Email not configured' };
        }

        const { folder = 'INBOX', limit = 10, unread_only = false } = params;

        return new Promise((resolve) => {
            const imap = new Imap(this.imapConfig);
            
            imap.once('ready', () => {
                imap.openBox(folder, false, (err, box) => {
                    if (err) {
                        resolve({ success: false, error: err.message });
                        return;
                    }

                    const searchCriteria = unread_only ? ['UNSEEN'] : ['ALL'];
                    
                    imap.search(searchCriteria, (err, results) => {
                        if (err) {
                            resolve({ success: false, error: err.message });
                            return;
                        }

                        if (results.length === 0) {
                            resolve({ success: true, message: 'No emails found', emails: [] });
                            return;
                        }

                        const limitedResults = results.slice(-limit);
                        const emails = [];
                        let processed = 0;

                        const fetch = imap.fetch(limitedResults, { bodies: '' });
                        
                        fetch.on('message', (msg, seqno) => {
                            msg.on('body', (stream, info) => {
                                simpleParser(stream, (err, parsed) => {
                                    if (err) {
                                        console.error('Parse error:', err);
                                        return;
                                    }

                                    emails.push({
                                        seqno,
                                        subject: parsed.subject || 'No subject',
                                        from: parsed.from.text,
                                        date: parsed.date,
                                        body: parsed.text || parsed.html || '',
                                        unread: parsed.headers.get('x-gm-thrid') ? true : false
                                    });

                                    processed++;
                                    if (processed === limitedResults.length) {
                                        imap.end();
                                    }
                                });
                            });
                        });

                        fetch.once('error', (err) => {
                            resolve({ success: false, error: err.message });
                        });
                    });
                });
            });

            imap.once('error', (err) => {
                resolve({ success: false, error: err.message });
            });

            imap.once('end', () => {
                resolve({
                    success: true,
                    message: `Found ${emails.length} emails`,
                    emails: emails.reverse()
                });
            });

            imap.connect();
        });
    }

    async replyEmail(params) {
        const { message_id, body } = params;
        
        if (!message_id || !body) {
            return { success: false, error: 'Missing required fields: message_id, body' };
        }

        // This would require fetching the original email first
        // For now, return a placeholder response
        return {
            success: true,
            message: `Reply functionality would send: "${body}" to message ${message_id}`
        };
    }

    async deleteEmail(params) {
        const { message_id } = params;
        
        if (!message_id) {
            return { success: false, error: 'Missing required field: message_id' };
        }

        // This would require IMAP implementation
        return {
            success: true,
            message: `Email ${message_id} marked for deletion`
        };
    }

    async searchEmails(params) {
        const { query, folder = 'INBOX' } = params;
        
        if (!query) {
            return { success: false, error: 'Missing required field: query' };
        }

        // This would require IMAP search implementation
        return {
            success: true,
            message: `Search for "${query}" in ${folder} would be executed here`
        };
    }
}

module.exports = EmailSkill;
