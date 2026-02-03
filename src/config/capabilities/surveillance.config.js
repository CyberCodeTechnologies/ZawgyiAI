module.exports = {
    name: 'surveillance',
    version: '2.0.0',
    description: 'System surveillance and monitoring',
    enabled: true,
    priority: 'high',
    dependencies: [],
    
    // Actions
    actions: [
        'take_photo',
        'take_screenshot',
        'start_recording',
        'stop_recording',
        'detect_cameras',
        'get_recording_status',
        'get_camera_status'
    ],
    
    // Workflows
    workflows: [
        'camera_monitoring',
        'security_patrol',
        'motion_detection',
        'night_patrol',
        'emergency_response',
        'continuous_surveillance'
    ],
    
    // Settings
    settings: {
        cameraResolution: '1280x720',
        recordingFormat: 'webm',
        autoSave: true,
        maxRecordingDuration: 3600,
        motionDetection: true,
        nightVision: true,
        alertOnMotion: true,
        photoQuality: 'high',
        screenshotInterval: 30,
        recordingFramerate: 30,
        storageLocation: './data/surveillance',
        maxStorageSize: 1024 * 1024 * 1024, // 1GB
        compressionEnabled: true
    },
    
    // Triggers
    triggers: [
        {
            type: 'motion_detected',
            action: 'start_recording',
            conditions: ['camera_available', 'not_recording']
        },
        {
            type: 'time_based',
            action: 'night_patrol',
            schedule: '0 23 * * *',
            conditions: ['system_healthy']
        },
        {
            type: 'alert_condition',
            action: 'emergency_response',
            conditions: ['camera_available', 'system_healthy']
        },
        {
            type: 'scheduled',
            action: 'camera_monitoring',
            schedule: '*/5 * * * *',
            conditions: ['system_healthy']
        }
    ],
    
    // Conditions
    conditions: [
        {
            name: 'camera_available',
            check: 'check_camera_status',
            operator: 'equals',
            value: true
        },
        {
            name: 'system_healthy',
            check: 'health_check',
            operator: 'equals',
            value: true
        },
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
            value: 100 * 1024 * 1024 // 100MB
        }
    ],
    
    // Workflow configurations
    workflows_config: {
        camera_monitoring: {
            id: 'camera_monitoring',
            name: 'Camera Monitoring Workflow',
            description: 'Continuous camera monitoring with motion detection',
            version: '1.0.0',
            enabled: true,
            priority: 'high',
            schedule: '*/5 * * * *',
            timeout: 60000,
            retry: 3,
            
            steps: [
                {
                    name: 'check_camera_status',
                    action: 'get_camera_status',
                    timeout: 10000,
                    retry: 3,
                    conditions: ['system_healthy']
                },
                {
                    name: 'capture_photo',
                    action: 'take_photo',
                    timeout: 30000,
                    retry: 3,
                    conditions: ['camera_available', 'not_recording']
                },
                {
                    name: 'analyze_image',
                    action: 'analyze_image',
                    timeout: 15000,
                    retry: 2
                },
                {
                    name: 'store_result',
                    action: 'store_capture',
                    timeout: 5000,
                    retry: 1
                },
                {
                    name: 'notify_user',
                    action: 'send_notification',
                    timeout: 5000,
                    retry: 2,
                    conditions: ['motion_detected']
                }
            ]
        },
        
        security_patrol: {
            id: 'security_patrol',
            name: 'Security Patrol Workflow',
            description: 'Automated security patrol with multiple camera checks',
            version: '1.0.0',
            enabled: true,
            priority: 'medium',
            schedule: '0 */2 * * *',
            timeout: 120000,
            retry: 2,
            
            steps: [
                {
                    name: 'check_all_cameras',
                    action: 'detect_cameras',
                    timeout: 15000,
                    retry: 2
                },
                {
                    name: 'capture_all_photos',
                    action: 'take_photo',
                    timeout: 45000,
                    retry: 2,
                    conditions: ['cameras_available']
                },
                {
                    name: 'analyze_security',
                    action: 'analyze_security',
                    timeout: 30000,
                    retry: 1
                },
                {
                    name: 'generate_report',
                    action: 'generate_patrol_report',
                    timeout: 10000,
                    retry: 1
                },
                {
                    name: 'send_report',
                    action: 'send_notification',
                    timeout: 5000,
                    retry: 2
                }
            ]
        },
        
        motion_detection: {
            id: 'motion_detection',
            name: 'Motion Detection Workflow',
            description: 'Real-time motion detection and alerting',
            version: '1.0.0',
            enabled: true,
            priority: 'high',
            timeout: 30000,
            retry: 3,
            
            triggers: [
                {
                    type: 'motion_detected',
                    action: 'start_recording',
                    conditions: ['camera_available', 'not_recording']
                }
            ],
            
            steps: [
                {
                    name: 'detect_motion',
                    action: 'detect_motion',
                    timeout: 10000,
                    retry: 3,
                    conditions: ['camera_available']
                },
                {
                    name: 'start_recording',
                    action: 'start_recording',
                    timeout: 5000,
                    retry: 2,
                    conditions: ['motion_detected', 'not_recording']
                },
                {
                    name: 'send_alert',
                    action: 'send_notification',
                    timeout: 5000,
                    retry: 2,
                    conditions: ['motion_detected']
                }
            ]
        },
        
        night_patrol: {
            id: 'night_patrol',
            name: 'Night Patrol Workflow',
            description: 'Automated night surveillance patrol',
            version: '1.0.0',
            enabled: true,
            priority: 'medium',
            schedule: '0 23 * * *',
            timeout: 180000,
            retry: 2,
            
            steps: [
                {
                    name: 'enable_night_vision',
                    action: 'enable_night_vision',
                    timeout: 5000,
                    retry: 2
                },
                {
                    name: 'patrol_cameras',
                    action: 'security_patrol',
                    timeout: 120000,
                    retry: 2
                },
                {
                    name: 'disable_night_vision',
                    action: 'disable_night_vision',
                    timeout: 5000,
                    retry: 2
                }
            ]
        },
        
        emergency_response: {
            id: 'emergency_response',
            name: 'Emergency Response Workflow',
            description: 'Emergency response protocol for security alerts',
            version: '1.0.0',
            enabled: true,
            priority: 'critical',
            timeout: 60000,
            retry: 1,
            
            triggers: [
                {
                    type: 'security_alert',
                    action: 'emergency_response',
                    conditions: ['system_healthy']
                }
            ],
            
            steps: [
                {
                    name: 'start_continuous_recording',
                    action: 'start_recording',
                    timeout: 5000,
                    retry: 1,
                    conditions: ['camera_available']
                },
                {
                    name: 'capture_emergency_photos',
                    action: 'take_photo',
                    timeout: 15000,
                    retry: 1,
                    conditions: ['camera_available']
                },
                {
                    name: 'send_emergency_alert',
                    action: 'send_emergency_notification',
                    timeout: 5000,
                    retry: 3
                },
                {
                    name: 'log_emergency',
                    action: 'log_emergency_event',
                    timeout: 5000,
                    retry: 1
                }
            ]
        },
        
        continuous_surveillance: {
            id: 'continuous_surveillance',
            name: 'Continuous Surveillance Workflow',
            description: '24/7 continuous surveillance monitoring',
            version: '1.0.0',
            enabled: true,
            priority: 'high',
            schedule: '*/1 * * * *',
            timeout: 30000,
            retry: 2,
            
            steps: [
                {
                    name: 'health_check',
                    action: 'get_camera_status',
                    timeout: 5000,
                    retry: 2
                },
                {
                    name: 'monitor_activity',
                    action: 'monitor_activity',
                    timeout: 20000,
                    retry: 1,
                    conditions: ['camera_available']
                },
                {
                    name: 'update_status',
                    action: 'update_surveillance_status',
                    timeout: 5000,
                    retry: 1
                }
            ]
        }
    },
    
    // Error handling
    errorHandling: {
        retry: true,
        fallback: 'virtual_security',
        maxRetries: 3,
        retryDelay: 1000
    },
    
    // Notifications
    notifications: {
        success: 'Surveillance operation completed successfully',
        error: 'Surveillance operation failed, using fallback',
        motion_detected: 'Motion detected - Security alert',
        recording_started: 'Recording started',
        recording_stopped: 'Recording stopped',
        camera_offline: 'Camera offline - Check connection',
        storage_full: 'Storage full - Clean up required'
    },
    
    // Integration settings
    integrations: {
        telegram: {
            enabled: true,
            sendPhotos: true,
            sendAlerts: true
        },
        viber: {
            enabled: true,
            sendPhotos: true,
            sendAlerts: true
        },
        email: {
            enabled: true,
            sendReports: true,
            sendAlerts: true
        }
    }
};
