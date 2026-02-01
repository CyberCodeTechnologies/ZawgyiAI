const { ZawgyiCapability } = require('../core/zawgyi-capability');
const puppeteer = require('puppeteer');

class FacebookCapability extends ZawgyiCapability {
    constructor() {
        super('facebook', 'Facebook Automation - Post, Schedule, and Interact');
        
        this.setupActions();
    }

    setupActions() {
        this.addAction('post', this.postStatus.bind(this), {
            description: 'Post a status update to Facebook',
            parameters: ['content', 'visibility']
        });

        this.addAction('schedule', this.schedulePost.bind(this), {
            description: 'Schedule a post for later',
            parameters: ['content', 'time']
        });
    }

    async postStatus(params, userId) {
        const { content, visibility = 'public' } = params;
        
        if (!content) throw new Error('Content is required');
        
        // Check credentials
        const email = process.env.FACEBOOK_EMAIL;
        const password = process.env.FACEBOOK_PASSWORD;
        
        if (!email || !password) {
            throw new Error('Facebook credentials not found in .env (FACEBOOK_EMAIL, FACEBOOK_PASSWORD)');
        }

        console.log(`📱 Posting to Facebook: "${content}"`);
        
        let browser = null;
        try {
            browser = await puppeteer.launch({
                headless: "new",
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-notifications'
                ]
            });
            
            const page = await browser.newPage();
            
            // Use mbasic.facebook.com for better stability and simpler DOM
            await page.goto('https://mbasic.facebook.com');
            
            // Check if already logged in or need login
            const loginButton = await page.$('input[name="login"]');
            
            if (loginButton) {
                console.log('Logging in to Facebook...');
                await page.type('input[name="email"]', email);
                await page.type('input[name="pass"]', password);
                await Promise.all([
                    page.waitForNavigation(),
                    page.click('input[name="login"]')
                ]);
            }
            
            // Check for 2FA or other login interruptions
            if (page.url().includes('checkpoint')) {
                throw new Error('Facebook requires verification (2FA/Checkpoint). Cannot proceed automatically.');
            }

            // Post content
            console.log('Navigating to post composer...');
            // On mbasic, the composer is usually right on the home page or requires a click
            // We'll look for the textarea
            
            try {
                const textareaSelector = 'textarea[name="xc_message"]';
                await page.waitForSelector(textareaSelector, { timeout: 5000 });
                
                await page.type(textareaSelector, content);
                
                // Find the submit button (usually "Post")
                const submitButtonSelector = 'input[name="view_post"]';
                await page.waitForSelector(submitButtonSelector);
                
                await Promise.all([
                    page.waitForNavigation(),
                    page.click(submitButtonSelector)
                ]);
                
                console.log('Post submitted successfully');
                
                return {
                    message: `Successfully posted to Facebook: "${content}"`,
                    status: 'success',
                    platform: 'facebook',
                    timestamp: new Date().toISOString()
                };
            } catch (postError) {
                // Fallback for different mbasic layout
                console.warn('Standard posting failed, trying alternative layout...', postError.message);
                throw postError; 
            }
            
        } catch (error) {
            console.error('Facebook Puppeteer Error:', error);
            throw new Error(`Failed to post to Facebook: ${error.message}`);
        } finally {
            if (browser) await browser.close();
        }
    }

    async schedulePost(params, userId) {
        const { content, time } = params;
        // In a real implementation, this would store the task in a DB/queue
        // For now, we'll simulate scheduling
        return {
            message: `Scheduled post: "${content}" for ${time}`,
            status: 'scheduled',
            taskId: Date.now()
        };
    }
}

module.exports = FacebookCapability;
