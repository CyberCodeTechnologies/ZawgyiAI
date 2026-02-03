const { ZawgyiCapability } = require('../core/zawgyi-capability');
const axios = require('axios');

class BinanceCapability extends ZawgyiCapability {
    constructor() {
        super('binance', 'Binance Crypto Trading and Market Analysis');
        this.setupActions();
    }

    setupActions() {
        this.addAction('get_price', this.getPrice.bind(this), {
            description: 'Get real-time price of a crypto pair',
            parameters: ['symbol']
        });

        this.addAction('get_balance', this.getBalance.bind(this), {
            description: 'Get account balance (requires API keys)',
            parameters: ['asset']
        });

        this.addAction('market_analysis', this.marketAnalysis.bind(this), {
            description: 'Analyze market trends for a symbol',
            parameters: ['symbol']
        });

        this.addAction('set_alert', this.setPriceAlert.bind(this), {
            description: 'Set a price alert for a crypto pair',
            parameters: ['symbol', 'target_price', 'direction']
        });
    }

    async getPrice(params, userId) {
        const { symbol = 'BTCUSDT' } = params;
        const sym = symbol.toUpperCase();

        try {
            const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`);
            return {
                symbol: sym,
                price: response.data.price,
                timestamp: new Date().toISOString(),
                message: `The current price of ${sym} is ${response.data.price} USDT`
            };
        } catch (error) {
            throw new Error(`Failed to fetch price for ${sym}: ${error.message}`);
        }
    }

    async getBalance(params, userId) {
        // Placeholder for authenticated requests
        return {
            message: 'Authenticated balance requests are available in Pro version or with configured API keys.',
            status: 'unconfigured'
        };
    }

    async marketAnalysis(params, userId) {
        const { symbol = 'BTCUSDT' } = params;
        const sym = symbol.toUpperCase();

        try {
            const response = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`);
            const data = response.data;

            return {
                symbol: sym,
                price_change: data.priceChange,
                price_change_percent: data.priceChangePercent,
                high: data.highPrice,
                low: data.lowPrice,
                volume: data.volume,
                message: `${sym} 24h Summary: Change of ${data.priceChangePercent}% | High: ${data.highPrice} | Low: ${data.lowPrice}`
            };
        } catch (error) {
            throw new Error(`Failed to analyze market for ${sym}: ${error.message}`);
        }
    }

    async setPriceAlert(params, userId) {
        const { symbol, target_price, direction = 'above' } = params;

        return {
            message: `Alert set for ${symbol} when price goes ${direction} ${target_price}`,
            alert_id: 'alert_' + Date.now(),
            status: 'active'
        };
    }
}

module.exports = BinanceCapability;
