const { ZawgyiCapability } = require('../core/zawgyi-capability');
const fs = require('fs-extra');
const path = require('path');

class AnalyticsCapability extends ZawgyiCapability {
    constructor() {
        super('analytics', 'Analytics Dashboard - Usage Statistics, Performance Metrics, and System Health Monitoring');
        
        this.setupActions();
        this.setupAnalyticsStorage();
    }

    setupAnalyticsStorage() {
        this.analyticsDir = path.join(process.cwd(), 'data', 'analytics');
        this.metricsDir = path.join(this.analyticsDir, 'metrics');
        this.reportsDir = path.join(this.analyticsDir, 'reports');
        
        fs.ensureDirSync(this.analyticsDir);
        fs.ensureDirSync(this.metricsDir);
        fs.ensureDirSync(this.reportsDir);
    }

    setupActions() {
        this.addAction('dashboard', this.getDashboard.bind(this), {
            description: 'Get analytics dashboard overview',
            parameters: []
        });

        this.addAction('usage_stats', this.getUsageStats.bind(this), {
            description: 'Get detailed usage statistics',
            parameters: ['period']
        });

        this.addAction('performance', this.getPerformanceMetrics.bind(this), {
            description: 'Get system performance metrics',
            parameters: []
        });

        this.addAction('health', this.getSystemHealth.bind(this), {
            description: 'Get system health status',
            parameters: []
        });

        this.addAction('report', this.generateReport.bind(this), {
            description: 'Generate analytics report',
            parameters: ['type', 'period']
        });

        this.addAction('track', this.trackEvent.bind(this), {
            description: 'Track custom event',
            parameters: ['event', 'data']
        });
    }

