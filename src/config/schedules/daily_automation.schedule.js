module.exports = {
    name: 'daily_automation',
    description: 'Daily automation tasks for ZawgyiAI system',
    version: '1.0.0',
    enabled: true,
    priority: 'medium',
    type: 'system',
    
    // Schedule configuration
    schedule: '0 8 * * * *', // Every day at 8:00 AM
    timezone: 'Asia/Yangon',
    
    // Workflow execution settings
    workflows: [
        'system_health_check',
        'data_collection',
        'report_generation',
        'maintenance_tasks',
        'security_patrol',
        'backup_operations'
    ],
    
    // Execution order and dependencies
    executionOrder: [
        'system_health_check',
        'security_patrol',
        'data_collection',
        'backup_operations',
        'report_generation',
        'maintenance_tasks'
    ],
    
    // Workflow configurations
    workflowConfigs: {
        system_health_check: {
            enabled: true,
            timeout: 60000,
            retry: 2,
            params: {
                comprehensive: true,
                checkAllCapabilities: true,
                generateReport: true
            }
        },
        data_collection: {
            enabled: true,
            timeout: 300000,
            retry: 1,
            params: {
                collectMetrics: true,
                collectLogs: true,
                collectUserActivity: true,
                dateRange: 'last_24_hours'
            }
        },
        report_generation: {
            enabled: true,
            timeout: 120000,
            retry: 2,
            params: {
                includeCharts: true,
                includeMetrics: true,
                format: 'pdf',
                recipients: ['admin', 'system']
            }
        },
        maintenance_tasks: {
            enabled: true,
            timeout: 180000,
            retry: 1,
            params: {
                cleanupLogs: true,
                optimizeDatabase: true,
                updateCache: true,
                checkUpdates: true
            }
        },
        security_patrol: {
            enabled: true,
            timeout: 300000,
            retry: 2,
            params: {
                checkAllCameras: true,
                scanForThreats: true,
                generateSecurityReport: true
            }
        },
        backup_operations: {
            enabled: true,
            timeout: 600000,
            retry: 1,
            params: {
                backupDatabase: true,
                backupConfig: true,
                backupUserData: true,
                compression: true
            }
        }
    },
    
    // Dependencies between workflows
    dependencies: {
        data_collection: ['system_health_check'],
        report_generation: ['data_collection'],
        maintenance_tasks: ['system_health_check'],
        backup_operations: ['system_health_check'],
        security_patrol: ['system_health_check']
    },
    
    // Conditions for execution
    conditions: [
        {
            name: 'system_healthy',
            check: 'health_check',
            operator: 'equals',
            value: true,
            required: true
        },
        {
            name: 'sufficient_resources',
            check: 'resource_check',
            operator: 'greater_than',
            value: 20,
            required: true
        },
        {
            name: 'no_active_conflicts',
            check: 'conflict_check',
            operator: 'equals',
            value: false,
            required: true
        }
    ],
    
    // Error handling
    errorHandling: {
        retry: true,
        maxRetries: 2,
        retryDelay: 30000, // 30 seconds
        fallback: 'minimal_execution',
        onError: [
            {
                workflow: 'system_health_check',
                action: 'basic_health_check',
                condition: 'comprehensive_check_failed'
            },
            {
                workflow: 'data_collection',
                action: 'minimal_data_collection',
                condition: 'full_collection_failed'
            },
            {
                workflow: 'report_generation',
                action: 'simple_report',
                condition: 'full_report_failed'
            }
        ]
    },
    
    // Notifications
    notifications: {
        onStart: {
            message: 'Daily automation started',
            platforms: ['system'],
            priority: 'low'
        },
        onSuccess: {
            message: 'Daily automation completed successfully',
            platforms: ['telegram', 'email'],
            priority: 'medium',
            includeReport: true
        },
        onError: {
            message: 'Daily automation failed - Manual intervention required',
            platforms: ['telegram', 'viber', 'email'],
            priority: 'high',
            includeErrorDetails: true
        },
        onPartialFailure: {
            message: 'Some daily automation tasks failed',
            platforms: ['telegram'],
            priority: 'medium',
            includeFailedTasks: true
        }
    },
    
    // Performance settings
    performance: {
        parallelExecution: true,
        maxConcurrentWorkflows: 3,
        timeout: 1800000, // 30 minutes total timeout
        resourceLimits: {
            maxMemoryUsage: 512, // MB
            maxCpuUsage: 80, // percentage
            maxDiskUsage: 1024 // MB
        }
    },
    
    // Monitoring and metrics
    monitoring: {
        trackExecutionTime: true,
        trackResourceUsage: true,
        trackSuccessRate: true,
        generateDailyReport: true,
        alertOnFailure: true,
        alertOnHighResourceUsage: true
    },
    
    // Security settings
    security: {
        validateInputs: true,
        encryptSensitiveData: true,
        auditLog: true,
        requireAuthentication: false,
        allowedIPs: ['127.0.0.1', '::1']
    },
    
    // Backup and recovery
    backup: {
        createBackup: true,
        backupLocation: './data/backups/daily_automation',
        retentionPeriod: 30, // days
        compression: true,
        encryption: true
    },
    
    // Integration settings
    integrations: {
        telegram: {
            enabled: true,
            botToken: process.env.TELEGRAM_BOT_TOKEN,
            chatId: process.env.TELEGRAM_ADMIN_CHAT_ID
        },
        email: {
            enabled: true,
            smtp: {
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            recipients: [
                process.env.ADMIN_EMAIL,
                process.env.SYSTEM_EMAIL
            ]
        },
        viber: {
            enabled: true,
            apiToken: process.env.VIBER_API_TOKEN,
            recipients: ['admin_user', 'system_user']
        }
    },
    
    // Custom actions
    customActions: [
        {
            name: 'send_daily_summary',
            description: 'Send daily automation summary to administrators',
            workflow: 'report_generation',
            condition: 'completion_success',
            platforms: ['telegram', 'email']
        },
        {
            name: 'cleanup_old_backups',
            description: 'Clean up old backup files',
            workflow: 'maintenance_tasks',
            condition: 'backup_completed',
            platforms: ['system']
        },
        {
            name: 'update_system_status',
            description: 'Update system status dashboard',
            workflow: 'system_health_check',
            condition: 'health_check_success',
            platforms: ['system']
        }
    ],
    
    // Environment-specific settings
    environments: {
        development: {
            enabled: true,
            notifications: ['system'],
            timeout: 600000,
            retry: 3
        },
        production: {
            enabled: true,
            notifications: ['telegram', 'email'],
            timeout: 1800000,
            retry: 2
        },
        testing: {
            enabled: false,
            notifications: ['system'],
            timeout: 300000,
            retry: 1
        }
    },
    
    // Logging configuration
    logging: {
        level: 'info',
        format: 'json',
        file: './data/logs/daily_automation.log',
        maxSize: '100MB',
        maxFiles: 10,
        includeTimestamp: true,
        includeLevel: true,
        includeWorkflow: true
    }
};
