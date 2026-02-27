const { ZawgyiCapability } = require('../core/zawgyi-capability');
const path = require('path');
const fs = require('fs-extra');

class FeatureHubCapability extends ZawgyiCapability {
    constructor(gateway = null) {
        super('feature-hub', 'Unified feature stubs for providers and tools');
        this.gateway = gateway;
        this.setupActions();
    }

    setupActions() {
        const chatProviders = [
            'whatsapp', 'telegram', 'discord', 'slack', 'signal',
            'imessage_imsg', 'imessage_bluebubbles', 'microsoft_teams',
            'nextcloud_talk', 'matrix', 'nostr', 'tlon', 'zalo_bot',
            'zalo_personal', 'webchat'
        ];
        chatProviders.forEach(name => {
            this.addAction(`${name}_send_message`, async (params, userId) => {
                const { to, message } = params || {};
                if (!message) return { success: false, message: 'Message required' };
                // If platform is available through gateway, record to history
                const platformName = this.mapPlatformName(name);
                if (this.gateway && platformName) {
                    this.gateway.addMessageToHistory(platformName, userId || 'User', message, 'text', platformName);
                }
                return {
                    success: true,
                    message: `Message queued for ${name}`,
                    to: to || 'unknown',
                    provider: name,
                    mock: true
                };
            }, { description: `Send message via ${name}` });
        });

        const aiModels = [
            { name: 'anthropic', env: 'ANTHROPIC_API_KEY' },
            { name: 'openai', env: 'OPENAI_API_KEY' },
            { name: 'google', env: 'GOOGLE_API_KEY' },
            { name: 'minimax', env: 'MINIMAX_API_KEY' },
            { name: 'xai', env: 'XAI_API_KEY' },
            { name: 'vercel_ai_gateway', env: 'VERCEL_AI_GATEWAY_KEY' },
            { name: 'openrouter', env: 'OPENROUTER_API_KEY' },
            { name: 'mistral', env: 'MISTRAL_API_KEY' },
            { name: 'deepseek', env: 'DEEPSEEK_API_KEY' },
            { name: 'glm', env: 'GLM_API_KEY' },
            { name: 'perplexity', env: 'PERPLEXITY_API_KEY' },
            { name: 'huggingface', env: 'HF_API_TOKEN' },
            { name: 'ollama', env: 'OLLAMA_HOST' },
            { name: 'lmstudio', env: 'LMSTUDIO_HOST' }
        ];
        aiModels.forEach(m => {
            this.addAction(`${m.name}_model_available`, async () => {
                const configured = !!process.env[m.env];
                return { success: true, model: m.name, configured };
            }, { description: `Check availability for ${m.name}` });
        });

        const productivity = [
            { name: 'apple_notes' }, { name: 'apple_reminders' }, { name: 'things3' },
            { name: 'notion' }, { name: 'obsidian' }, { name: 'bear_notes' },
            { name: 'trello' }, { name: 'github' }
        ];
        productivity.forEach(p => {
            this.addAction(`${p.name}_status`, async () => ({ success: true, provider: p.name, mock: true }));
        });

        const music = ['spotify', 'sonos', 'shazam'];
        music.forEach(m => {
            this.addAction(`${m}_play`, async (params) => ({ success: true, provider: m, track: params?.track || 'unknown', mock: true }));
        });

        const smarthome = ['philips_hue', '8sleep', 'home_assistant'];
        smarthome.forEach(s => {
            this.addAction(`${s}_status`, async () => ({ success: true, provider: s, mock: true }));
        });

        const tools = ['browser', 'canvas', 'voice', 'gmail', 'cron', 'webhooks', '1password', 'weather'];
        tools.forEach(t => {
            this.addAction(`${t}_execute`, async (params) => ({ success: true, tool: t, params, mock: true }));
        });

        const media = ['image_gen', 'gif_search', 'peekaboo', 'camera'];
        media.forEach(n => {
            this.addAction(`${n}_run`, async (params) => {
                if (n === 'camera') {
                    // If surveillance capability exists, delegate photo capture
                    const surv = this.gateway?.core?.capabilityRegistry?.get('surveillance');
                    if (surv && surv.takePhoto) {
                        return await surv.takePhoto({}, params?.userId || 'system');
                    }
                }
                return { success: true, feature: n, params, mock: true };
            });
        });

        const social = ['twitter_x', 'email'];
        social.forEach(s => {
            this.addAction(`${s}_post`, async (params) => ({ success: true, provider: s, content: params?.content || '', mock: true }));
        });
    }

    mapPlatformName(name) {
        const map = {
            whatsapp: 'whatsapp',
            telegram: 'telegram',
            discord: 'discord',
            slack: 'slack',
            signal: 'signal',
            imessage_imsg: 'imessage',
            imessage_bluebubbles: 'imessage',
            microsoft_teams: 'teams',
            nextcloud_talk: 'nextcloud',
            matrix: 'matrix',
            nostr: 'nostr',
            tlon: 'tlon',
            zalo_bot: 'zalo',
            zalo_personal: 'zalo',
            webchat: 'web'
        };
        return map[name] || null;
    }
}

module.exports = FeatureHubCapability;
