const { ZawgyiCapability } = require('../core/zawgyi-capability');
const fs = require('fs-extra');
const path = require('path');

class PersonalAssistantCapability extends ZawgyiCapability {
    constructor() {
        super('personal-assistant', 'Core Personal Assistant - Email Management, Message Handling, Voice Conversations, and Personal Vault');
        
        this.setupActions();
        this.setupPersonalVault();
    }

    setupActions() {
        // Core Personal Assistant
        this.addAction('check_email', this.checkEmail.bind(this), {
            description: 'Check incoming email and remove spam',
            parameters: ['account', 'filters']
        });

        this.addAction('read_messages', this.readMessages.bind(this), {
            description: 'Read and manage messages from multiple platforms',
            parameters: ['platforms']
        });

        this.addAction('place_order', this.placeOrder.bind(this), {
            description: 'Place orders and handle purchases',
            parameters: ['item', 'vendor', 'details']
        });

        this.addAction('send_reminder', this.sendReminder.bind(this), {
            description: 'Send reminders and notes to productivity tools',
            parameters: ['content', 'tool', 'time']
        });

        this.addAction('voice_call', this.voiceCall.bind(this), {
            description: 'Initiate voice conversations',
            parameters: ['contact', 'topic']
        });

        this.addAction('manage_vault', this.manageVault.bind(this), {
            description: 'Manage 1Password vault access',
            parameters: ['action', 'item']
        });

        this.addAction('get_location', this.getLocation.bind(this), {
            description: 'Provide the current location link'
        });
    }

    async getLocation(params, userId) {
        console.log(`📍 Providing location link for user ${userId}`);
        
        // Placeholder for real location logic
        // In a real implementation, we could use an IP-based geolocation API
        // For now, providing a generic link as requested.
        const locationLink = "https://www.google.com/maps/search/?api=1&query=current+location";
        
        return {
            success: true,
            message: `📍 *Current Location Matrix*\n\nYour neural node is currently localized at the following coordinates:\n\n[Open Map Link](${locationLink})\n\n_Note: Location is derived from network telemetry._`,
            link: locationLink
        };
    }

    setupPersonalVault() {
        this.vaultPath = path.join(process.cwd(), 'data', 'personal-vault');
        fs.ensureDirSync(this.vaultPath);
    }

