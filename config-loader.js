// config-loader.js
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

let selectors = {};
try {
    selectors = require('./selectors.json');
} catch (error) {
    console.warn("Warning: selectors.json not found or invalid. Using default selectors.");
    selectors = { // Default selectors if selectors.json is missing or invalid
        onOffStatusSelector: '#status-indicator',
        lastLoginTimeSelector: '//div[@class="last-login"]',
        signalStrengthSelector: '.signal-bar',
        batteryLevelSelector: '#battery-percent'
    };
}

module.exports = {
    websiteBaseUrl: process.env.WEBSITE_BASE_URL || 'https://your-poc-website.com',
    loginUrlPath: process.env.LOGIN_URL_PATH || '/login',
    statusPagePath: process.env.STATUS_PAGE_PATH || '/radio_status',
    credentials: {
        username: process.env.SCRAPE_USERNAME,
        password: process.env.SCRAPE_PASSWORD
    },
    selectors: selectors,
    alertConfig: {
        enabled: process.env.ALERT_ENABLED === 'true',
        failureThreshold: parseInt(process.env.ALERT_FAILURE_THRESHOLD) || 3,
        smtpConfig: {
            service: process.env.SMTP_SERVICE,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        },
        recipients: process.env.ALERT_RECIPIENTS ? process.env.ALERT_RECIPIENTS.split(',') : [],
        dataAlerts: { // NEW SECTION for data-driven alerts
            signalStrengthLow: {
                enabled: process.env.SIGNAL_ALERT_ENABLED === 'true',
                threshold: parseInt(process.env.SIGNAL_ALERT_THRESHOLD) || -95 // dBm, example threshold
            },
            batteryLevelLow: {
                enabled: process.env.BATTERY_ALERT_ENABLED === 'true',
                threshold: parseInt(process.env.BATTERY_ALERT_THRESHOLD) || 10 // %, example threshold
            }
            // You can add more data-driven alerts here (e.g., status change alert)
        }
    },
    thresholds: {
        signalStrength: parseInt(process.env.MIN_SIGNAL) || -80, // dBm (still used for validation)
        batteryLevel: parseInt(process.env.MIN_BATTERY) || 20     // Percentage (still used for validation)
    },
    maxRetries: parseInt(process.env.MAX_RETRIES) || 5,
    initialRetryDelayMilliseconds: parseInt(process.env.INITIAL_RETRY_DELAY) || 5000,
    maxRetryDelayMilliseconds: parseInt(process.env.MAX_RETRY_DELAY) || 60000,
    retryDelayBackoffFactor: parseFloat(process.env.RETRY_BACKOFF_FACTOR) || 2,
    requestTimeoutMilliseconds: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
    navigationTimeoutMilliseconds: parseInt(process.env.NAVIGATION_TIMEOUT) || 60000,
    userAgentString: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    logFilenamePrefix: process.env.LOG_FILENAME_PREFIX || 'scrape-log-v3',
    htmlFilenamePrefix: process.env.HTML_FILENAME_PREFIX || 'html-response-v3',
    browserLaunchOptions: {
        headless: process.env.HEADLESS_BROWSER === 'false' ? false : 'new', // Set HEADLESS_BROWSER=false in .env for non-headless
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
        ],
    },
    scrapeIntervalMilliseconds: parseInt(process.env.SCRAPE_INTERVAL) || 60000,
};
