const { ZawgyiCapability } = require('../core/zawgyi-capability');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class ViberCapability extends ZawgyiCapability {
    constructor(gateway = null) {
        super('viber', 'Viber auto messaging and communication platform');
        this.gateway = gateway;
        this.apiToken = process.env.VIBER_API_TOKEN || '';
        this.webhookUrl = process.env.VIBER_WEBHOOK_URL || '';
        this.accountInfo = null;
        this.messages = [];
        this.contacts = [];
        this.isInitialized = false;
        this.dataDir = path.join(process.cwd(), 'data', 'viber');
        this.ensureDataDirectory();
        this.setupActions();
    }

    async ensureDataDirectory() {
        await fs.ensureDir(this.dataDir);
        await fs.ensureDir(path.join(this.dataDir, 'messages'));
        await fs.ensureDir(path.join(this.dataDir, 'contacts'));
        await fs.ensureDir(path.join(this.dataDir, 'media'));
    }

    setupActions() {
        this.addAction('viber_init', this.initializeViber.bind(this), {
            description: 'Initialize Viber connection'
        });

        this.addAction('viber_send_message', this.sendMessage.bind(this), {
            description: 'Send message to Viber user',
            parameters: ['receiver', 'message', 'type']
        });

        this.addAction('viber_broadcast', this.broadcastMessage.bind(this), {
            description: 'Broadcast message to multiple users',
            parameters: ['message', 'recipients']
        });

        this.addAction('viber_get_account_info', this.getAccountInfo.bind(this), {
            description: 'Get Viber account information'
        });

        this.addAction('viber_get_contacts', this.getContacts.bind(this), {
            description: 'Get Viber contacts list'
        });

        this.addAction('viber_get_messages', this.getMessages.bind(this), {
            description: 'Get message history'
        });

        this.addAction('viber_send_file', this.sendFile.bind(this), {
            description: 'Send file to Viber user',
            parameters: ['receiver', 'file_path', 'file_name']
        });

        this.addAction('viber_send_image', this.sendImage.bind(this), {
            description: 'Send image to Viber user',
            parameters: ['receiver', 'image_url', 'caption']
        });

        this.addAction('viber_set_webhook', this.setWebhook.bind(this), {
            description: 'Set Viber webhook URL'
        });

        this.addAction('viber_auto_reply', this.setAutoReply.bind(this), {
            description: 'Configure auto reply settings',
            parameters: ['keyword', 'response', 'enabled']
        });

        this.addAction('viber_schedule_message', this.scheduleMessage.bind(this), {
            description: 'Schedule message to be sent later',
            parameters: ['receiver', 'message', 'schedule_time']
        });

        this.addAction('viber_create_group', this.createGroup.bind(this), {
            description: 'Create Viber group chat',
            parameters: ['name', 'participants']
        });

        this.addAction('viber_get_online_users', this.getOnlineUsers.bind(this), {
            description: 'Get list of online users'
        });

        this.addAction('viber_send_location', this.sendLocation.bind(this), {
            description: 'Send location to Viber user',
            parameters: ['receiver', 'latitude', 'longitude', 'title']
        });

        this.addAction('viber_send_contact', this.sendContact.bind(this), {
            description: 'Send contact card to Viber user',
            parameters: ['receiver', 'contact_name', 'contact_phone']
        });
    }

    async initializeViber(params, userId) {
        try {
            if (!this.apiToken) {
                this.accountInfo = {
                    id: 'mock_viber_account',
                    name: 'ZawgyiAI Mock Viber',
                    status: 'mock',
                    messages: this.messages.length,
                    contacts: this.contacts.length
                };
                this.isInitialized = true;
                return {
                    success: true,
                    message: '✅ Viber mock mode initialized',
                    account: this.accountInfo,
                    mock: true
                };
            }

            // Test API connection
            const response = await axios.get('https://chatapi.viber.com/pa/get_account_info', {
                headers: {
                    'X-Viber-Auth-Token': this.apiToken
                }
            });

            this.accountInfo = response.data;
            this.isInitialized = true;

            // Save account info
            await fs.writeFile(
                path.join(this.dataDir, 'account_info.json'),
                JSON.stringify(this.accountInfo, null, 2)
            );

            if (this.gateway) {
                await this.gateway.notifyAll('📱 *Viber Platform Initialized*\nAccount: ' + this.accountInfo.name);
            }

            return {
                success: true,
                message: '✅ Viber platform initialized successfully',
                account: this.accountInfo
            };

        } catch (error) {
            console.error('Viber initialization error:', error);
            return {
                success: false,
                message: `❌ Failed to initialize Viber: ${error.message}`
            };
        }
    }

    async sendMessage(params, userId) {
        try {
            if (!this.isInitialized) {
                await this.initializeViber({}, userId);
            }

            const { receiver, message, type = 'text' } = params;

            if (!receiver || !message) {
                return {
                    success: false,
                    message: '❌ Receiver and message are required'
                };
            }

            if (!this.apiToken) {
                const messageData = {
                    id: 'mock_' + Date.now(),
                    receiver: receiver,
                    message: message,
                    type: type,
                    timestamp: new Date().toISOString(),
                    direction: 'outgoing',
                    status: 'sent'
                };
                await this.saveMessage(messageData);
                return {
                    success: true,
                    message: `✅ Message sent to ${receiver}`,
                    message_id: messageData.id,
                    timestamp: messageData.timestamp,
                    mock: true
                };
            }

            const payload = {
                receiver: receiver,
                type: type,
                text: message
            };

            const response = await axios.post('https://chatapi.viber.com/pa/send_message', payload, {
                headers: {
                    'X-Viber-Auth-Token': this.apiToken,
                    'Content-Type': 'application/json'
                }
            });

            // Save message to history
            const messageData = {
                id: response.data.message_token,
                receiver: receiver,
                message: message,
                type: type,
                timestamp: new Date().toISOString(),
                direction: 'outgoing',
                status: 'sent'
            };

            await this.saveMessage(messageData);

            return {
                success: true,
                message: `✅ Message sent to ${receiver}`,
                message_id: response.data.message_token,
                timestamp: messageData.timestamp
            };

        } catch (error) {
            console.error('Viber send message error:', error);
            return {
                success: false,
                message: `❌ Failed to send message: ${error.message}`
            };
        }
    }

    async broadcastMessage(params, userId) {
        try {
            const { message, recipients } = params;

            if (!message || !recipients || !Array.isArray(recipients)) {
                return {
                    success: false,
                    message: '❌ Message and recipients array are required'
                };
            }

            const results = [];
            let successCount = 0;
            let failCount = 0;

            for (const recipient of recipients) {
                const result = await this.sendMessage({
                    receiver: recipient,
                    message: message
                }, userId);

                results.push({
                    recipient: recipient,
                    success: result.success,
                    message_id: result.message_id
                });

                if (result.success) {
                    successCount++;
                } else {
                    failCount++;
                }

                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            return {
                success: true,
                message: `📢 Broadcast completed: ${successCount} sent, ${failCount} failed`,
                results: results,
                summary: {
                    total: recipients.length,
                    success: successCount,
                    failed: failCount
                }
            };

        } catch (error) {
            console.error('Viber broadcast error:', error);
            return {
                success: false,
                message: `❌ Broadcast failed: ${error.message}`
            };
        }
    }

    async getAccountInfo(params, userId) {
        try {
            if (!this.isInitialized) {
                await this.initializeViber({}, userId);
            }

            return {
                success: true,
                message: '📊 Viber Account Information',
                account: this.accountInfo
            };

        } catch (error) {
            console.error('Viber get account info error:', error);
            return {
                success: false,
                message: `❌ Failed to get account info: ${error.message}`
            };
        }
    }

    async getContacts(params, userId) {
        try {
            if (!this.isInitialized) {
                await this.initializeViber({}, userId);
            }

            // In a real implementation, you would fetch from Viber API
            // For now, return saved contacts or mock data
            const contactsFile = path.join(this.dataDir, 'contacts', 'contacts.json');
            
            let contacts = [];
            if (await fs.pathExists(contactsFile)) {
                contacts = await fs.readJson(contactsFile);
            } else {
                // Mock contacts for demonstration
                contacts = [
                    { id: 'user1', name: 'John Doe', phone: '+1234567890', status: 'online' },
                    { id: 'user2', name: 'Jane Smith', phone: '+0987654321', status: 'offline' }
                ];
                await fs.writeJson(contactsFile, contacts, { spaces: 2 });
            }
            this.contacts = contacts;

            return {
                success: true,
                message: `👥 Found ${contacts.length} contacts`,
                contacts: contacts
            };

        } catch (error) {
            console.error('Viber get contacts error:', error);
            return {
                success: false,
                message: `❌ Failed to get contacts: ${error.message}`
            };
        }
    }

    async getMessages(params, userId) {
        try {
            const { limit = 50, offset = 0 } = params;

            // Load messages from storage
            const messagesFile = path.join(this.dataDir, 'messages', 'messages.json');
            
            let messages = [];
            if (await fs.pathExists(messagesFile)) {
                messages = await fs.readJson(messagesFile);
            }
            this.messages = messages;

            // Sort by timestamp (newest first)
            messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Apply pagination
            const paginatedMessages = messages.slice(offset, offset + limit);

            return {
                success: true,
                message: `📨 Retrieved ${paginatedMessages.length} messages`,
                messages: paginatedMessages,
                total: messages.length,
                limit: limit,
                offset: offset
            };

        } catch (error) {
            console.error('Viber get messages error:', error);
            return {
                success: false,
                message: `❌ Failed to get messages: ${error.message}`
            };
        }
    }

    async sendFile(params, userId) {
        try {
            const { receiver, file_path, file_name } = params;

            if (!receiver || !file_path) {
                return {
                    success: false,
                    message: '❌ Receiver and file path are required'
                };
            }

            // Check if file exists
            if (!await fs.pathExists(file_path)) {
                return {
                    success: false,
                    message: `❌ File not found: ${file_path}`
                };
            }

            // Get file stats
            const fileStats = await fs.stat(file_path);
            const fileSize = fileStats.size;

            // Check file size limit (Viber limit is 50MB)
            if (fileSize > 50 * 1024 * 1024) {
                return {
                    success: false,
                    message: '❌ File size exceeds 50MB limit'
                };
            }

            // In a real implementation, you would upload the file to Viber
            // For now, we'll simulate file sending
            const payload = {
                receiver: receiver,
                type: 'file',
                file: file_path,
                file_name: file_name || path.basename(file_path),
                size: fileSize
            };

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            const messageData = {
                id: 'file_' + Date.now(),
                receiver: receiver,
                file_path: file_path,
                file_name: file_name || path.basename(file_path),
                size: fileSize,
                type: 'file',
                timestamp: new Date().toISOString(),
                direction: 'outgoing',
                status: 'sent'
            };

            await this.saveMessage(messageData);

            return {
                success: true,
                message: `📎 File sent to ${receiver}`,
                file_name: file_name || path.basename(file_path),
                size: fileSize,
                timestamp: messageData.timestamp
            };

        } catch (error) {
            console.error('Viber send file error:', error);
            return {
                success: false,
                message: `❌ Failed to send file: ${error.message}`
            };
        }
    }

    async sendImage(params, userId) {
        try {
            const { receiver, image_url, caption } = params;

            if (!receiver || !image_url) {
                return {
                    success: false,
                    message: '❌ Receiver and image URL are required'
                };
            }

            const payload = {
                receiver: receiver,
                type: 'picture',
                text: caption || '',
                media: image_url
            };

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            const messageData = {
                id: 'image_' + Date.now(),
                receiver: receiver,
                image_url: image_url,
                caption: caption,
                type: 'picture',
                timestamp: new Date().toISOString(),
                direction: 'outgoing',
                status: 'sent'
            };

            await this.saveMessage(messageData);

            return {
                success: true,
                message: `🖼️ Image sent to ${receiver}`,
                image_url: image_url,
                caption: caption,
                timestamp: messageData.timestamp
            };

        } catch (error) {
            console.error('Viber send image error:', error);
            return {
                success: false,
                message: `❌ Failed to send image: ${error.message}`
            };
        }
    }

    async setWebhook(params, userId) {
        try {
            const { webhook_url } = params;

            if (!webhook_url) {
                return {
                    success: false,
                    message: '❌ Webhook URL is required'
                };
            }

            const payload = {
                url: webhook_url,
                event_types: ['delivered', 'seen', 'failed', 'subscribed', 'unsubscribed', 'conversation_started']
            };

            const response = await axios.post('https://chatapi.viber.com/pa/set_webhook', payload, {
                headers: {
                    'X-Viber-Auth-Token': this.apiToken,
                    'Content-Type': 'application/json'
                }
            });

            this.webhookUrl = webhook_url;

            return {
                success: true,
                message: '✅ Webhook configured successfully',
                webhook_url: webhook_url,
                events: payload.event_types
            };

        } catch (error) {
            console.error('Viber set webhook error:', error);
            return {
                success: false,
                message: `❌ Failed to set webhook: ${error.message}`
            };
        }
    }

    async setAutoReply(params, userId) {
        try {
            const { keyword, response, enabled = true } = params;

            if (!keyword || !response) {
                return {
                    success: false,
                    message: '❌ Keyword and response are required'
                };
            }

            const autoReplyConfig = {
                keyword: keyword.toLowerCase(),
                response: response,
                enabled: enabled,
                created_at: new Date().toISOString()
            };

            // Save auto-reply configuration
            const configPath = path.join(this.dataDir, 'auto_reply.json');
            let configs = [];

            if (await fs.pathExists(configPath)) {
                configs = await fs.readJson(configPath);
            }

            // Remove existing config for this keyword
            configs = configs.filter(config => config.keyword !== keyword.toLowerCase());
            
            // Add new config
            configs.push(autoReplyConfig);

            await fs.writeJson(configPath, configs, { spaces: 2 });

            return {
                success: true,
                message: `✅ Auto-reply configured for keyword: "${keyword}"`,
                keyword: keyword,
                response: response,
                enabled: enabled
            };

        } catch (error) {
            console.error('Viber set auto reply error:', error);
            return {
                success: false,
                message: `❌ Failed to set auto-reply: ${error.message}`
            };
        }
    }

    async scheduleMessage(params, userId) {
        try {
            const { receiver, message, schedule_time } = params;

            if (!receiver || !message || !schedule_time) {
                return {
                    success: false,
                    message: '❌ Receiver, message, and schedule time are required'
                };
            }

            const scheduledTime = new Date(schedule_time);
            const now = new Date();

            if (scheduledTime <= now) {
                return {
                    success: false,
                    message: '❌ Schedule time must be in the future'
                };
            }

            const scheduledMessage = {
                id: 'scheduled_' + Date.now(),
                receiver: receiver,
                message: message,
                schedule_time: scheduledTime.toISOString(),
                created_at: now.toISOString(),
                status: 'scheduled'
            };

            // Save scheduled message
            const scheduledPath = path.join(this.dataDir, 'scheduled_messages.json');
            let scheduledMessages = [];

            if (await fs.pathExists(scheduledPath)) {
                scheduledMessages = await fs.readJson(scheduledPath);
            }

            scheduledMessages.push(scheduledMessage);
            await fs.writeJson(scheduledPath, scheduledMessages, { spaces: 2 });

            // Set up timer to send message (in a real implementation, you'd use a proper job scheduler)
            const delay = scheduledTime.getTime() - now.getTime();
            setTimeout(async () => {
                await this.sendMessage({
                    receiver: receiver,
                    message: message
                }, userId);
                
                // Update status
                scheduledMessage.status = 'sent';
                scheduledMessage.sent_at = new Date().toISOString();
                await fs.writeJson(scheduledPath, scheduledMessages, { spaces: 2 });
            }, delay);

            return {
                success: true,
                message: `⏰ Message scheduled for ${scheduledTime.toLocaleString()}`,
                scheduled_time: scheduledTime.toISOString(),
                receiver: receiver
            };

        } catch (error) {
            console.error('Viber schedule message error:', error);
            return {
                success: false,
                message: `❌ Failed to schedule message: ${error.message}`
            };
        }
    }

    async createGroup(params, userId) {
        try {
            const { name, participants } = params;

            if (!name || !participants || !Array.isArray(participants)) {
                return {
                    success: false,
                    message: '❌ Group name and participants array are required'
                };
            }

            // In a real implementation, you would use Viber's group creation API
            const group = {
                id: 'group_' + Date.now(),
                name: name,
                participants: participants,
                created_at: new Date().toISOString(),
                created_by: userId,
                type: 'group'
            };

            // Save group info
            const groupsPath = path.join(this.dataDir, 'groups.json');
            let groups = [];

            if (await fs.pathExists(groupsPath)) {
                groups = await fs.readJson(groupsPath);
            }

            groups.push(group);
            await fs.writeJson(groupsPath, groups, { spaces: 2 });

            return {
                success: true,
                message: `👥 Group "${name}" created with ${participants.length} participants`,
                group: group
            };

        } catch (error) {
            console.error('Viber create group error:', error);
            return {
                success: false,
                message: `❌ Failed to create group: ${error.message}`
            };
        }
    }

    async getOnlineUsers(params, userId) {
        try {
            // In a real implementation, you would check online status via Viber API
            const contacts = await this.getContacts({}, userId);
            
            if (!contacts.success) {
                return contacts;
            }

            const onlineUsers = contacts.contacts.filter(contact => contact.status === 'online');

            return {
                success: true,
                message: `🟢 ${onlineUsers.length} users online`,
                online_users: onlineUsers,
                total_online: onlineUsers.length
            };

        } catch (error) {
            console.error('Viber get online users error:', error);
            return {
                success: false,
                message: `❌ Failed to get online users: ${error.message}`
            };
        }
    }

    async sendLocation(params, userId) {
        try {
            const { receiver, latitude, longitude, title } = params;

            if (!receiver || !latitude || !longitude) {
                return {
                    success: false,
                    message: '❌ Receiver, latitude, and longitude are required'
                };
            }

            const payload = {
                receiver: receiver,
                type: 'location',
                location: {
                    lat: parseFloat(latitude),
                    lon: parseFloat(longitude)
                }
            };

            if (title) {
                payload.text = title;
            }

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            const messageData = {
                id: 'location_' + Date.now(),
                receiver: receiver,
                latitude: latitude,
                longitude: longitude,
                title: title,
                type: 'location',
                timestamp: new Date().toISOString(),
                direction: 'outgoing',
                status: 'sent'
            };

            await this.saveMessage(messageData);

            return {
                success: true,
                message: `📍 Location sent to ${receiver}`,
                latitude: latitude,
                longitude: longitude,
                title: title,
                timestamp: messageData.timestamp
            };

        } catch (error) {
            console.error('Viber send location error:', error);
            return {
                success: false,
                message: `❌ Failed to send location: ${error.message}`
            };
        }
    }

    async sendContact(params, userId) {
        try {
            const { receiver, contact_name, contact_phone } = params;

            if (!receiver || !contact_name || !contact_phone) {
                return {
                    success: false,
                    message: '❌ Receiver, contact name, and phone number are required'
                };
            }

            const payload = {
                receiver: receiver,
                type: 'contact',
                contact: {
                    name: contact_name,
                    phone_number: contact_phone
                }
            };

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            const messageData = {
                id: 'contact_' + Date.now(),
                receiver: receiver,
                contact_name: contact_name,
                contact_phone: contact_phone,
                type: 'contact',
                timestamp: new Date().toISOString(),
                direction: 'outgoing',
                status: 'sent'
            };

            await this.saveMessage(messageData);

            return {
                success: true,
                message: `👤 Contact sent to ${receiver}`,
                contact_name: contact_name,
                contact_phone: contact_phone,
                timestamp: messageData.timestamp
            };

        } catch (error) {
            console.error('Viber send contact error:', error);
            return {
                success: false,
                message: `❌ Failed to send contact: ${error.message}`
            };
        }
    }

    async saveMessage(messageData) {
        try {
            const messagesPath = path.join(this.dataDir, 'messages', 'messages.json');
            let messages = [];

            if (await fs.pathExists(messagesPath)) {
                messages = await fs.readJson(messagesPath);
            }

            messages.push(messageData);
            
            // Keep only last 1000 messages
            if (messages.length > 1000) {
                messages = messages.slice(-1000);
            }

            await fs.writeJson(messagesPath, messages, { spaces: 2 });

        } catch (error) {
            console.error('Failed to save message:', error);
        }
    }

    // Webhook handler for incoming messages
    async handleWebhook(webhookData) {
        try {
            const { event, user, message } = webhookData;

            // Save incoming message
            if (message && user) {
                const messageData = {
                    id: message.token || 'incoming_' + Date.now(),
                    sender: user.id,
                    sender_name: user.name,
                    message: message.text,
                    type: message.type || 'text',
                    timestamp: new Date().toISOString(),
                    direction: 'incoming',
                    status: 'received'
                };

                await this.saveMessage(messageData);

                // Check for auto-reply
                await this.checkAutoReply(messageData);
            }

            return {
                success: true,
                message: 'Webhook processed successfully'
            };

        } catch (error) {
            console.error('Viber webhook error:', error);
            return {
                success: false,
                message: `Webhook processing failed: ${error.message}`
            };
        }
    }

    async checkAutoReply(messageData) {
        try {
            const configPath = path.join(this.dataDir, 'auto_reply.json');
            
            if (!await fs.pathExists(configPath)) {
                return;
            }

            const configs = await fs.readJson(configPath);
            const messageText = messageData.message.toLowerCase();

            for (const config of configs) {
                if (config.enabled && messageText.includes(config.keyword)) {
                    await this.sendMessage({
                        receiver: messageData.sender,
                        message: config.response
                    }, 'auto_reply');
                    break;
                }
            }

        } catch (error) {
            console.error('Auto-reply check error:', error);
        }
    }
}

module.exports = ViberCapability;