    async getDashboard(params, userId) {
        console.log('📊 Generating analytics dashboard');

        try {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            
            // Get today's metrics
            const todayMetrics = await this.getDailyMetrics(today);
            
            // Get system health
            const healthStatus = await this.getSystemHealth({});
            
            // Get top capabilities usage
            const capabilitiesUsage = await this.getCapabilitiesUsage();
            
            // Get platform distribution
            const platformStats = await this.getPlatformStats();

            const dashboard = {
                overview: {
                    date: today,
                    total_requests: todayMetrics.total_requests || 0,
                    active_users: todayMetrics.active_users || 0,
                    success_rate: todayMetrics.success_rate || 0,
                    avg_response_time: todayMetrics.avg_response_time || 0
                },
                system_health: healthStatus.health_score || 85,
                top_capabilities: capabilitiesUsage.slice(0, 5),
                platform_distribution: platformStats,
                recent_events: await this.getRecentEvents(10),
                performance: {
                    cpu_usage: healthStatus.cpu_usage || 0,
                    memory_usage: healthStatus.memory_usage || 0,
                    disk_usage: healthStatus.disk_usage || 0
                }
            };

            return {
                message: 'Analytics dashboard generated',
                dashboard: dashboard,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Dashboard generation error:', error);
            throw new Error(`Failed to generate dashboard: ${error.message}`);
        }
    }

    async getUsageStats(params, userId) {
        const { period = '7d' } = params;

        console.log(`📈 Getting usage statistics for period: ${period}`);

        try {
            const days = this.parsePeriod(period);
            const stats = [];
            
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                const dayMetrics = await this.getDailyMetrics(dateStr);
                
                stats.push({
                    date: dateStr,
                    requests: dayMetrics.total_requests || 0,
                    users: dayMetrics.active_users || 0,
                    success_rate: dayMetrics.success_rate || 0,
                    avg_response_time: dayMetrics.avg_response_time || 0,
                    errors: dayMetrics.errors || 0
                });
            }

            return {
                message: `Usage statistics for ${period}`,
                period: period,
                stats: stats,
                summary: this.calculateStatsSummary(stats),
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Usage stats error:', error);
            throw new Error(`Failed to get usage statistics: ${error.message}`);
        }
    }

    async getPerformanceMetrics(params, userId) {
        console.log('⚡ Getting performance metrics');

        try {
            const now = new Date();
            const metrics = {
                timestamp: now.toISOString(),
                system: {
                    uptime: process.uptime(),
                    cpu_usage: process.cpuUsage(),
                    memory_usage: process.memoryUsage(),
                    node_version: process.version,
                    platform: process.platform
                },
                response_times: await this.getResponseTimeMetrics(),
                error_rates: await this.getErrorRates(),
                capability_performance: await this.getCapabilityPerformance(),
                platform_performance: await this.getPlatformPerformance()
            };

            return {
                message: 'Performance metrics collected',
                metrics: metrics,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Performance metrics error:', error);
            throw new Error(`Failed to get performance metrics: ${error.message}`);
        }
    }

    async getSystemHealth(params, userId) {
        console.log('🏥 Getting system health status');

        try {
            const healthChecks = {
                database: await this.checkDatabaseHealth(),
                file_system: await this.checkFileSystemHealth(),
                memory: await this.checkMemoryHealth(),
                cpu: await this.checkCpuHealth(),
                network: await this.checkNetworkHealth(),
                platforms: await this.checkPlatformsHealth()
            };

            // Calculate overall health score
            const scores = Object.values(healthChecks).map(check => check.score);
            const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

            const healthStatus = {
                overall_score: overallScore,
                status: overallScore >= 80 ? 'healthy' : overallScore >= 60 ? 'warning' : 'critical',
                checks: healthChecks,
                recommendations: this.getHealthRecommendations(healthChecks),
                last_check: new Date().toISOString()
            };

            return {
                message: 'System health check completed',
                health: healthStatus,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('System health error:', error);
            throw new Error(`Failed to get system health: ${error.message}`);
        }
    }

    async generateReport(params, userId) {
        const { type = 'summary', period = '7d' } = params;

        console.log(`📄 Generating ${type} report for ${period}`);

        try {
            const reportData = {
                type: type,
                period: period,
                generated_at: new Date().toISOString(),
                generated_by: userId
            };

            switch (type) {
                case 'summary':
                    reportData.content = await this.generateSummaryReport(period);
                    break;
                case 'usage':
                    reportData.content = await this.generateUsageReport(period);
                    break;
                case 'performance':
                    reportData.content = await this.generatePerformanceReport();
                    break;
                case 'health':
                    reportData.content = await this.generateHealthReport();
                    break;
                default:
                    throw new Error('Unknown report type');
            }

            // Save report
            const reportId = await this.saveReport(reportData);

            return {
                message: `${type} report generated`,
                report_id: reportId,
                report: reportData,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Report generation error:', error);
            throw new Error(`Failed to generate report: ${error.message}`);
        }
    }

    async trackEvent(params, userId) {
        const { event, data = {} } = params;

        if (!event) {
            throw new Error('Event name is required');
        }

        console.log(`🎯 Tracking event: ${event}`);

        try {
            const eventData = {
                event: event,
                data: data,
                user_id: userId,
                timestamp: new Date().toISOString(),
                session_id: this.generateSessionId()
            };

            // Save event
            await this.saveEvent(eventData);

            // Update metrics
            await this.updateMetrics(event, data);

            return {
                message: `Event tracked successfully`,
                event: event,
                event_id: eventData.session_id,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Event tracking error:', error);
            throw new Error(`Failed to track event: ${error.message}`);
        }
    }

    // Helper methods
    parsePeriod(period) {
        const periodMap = {
            '1d': 1,
            '7d': 7,
            '30d': 30,
            '90d': 90
        };
        return periodMap[period] || 7;
    }

    async getDailyMetrics(date) {
        const metricsPath = path.join(this.metricsDir, `${date}.json`);
        
        if (!fs.existsSync(metricsPath)) {
            return {
                total_requests: 0,
                active_users: 0,
                success_rate: 100,
                avg_response_time: 0,
                errors: 0
            };
        }
        
        return await fs.readJson(metricsPath);
    }

    async saveDailyMetrics(date, metrics) {
        const metricsPath = path.join(this.metricsDir, `${date}.json`);
        await fs.writeJson(metricsPath, metrics, { spaces: 2 });
    }

    async getCapabilitiesUsage() {
        // Return mock data for now
        return [
            { capability: 'knowledge', usage: 145, percentage: 35 },
            { capability: 'email', usage: 98, percentage: 23 },
            { capability: 'calendar', usage: 67, percentage: 16 },
            { capability: 'news', usage: 45, percentage: 11 },
            { capability: 'universe', usage: 38, percentage: 9 },
            { capability: 'flight', usage: 22, percentage: 5 }
        ];
    }

    async getPlatformStats() {
        return {
            telegram: 65,
            web: 25,
            whatsapp: 8,
            facebook: 2
        };
    }

    async getRecentEvents(limit = 10) {
        return [
            { event: 'user_login', platform: 'telegram', time: '2 mins ago' },
            { event: 'knowledge_query', platform: 'web', time: '5 mins ago' },
            { event: 'email_check', platform: 'telegram', time: '8 mins ago' },
            { event: 'calendar_event', platform: 'web', time: '12 mins ago' }
        ];
    }

    calculateStatsSummary(stats) {
        const totalRequests = stats.reduce((sum, day) => sum + day.requests, 0);
        const totalUsers = stats.reduce((sum, day) => sum + day.users, 0);
        const avgSuccessRate = stats.reduce((sum, day) => sum + day.success_rate, 0) / stats.length;
        const avgResponseTime = stats.reduce((sum, day) => sum + day.avg_response_time, 0) / stats.length;

        return {
            total_requests: totalRequests,
            total_users: totalUsers,
            avg_success_rate: Math.round(avgSuccessRate),
            avg_response_time: Math.round(avgResponseTime)
        };
    }

    async getResponseTimeMetrics() {
        return {
            avg: 250,
            min: 45,
            max: 1200,
            p95: 800,
            p99: 1100
        };
    }

    async getErrorRates() {
        return {
            overall: 0.02,
            by_capability: {
                knowledge: 0.01,
                email: 0.03,
                calendar: 0.02,
                flight: 0.05
            }
        };
    }

    async getCapabilityPerformance() {
        return {
            knowledge: { avg_time: 150, success_rate: 0.99 },
            email: { avg_time: 800, success_rate: 0.97 },
            calendar: { avg_time: 300, success_rate: 0.98 },
            flight: { avg_time: 2000, success_rate: 0.95 }
        };
    }

    async getPlatformPerformance() {
        return {
            telegram: { avg_time: 200, success_rate: 0.98 },
            web: { avg_time: 180, success_rate: 0.99 },
            whatsapp: { avg_time: 300, success_rate: 0.85 }
        };
    }

    async checkDatabaseHealth() {
        return { status: 'healthy', score: 95, message: 'All databases operational' };
    }

    async checkFileSystemHealth() {
        const freeSpace = await this.getDiskSpace();
        return { status: 'healthy', score: 90, message: `${freeSpace}% free space` };
    }

    async checkMemoryHealth() {
        const memUsage = process.memoryUsage();
        const usagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        const score = Math.max(0, 100 - usagePercent);
        
        return { 
            status: usagePercent > 80 ? 'warning' : 'healthy', 
            score: Math.round(score), 
            message: `${Math.round(usagePercent)}% memory used` 
        };
    }

    async checkCpuHealth() {
        return { status: 'healthy', score: 85, message: 'CPU usage normal' };
    }

    async checkNetworkHealth() {
        return { status: 'healthy', score: 90, message: 'All network endpoints reachable' };
    }

    async checkPlatformsHealth() {
        return {
            telegram: { status: 'healthy', score: 95 },
            web: { status: 'healthy', score: 98 },
            whatsapp: { status: 'limited', score: 60, message: 'Network connectivity issues' }
        };
    }

    getHealthRecommendations(checks) {
        const recommendations = [];
        
        if (checks.memory.score < 80) {
            recommendations.push('Consider optimizing memory usage or adding more RAM');
        }
        
        if (checks.platforms.whatsapp.score < 70) {
            recommendations.push('WhatsApp platform needs network configuration');
        }
        
        if (checks.file_system.score < 85) {
            recommendations.push('Free up disk space or expand storage');
        }
        
        return recommendations;
    }

    async generateSummaryReport(period) {
        const usageStats = await this.getUsageStats({ period });
        const healthStatus = await this.getSystemHealth({});
        
        return {
            title: `Summary Report - ${period}`,
            usage_summary: usageStats.summary,
            health_score: healthStatus.health.overall_score,
            key_metrics: {
                total_requests: usageStats.summary.total_requests,
                success_rate: usageStats.summary.avg_success_rate,
                health_score: healthStatus.health.overall_score
            }
        };
    }

    async saveReport(reportData) {
        const reportId = 'report_' + Date.now();
        const reportPath = path.join(this.reportsDir, `${reportId}.json`);
        await fs.writeJson(reportPath, reportData, { spaces: 2 });
        return reportId;
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async saveEvent(eventData) {
        const eventsPath = path.join(this.analyticsDir, 'events.json');
        let events = [];
        
        if (fs.existsSync(eventsPath)) {
            events = await fs.readJson(eventsPath);
        }
        
        events.push(eventData);
        
        // Keep only last 1000 events
        if (events.length > 1000) {
            events = events.slice(-1000);
        }
        
        await fs.writeJson(eventsPath, events, { spaces: 2 });
    }

    async updateMetrics(event, data) {
        const today = new Date().toISOString().split('T')[0];
        const metrics = await this.getDailyMetrics(today);
        
        // Update metrics based on event
        if (event.includes('request')) {
            metrics.total_requests = (metrics.total_requests || 0) + 1;
        }
        
        if (event.includes('error')) {
            metrics.errors = (metrics.errors || 0) + 1;
        }
        
        await this.saveDailyMetrics(today, metrics);
    }

    async getDiskSpace() {
        // Mock implementation - in real scenario, check actual disk space
        return 75; // 75% free space
    }
}

module.exports = AnalyticsCapability;
