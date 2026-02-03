module.exports = {
    id: 'camera_monitoring',
    name: 'Camera Monitoring Workflow',
    description: 'Continuous camera monitoring with motion detection',
    version: '1.0.0',
    enabled: true,
    priority: 'high',
    type: 'surveillance',
    
    // Schedule configuration
    schedule: '*/5 * * * *', // Every 5 minutes
    timezone: 'Asia/Yangon',
    
    // Timeout and retry configuration
    timeout: 60000,
    retry: 3,
    maxRetries: 3,
    retryDelay: 1000,
    
    // Step definitions
    steps: [
        {
            name: 'check_camera_status',
            action: 'get_camera_status',
            timeout: 10000,
            retry: 3,
            dependencies: [],
            conditions: [
                {
                    name: 'system_healthy',
                    check: 'health_check',
                    operator: 'equals',
                    value: true
                }
            ],
            config: {
                checkAllCameras: true,
                verifyConnection: true
            }
        },
        {
            name: 'capture_photo',
            action: 'take_photo',
            timeout: 30000,
            retry: 3,
            dependencies: [
                {
                    name: 'camera_available',
                    check: 'check_camera_status',
                    operator: 'equals',
                    value: true
                }
            ],
            conditions: [
                {
                    name: 'not_recording',
                    check: 'recording_status',
                    operator: 'equals',
                    value: false
                },
                {
                    name: 'sufficient_storage',
                    check: 'storage_check',
                    operator: 'greater_than',
                    value: 104857600 // 100MB
                }
            ],
            config: {
                quality: 'high',
                resolution: '1280x720',
                format: 'jpeg',
                autoSave: true
            }
        },
        {
            name: 'analyze_image',
            action: 'analyze_image',
            timeout: 15000,
            retry: 2,
            dependencies: [
                {
                    name: 'photo_captured',
                    check: 'photo_status',
                    operator: 'equals',
                    value: 'success'
                }
            ],
            conditions: [],
            config: {
                detectMotion: true,
                detectFaces: true,
                detectObjects: true,
                generateThumbnail: true
            }
        },
        {
            name: 'store_result',
            action: 'store_capture',
            timeout: 5000,
            retry: 1,
            dependencies: [
                {
                    name: 'analysis_completed',
                    check: 'analysis_status',
                    operator: 'equals',
                    value: 'completed'
                }
            ],
            conditions: [],
            config: {
                location: './data/surveillance/captures',
                organizeByDate: true,
                compressImages: true
            }
        },
        {
            name: 'notify_user',
            action: 'send_notification',
            timeout: 5000,
            retry: 2,
            dependencies: [
                {
                    name: 'result_stored',
                    check: 'storage_status',
                    operator: 'equals',
                    value: 'success'
                }
            ],
            conditions: [
                {
                    name: 'motion_detected',
                    check: 'motion_detected',
                    operator: 'equals',
                    value: true
                }
            ],
            config: {
                platforms: ['telegram', 'viber'],
                includePhoto: true,
                messageTemplate: 'Motion detected at {timestamp}',
                priority: 'high'
            }
        }
    ],
    
    // Conditions
    conditions: [
        {
            name: 'system_healthy',
            type: 'system_check',
            check: 'health_check',
            operator: 'equals',
            value: true,
            description: 'System must be healthy'
        },
        {
            name: 'camera_available',
            type: 'camera_check',
            check: 'check_camera_status',
            operator: 'equals',
            value: true,
            description: 'Camera must be available'
        },
        {
            name: 'not_recording',
            type: 'recording_check',
            check: 'recording_status',
            operator: 'equals',
            value: false,
            description: 'Camera must not be recording'
        },
        {
            name: 'sufficient_storage',
            type: 'storage_check',
            check: 'storage_check',
            operator: 'greater_than',
            value: 104857600,
            description: 'Must have at least 100MB storage available'
        },
        {
            name: 'photo_captured',
            type: 'step_result',
            check: 'photo_status',
            operator: 'equals',
            value: 'success',
            description: 'Photo must be captured successfully'
        },
        {
            name: 'analysis_completed',
            type: 'step_result',
            check: 'analysis_status',
            operator: 'equals',
            value: 'completed',
            description: 'Image analysis must be completed'
        },
        {
            name: 'result_stored',
            type: 'step_result',
            check: 'storage_status',
            operator: 'equals',
            value: 'success',
            description: 'Result must be stored successfully'
        },
        {
            name: 'motion_detected',
            type: 'analysis_result',
            check: 'motion_detected',
            operator: 'equals',
            value: true,
            description: 'Motion must be detected to trigger notification'
        }
    ],
    
    // Triggers
    triggers: [
        {
            type: 'scheduled',
            action: 'camera_monitoring',
            schedule: '*/5 * * * *',
            enabled: true,
            description: 'Run every 5 minutes'
        },
        {
            type: 'motion_detected',
            action: 'start_recording',
            enabled: true,
            conditions: ['camera_available', 'not_recording'],
            description: 'Start recording when motion is detected'
        },
        {
            type: 'security_alert',
            action: 'emergency_response',
            enabled: true,
            conditions: ['system_healthy'],
            description: 'Trigger emergency response for security alerts'
        }
    ],
    
    // Error handling
    errorHandling: {
        retry: true,
        fallback: 'virtual_security',
        maxRetries: 3,
        retryDelay: 1000,
        onError: [
            {
                step: 'check_camera_status',
                action: 'use_virtual_camera',
                condition: 'camera_unavailable'
            },
            {
                step: 'capture_photo',
                action: 'use_last_photo',
                condition: 'capture_failed'
            },
            {
                step: 'analyze_image',
                action: 'skip_analysis',
                condition: 'analysis_failed'
            }
        ]
    },
    
    // Notifications
    notifications: {
        onSuccess: {
            message: 'Camera monitoring completed successfully',
            platforms: ['system'],
            priority: 'low'
        },
        onError: {
            message: 'Camera monitoring failed, using fallback',
            platforms: ['telegram', 'viber'],
            priority: 'high'
        },
        onMotionDetected: {
            message: 'Motion detected - Security alert',
            platforms: ['telegram', 'viber'],
            priority: 'high',
            includePhoto: true
        },
        onCameraOffline: {
            message: 'Camera offline - Check connection',
            platforms: ['telegram', 'viber'],
            priority: 'medium'
        }
    },
    
    // Metrics and monitoring
    metrics: {
        trackExecutionTime: true,
        trackSuccessRate: true,
        trackErrorRate: true,
        trackResourceUsage: true
    },
    
    // Performance settings
    performance: {
        parallelSteps: false,
        cacheResults: true,
        cacheDuration: 300000, // 5 minutes
        optimizeForSpeed: true
    },
    
    // Security settings
    security: {
        validateInputs: true,
        sanitizeOutputs: true,
        encryptSensitiveData: true,
        auditLog: true
    },
    
    // Integration settings
    integrations: {
        telegram: {
            enabled: true,
            sendPhotos: true,
            sendAlerts: true,
            botToken: process.env.TELEGRAM_BOT_TOKEN
        },
        viber: {
            enabled: true,
            sendPhotos: true,
            sendAlerts: true,
            apiToken: process.env.VIBER_API_TOKEN
        },
        email: {
            enabled: true,
            sendReports: true,
            sendAlerts: true,
            smtp: {
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        }
    }
};