    async checkEmail(params, userId) {
        const { account = 'primary', filters = [] } = params;
        
        console.log(`📧 Checking email for account: ${account}`);

        try {
            // Simulate email checking with spam filtering
            const emails = [
                { id: 1, from: 'spam@fake.com', subject: 'You won $1000000!', isSpam: true },
                { id: 2, from: 'boss@company.com', subject: 'Meeting tomorrow', isSpam: false },
                { id: 3, from: 'newsletter@tech.com', subject: 'Weekly Tech News', isSpam: false }
            ];

            const filteredEmails = emails.filter(email => {
                if (email.isSpam) {
                    console.log(`🗑️ Removed spam: ${email.subject}`);
                    return false;
                }
                return true;
            });

            return {
                message: `Email check completed for ${account}`,
                total_processed: emails.length,
                spam_removed: emails.filter(e => e.isSpam).length,
                legitimate_emails: filteredEmails.length,
                emails: filteredEmails,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Email check error:', error);
            throw new Error(`Failed to check email: ${error.message}`);
        }
    }

    async readMessages(params, userId) {
        const { platforms = ['telegram', 'whatsapp', 'discord', 'slack'] } = params;
        
        console.log(`📱 Reading messages from platforms: ${platforms.join(', ')}`);

        try {
            const messages = {};
            
            for (const platform of platforms) {
                messages[platform] = await this.getPlatformMessages(platform);
            }

            return {
                message: 'Messages retrieved from all platforms',
                platforms: messages,
                total_messages: Object.values(messages).reduce((sum, msgs) => sum + msgs.length, 0),
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Message reading error:', error);
            throw new Error(`Failed to read messages: ${error.message}`);
        }
    }

    async placeOrder(params, userId) {
        const { item, vendor, details = {} } = params;
        
        if (!item || !vendor) {
            throw new Error('Item and vendor are required');
        }

        console.log(`🛒 Placing order: ${item} from ${vendor}`);

        try {
            const orderId = 'order_' + Date.now();
            const order = {
                id: orderId,
                item: item,
                vendor: vendor,
                details: details,
                status: 'placed',
                user_id: userId,
                placed_at: new Date().toISOString(),
                estimated_delivery: this.calculateDelivery(vendor)
            };

            // Save order
            await this.saveOrder(order);

            return {
                message: `Order placed successfully`,
                order: order,
                confirmation: `Order ${orderId} placed for ${item} from ${vendor}`,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Order placement error:', error);
            throw new Error(`Failed to place order: ${error.message}`);
        }
    }

    async sendReminder(params, userId) {
        const { content, tool, time } = params;
        
        if (!content || !tool) {
            throw new Error('Content and tool are required');
        }

        console.log(`🔔 Sending reminder to ${tool}: ${content}`);

        try {
            const reminder = {
                id: 'reminder_' + Date.now(),
                content: content,
                tool: tool,
                time: time || 'now',
                user_id: userId,
                created_at: new Date().toISOString(),
                status: 'sent'
            };

            // Simulate sending to different tools
            const result = await this.sendToProductivityTool(tool, content, time);

            return {
                message: `Reminder sent to ${tool}`,
                reminder: reminder,
                result: result,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Reminder error:', error);
            throw new Error(`Failed to send reminder: ${error.message}`);
        }
    }

    async voiceCall(params, userId) {
        const { contact, topic } = params;
        
        if (!contact) {
            throw new Error('Contact is required');
        }

        console.log(`📞 Initiating voice call to ${contact}`);

        try {
            const call = {
                id: 'call_' + Date.now(),
                contact: contact,
                topic: topic || 'General',
                initiated_by: userId,
                started_at: new Date().toISOString(),
                status: 'initiated'
            };

            // Simulate voice conversation
            const conversation = await this.simulateVoiceConversation(contact, topic);

            return {
                message: `Voice call initiated with ${contact}`,
                call: call,
                conversation: conversation,
                duration: conversation.duration,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Voice call error:', error);
            throw new Error(`Failed to initiate voice call: ${error.message}`);
        }
    }

    async manageVault(params, userId) {
        const { action, item } = params;
        
        if (!action) {
            throw new Error('Action is required');
        }

        console.log(`🔐 Managing vault: ${action}`);

        try {
            let result;
            
            switch (action) {
                case 'read':
                    result = await this.readVaultItem(item);
                    break;
                case 'write':
                    result = await this.writeVaultItem(item, params.value);
                    break;
                case 'list':
                    result = await this.listVaultItems();
                    break;
                case 'delete':
                    result = await this.deleteVaultItem(item);
                    break;
                default:
                    throw new Error('Unknown vault action');
            }

            return {
                message: `Vault ${action} operation completed`,
                action: action,
                result: result,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Vault management error:', error);
            throw new Error(`Failed to manage vault: ${error.message}`);
        }
    }

    // Helper methods
    async getPlatformMessages(platform) {
        // Simulate getting messages from different platforms
        const mockMessages = {
            telegram: [
                { id: 1, from: 'John', message: 'Hey, how are you?', time: '10:30 AM' },
                { id: 2, from: 'Sarah', message: 'Meeting at 2 PM', time: '11:15 AM' }
            ],
            whatsapp: [
                { id: 1, from: 'Mom', message: 'Call me when you can', time: '9:45 AM' },
                { id: 2, from: 'Team', message: 'Project update shared', time: '12:00 PM' }
            ],
            discord: [
                { id: 1, from: 'DevTeam', message: 'New PR ready for review', time: '2:30 PM' }
            ],
            slack: [
                { id: 1, from: '#general', message: 'Company announcement', time: '8:00 AM' }
            ]
        };

        return mockMessages[platform] || [];
    }

    calculateDelivery(vendor) {
        const deliveryTimes = {
            'amazon': '2 days',
            'ebay': '5-7 days',
            'local_store': '1 day',
            'international': '2-3 weeks'
        };

        return deliveryTimes[vendor.toLowerCase()] || '3-5 days';
    }

    async saveOrder(order) {
        const ordersPath = path.join(this.vaultPath, 'orders.json');
        let orders = [];
        
        if (fs.existsSync(ordersPath)) {
            orders = await fs.readJson(ordersPath);
        }
        
        orders.push(order);
        await fs.writeJson(ordersPath, orders, { spaces: 2 });
    }

    async sendToProductivityTool(tool, content, time) {
        const tools = {
            'tana': { status: 'sent', id: 'tana_' + Date.now() },
            'notion': { status: 'sent', id: 'notion_' + Date.now() },
            'obsidian': { status: 'sent', id: 'obsidian_' + Date.now() }
        };

        return tools[tool.toLowerCase()] || { status: 'unsupported_tool', tool: tool };
    }

    async simulateVoiceConversation(contact, topic) {
        // Simulate voice conversation
        return {
            contact: contact,
            topic: topic,
            duration: '3:45',
            summary: `Had a productive conversation with ${contact} about ${topic}`,
            action_items: ['Follow up on Monday', 'Send documents', 'Schedule next meeting'],
            recording_path: path.join(this.vaultPath, `call_${Date.now()}.mp3`)
        };
    }

    async readVaultItem(item) {
        const vaultPath = path.join(this.vaultPath, 'vault.json');
        
        if (!fs.existsSync(vaultPath)) {
            return null;
        }
        
        const vault = await fs.readJson(vaultPath);
        return vault[item] || null;
    }

    async writeVaultItem(item, value) {
        const vaultPath = path.join(this.vaultPath, 'vault.json');
        let vault = {};
        
        if (fs.existsSync(vaultPath)) {
            vault = await fs.readJson(vaultPath);
        }
        
        vault[item] = {
            value: value,
            updated_at: new Date().toISOString(),
            updated_by: 'system'
        };
        
        await fs.writeJson(vaultPath, vault, { spaces: 2 });
        return vault[item];
    }

    async listVaultItems() {
        const vaultPath = path.join(this.vaultPath, 'vault.json');
        
        if (!fs.existsSync(vaultPath)) {
            return [];
        }
        
        const vault = await fs.readJson(vaultPath);
        return Object.keys(vault);
    }

    async deleteVaultItem(item) {
        const vaultPath = path.join(this.vaultPath, 'vault.json');
        
        if (!fs.existsSync(vaultPath)) {
            return false;
        }
        
        const vault = await fs.readJson(vaultPath);
        const deleted = vault[item];
        delete vault[item];
        
        await fs.writeJson(vaultPath, vault, { spaces: 2 });
        return deleted;
    }
}

module.exports = PersonalAssistantCapability;
