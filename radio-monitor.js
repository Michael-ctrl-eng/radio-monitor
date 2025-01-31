const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('node:fs/promises');
const path = require('path');
const process = require('process');
const sqlite3 = require('sqlite3').verbose();
const cheerio = require('cheerio');
const axios = require('axios');
const nodemailer = require('nodemailer');
const config = require('./config-loader');

// ----- CONFIGURATION FROM config-loader.js -----
const {
    websiteBaseUrl,
    loginUrlPath,
    statusPagePath,
    credentials,
    selectors,
    alertConfig,
    thresholds,
    maxRetries,
    initialRetryDelayMilliseconds,
    maxRetryDelayMilliseconds,
    retryDelayBackoffFactor,
    requestTimeoutMilliseconds,
    navigationTimeoutMilliseconds,
    userAgentString,
    logFilenamePrefix,
    htmlFilenamePrefix,
    browserLaunchOptions,
    scrapeIntervalMilliseconds,
} = config;

const fullLoginUrl = new URL(loginUrlPath, websiteBaseUrl).href;
const fullStatusPageUrl = new URL(statusPagePath, websiteBaseUrl).href;

// ----- GLOBAL VARIABLES -----
let consecutiveFailures = 0;
const failureResetInterval = 6 * 60 * 60 * 1000; // Reset failure count every 6 hours
let lastFailureResetTime = Date.now();
const resourceMonitor = new ResourceMonitor();
const performanceTracker = new PerformanceTracker();

// ----- HELPER FUNCTIONS -----
function validateOnOffStatus(statusText) {
    const validStatuses = ["Online", "Offline", "Active", "Inactive", "Idle", "Ready", "Error", "Unknown"];
    return validStatuses.includes(statusText) ? statusText : 'Invalid Status';
}

function validateLastLoginTime(loginTimeText) {
    const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    return dateTimeRegex.test(loginTimeText.trim()) ? loginTimeText : 'Invalid Time';
}

function validateSignal(strength) {
    const numericValue = parseInt(strength.replace('dBm', '').trim());
    return !isNaN(numericValue) && numericValue >= thresholds.signalStrength;
}

function validateBattery(level) {
    const numericValue = parseInt(level.replace('%', '').trim());
    return !isNaN(numericValue) && numericValue >= thresholds.batteryLevel;
}

function validateAllData(scrapeResult) {
    const validation = { // Renamed to validation object for clarity
        ...scrapeResult,
        signalValid: validateSignal(scrapeResult.signalStrength), // Still validate against MIN_SIGNAL for data quality
        batteryValid: validateBattery(scrapeResult.batteryLevel), // Still validate against MIN_BATTERY for data quality
        lastLoginTimeValid: validateLastLoginTime(scrapeResult.lastLoginTime),
        onOffStatusValid: validateOnOffStatus(scrapeResult.onOffStatus),
        signalAlertTrigger: false, // NEW: Flags for data-driven alerts
        batteryAlertTrigger: false
    };

    if (alertConfig.dataAlerts.signalStrengthLow.enabled) {
        const signalValue = parseInt(scrapeResult.signalStrength.replace('dBm', '').trim());
        if (!isNaN(signalValue) && signalValue < alertConfig.dataAlerts.signalStrengthLow.threshold) {
            validation.signalAlertTrigger = true;
        }
    }

    if (alertConfig.dataAlerts.batteryLevelLow.enabled) {
        const batteryValue = parseInt(scrapeResult.batteryLevel.replace('%', '').trim());
        if (!isNaN(batteryValue) && batteryValue < alertConfig.dataAlerts.batteryLevelLow.threshold) {
            validation.batteryAlertTrigger = true;
        }
    }

    return validation; // Return the validation object
}


async function storeScrapeResultInDB(scrapeResult) {
    const db = new sqlite3.Database('radio_status_v3.db');
    const timestamp = scrapeResult.timestamp;

    try {
        await new Promise((resolve, reject) => {
            db.run(`CREATE TABLE IF NOT EXISTS radio_status_log_v3 (
                timestamp TEXT PRIMARY KEY,
                onOffStatus TEXT,
                lastLoginTime TEXT,
                signalStrength TEXT,
                batteryLevel TEXT,
                scrape_success INTEGER,
                errors TEXT,
                signalValid INTEGER,
                batteryValid INTEGER,
                lastLoginTimeValid INTEGER,
                onOffStatusValid INTEGER
            )`, (err) => err ? reject(err) : resolve());
        });

        const validationResult = validateAllData(scrapeResult);

        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO radio_status_log_v3 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                scrapeResult.timestamp,
                scrapeResult.onOffStatus,
                scrapeResult.lastLoginTime,
                scrapeResult.signalStrength,
                scrapeResult.batteryLevel,
                scrapeResult.success ? 1 : 0,
                JSON.stringify(scrapeResult.errors),
                validationResult.signalValid ? 1 : 0,
                validationResult.batteryValid ? 1 : 0,
                validationResult.lastLoginTimeValid ? 1 : 0,
                validationResult.onOffStatusValid ? 1 : 0
            ], (err) => err ? reject(err) : resolve());
        });

    } catch (dbError) {
        console.error(`[DB ERROR] ${dbError.message}`);
        await fs.writeFile(
            path.join(__dirname, `${logFilenamePrefix}-db-error-${timestamp}.log`),
            `DB Error: ${dbError.message}\n${JSON.stringify(scrapeResult)}`
        );
    } finally {
        db.close();
    }
}

async function sendAlert(errorData) { // UPDATED - now accepts errorData object with alertType
    if (!alertConfig.enabled) return;
    if (alertConfig.recipients.length === 0) return;

    const transporter = nodemailer.createTransport(alertConfig.smtpConfig);
    let subject = `[CRITICAL] Radio Monitoring Alert`;
    let text = ``;

    if (errorData.alertType === 'Signal Strength Low') {
        subject = `[WARNING] Radio Signal Strength Low`;
        text = `Signal strength is below threshold!\nCurrent Signal Strength: ${errorData.signalStrength}\nThreshold: ${errorData.threshold} dBm\nTimestamp: ${new Date().toISOString()}`;
    } else if (errorData.alertType === 'Battery Level Low') {
        subject = `[WARNING] Radio Battery Level Low`;
        text = `Battery level is below threshold!\nCurrent Battery Level: ${errorData.batteryLevel}\nThreshold: ${errorData.threshold}%\nTimestamp: ${new Date().toISOString()}`;
    } else { // Default to scrape failure alert
        subject = `[CRITICAL] Radio Monitoring Failure Alert`;
        text = `Radio monitoring scrape failed consecutively ${consecutiveFailures} times.\nTimestamp: ${new Date().toISOString()}\nError Details:\n${JSON.stringify(errorData, null, 2)}`;
    }


    try {
        await transporter.sendMail({
            from: alertConfig.smtpConfig.auth.user,
            to: alertConfig.recipients,
            subject: subject, // Use dynamic subject
            text: text       // Use dynamic text
        });
        console.log("Alert email sent successfully to:", alertConfig.recipients.join(', '));
    } catch (emailError) {
        console.error("[EMAIL ERROR] Failed to send alert email:", emailError);
    }
}


async function robustPuppeteerAction(page, actionDescription, actionFunction, retryCount = 0, currentDelay = initialRetryDelayMilliseconds) {
    try {
        return await actionFunction(page);
    } catch (error) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const errorLog = `[${timestamp}] Action failed: ${actionDescription}\nError: ${error.message}`;

        await fs.writeFile(
            path.join(__dirname, `${logFilenamePrefix}-action-error-${timestamp}.log`),
            errorLog
        );

        if (retryCount < maxRetries) {
            const delay = Math.min(currentDelay * retryDelayBackoffFactor, maxRetryDelayMilliseconds);
            console.warn(`Retrying ${actionDescription} (attempt ${retryCount + 1}) in ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return robustPuppeteerAction(page, actionDescription, actionFunction, retryCount + 1, delay); // Corrected recursion
        }

        throw new Error(`Action failed after ${maxRetries} retries: ${actionDescription}`);
    }
}

async function configureBrowser(page) {
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
    });
    await page.setUserAgent(userAgentString);
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
}

async function handleSessionExpiry(page) {
    try {
        await page.waitForSelector('input[name="username"]', { timeout: 5000 }); // Selector for login form
        console.log('Session expired or login required - re-authenticating...');
        await performLogin(page); // Assuming performLogin is defined to handle login steps
        return true;
    } catch {
        return false;
    }
}

async function performLogin(page) {
    await robustPuppeteerAction(page, "Enter Credentials", async () => {
        await page.type('input[name="username"]', credentials.username, { delay: 100 });
        await page.type('input[name="password"]', credentials.password, { delay: 100 });
        await page.click('button[type="submit"]'); // Adjust selector as needed
    });
    await robustPuppeteerAction(page, "Post-Login Navigation after re-auth", async () => {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: navigationTimeoutMilliseconds });
        await page.waitForSelector('#dashboard', { timeout: 15000 }); // Example dashboard selector
    });
}


// ----- RESOURCE MONITOR CLASS -----
class ResourceMonitor {
    constructor() {
        this.memoryUsage = [];
        this.performanceMetrics = [];
        this.memoryCheckInterval = setInterval(() => this.trackMemory(), 5000);
    }

    trackMemory() {
        this.memoryUsage.push(process.memoryUsage());
        if (this.memoryUsage.length > 120) this.memoryUsage.shift(); // Keep last 10 minutes of data (at 5s interval)
        this.checkHealth();
    }

    checkHealth() {
        const lastMem = this.memoryUsage.slice(-1)[0];
        if (lastMem && lastMem.heapUsed > 600 * 1024 * 1024) { // 600MB threshold
            console.warn("[HEALTH WARNING] Memory usage high:", (lastMem.heapUsed / (1024 * 1024)).toFixed(2), "MB");
            // Optionally trigger a more aggressive cleanup or restart if necessary
        }
    }

    stopMonitoring() {
        clearInterval(this.memoryCheckInterval);
    }
}

// ----- PERFORMANCE TRACKER CLASS -----
class PerformanceTracker {
    constructor() {
        this.scrapeDurations = [];
    }

    recordScrapeDuration(startTime) {
        const duration = Date.now() - startTime;
        this.scrapeDurations.push(duration);
        if (this.scrapeDurations.length > 100) {
            this.scrapeDurations.shift();
        }
    }

    calculateAverageScrapeTime() {
        if (this.scrapeDurations.length === 0) return 0;
        return this.scrapeDurations.reduce((a, b) => a + b, 0) / this.scrapeDurations.length;
    }
}


// ----- MAIN SCRAPING FUNCTION -----
async function scrapeStatus() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let browser = null;
    const scrapeStartTime = Date.now();
    const scrapeResult = {
        timestamp,
        onOffStatus: 'Unknown',
        lastLoginTime: 'Unknown',
        signalStrength: 'N/A',
        batteryLevel: 'N/A',
        success: false,
        errors: []
    };

    try {
        browser = await puppeteer.launch(browserLaunchOptions);
        const page = await browser.newPage();
        await configureBrowser(page);
        await page.setDefaultNavigationTimeout(navigationTimeoutMilliseconds);
        await page.setDefaultTimeout(requestTimeoutMilliseconds);

        // Initial Login Sequence
        await robustPuppeteerAction(page, "Navigate to Login", async () => {
            await page.goto(fullLoginUrl, { waitUntil: 'networkidle2' });
        });

        await performLogin(page); // Initial login

        // Status page navigation
        await robustPuppeteerAction(page, "Navigate to Status Page", async () => {
            await page.goto(fullStatusPageUrl, { waitUntil: 'networkidle2' });
            await page.waitForSelector(selectors.onOffStatusSelector, { timeout: 15000 });
        });

        // Data extraction with fallback
        scrapeResult.onOffStatus = await robustPuppeteerAction(page, "Extract Status", async () => {
            try {
                return await page.$eval(selectors.onOffStatusSelector, el => el.textContent.trim());
            } catch {
                const elements = await page.$x(selectors.onOffStatusSelector);
                return elements[0]?.evaluate(el => el.textContent.trim()) || 'Unknown';
            }
        });

        scrapeResult.lastLoginTime = await robustPuppeteerAction(page, "Extract Login Time", async () => {
            try {
                const elements = await page.$x(selectors.lastLoginTimeSelector);
                return elements[0]?.evaluate(el => el.textContent.trim()) || 'Unknown';
            } catch (error) {
                console.error("Login time extraction failed:", error);
                return 'Unknown';
            }
        });

        // Optional data extraction
        if (selectors.signalStrengthSelector) {
            try {
                scrapeResult.signalStrength = await page.$eval(selectors.signalStrengthSelector,
                    el => el.textContent.trim()
                );
            } catch (error) {
                scrapeResult.signalStrength = 'N/A';
                console.warn(`Signal strength extraction failed, using N/A. Error: ${error.message}`);
            }
        }

        if (selectors.batteryLevelSelector) {
            try {
                scrapeResult.batteryLevel = await page.$eval(selectors.batteryLevelSelector,
                    el => el.textContent.trim()
                );
            } catch (error) {
                scrapeResult.batteryLevel = 'N/A';
                console.warn(`Battery level extraction failed, using N/A. Error: ${error.message}`);
            }
        }

        // Validation
        scrapeResult.onOffStatus = validateOnOffStatus(scrapeResult.onOffStatus);
        scrapeResult.lastLoginTime = validateLastLoginTime(scrapeResult.lastLoginTime);
        scrapeResult.success = true;
        consecutiveFailures = 0;

        const validationResult = validateAllData(scrapeResult); // Get validation object

        // Check for data-driven alerts AFTER successful scrape and validation
        if (validationResult.signalAlertTrigger) {
            await sendAlert({
                alertType: 'Signal Strength Low',
                signalStrength: scrapeResult.signalStrength,
                threshold: alertConfig.dataAlerts.signalStrengthLow.threshold
            });
        }
        if (validationResult.batteryAlertTrigger) {
            await sendAlert({
                alertType: 'Battery Level Low',
                batteryLevel: scrapeResult.batteryLevel,
                threshold: alertConfig.dataAlerts.batteryLevelLow.threshold
            });
        }


        // Save HTML snapshot
        const htmlContent = await page.content();
        await fs.writeFile(
            path.join(__dirname, `${htmlFilenamePrefix}-${timestamp}.html`),
            htmlContent
        );

    } catch (error) {
        scrapeResult.errors.push({
            message: error.message,
            stack: error.stack
        });
        scrapeResult.success = false;
        consecutiveFailures++;
        console.error(`[CRITICAL ERROR] Consecutive failures: ${consecutiveFailures}, Error: ${error.message}`);
        if (alertConfig.enabled && consecutiveFailures >= alertConfig.failureThreshold) {
            await sendAlert(scrapeResult.errors);
        }
        await handleSessionExpiry(page); // Attempt session recovery on failure

    } finally {
        if (browser) await browser.close();
        performanceTracker.recordScrapeDuration(scrapeStartTime);
    }

    await storeScrapeResultInDB(scrapeResult);
    return scrapeResult;
}

// ----- SCHEDULING & MONITORING -----
async function mainLoop() {
    console.log("Starting monitoring service...");
    resourceMonitor.trackMemory(); // Start memory monitoring
    while (true) {
        const result = await scrapeStatus();
        console.log(`[${result.timestamp}] Scrape result: ${result.success ? 'SUCCESS' : 'FAILURE'} - Avg. Scrape Time: ${performanceTracker.calculateAverageScrapeTime().toFixed(2)}ms`);

        if (!result.success) {
            console.error("Errors encountered:", result.errors);
        }

        console.log(`Next scrape in ${scrapeIntervalMilliseconds / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, scrapeIntervalMilliseconds));
    }
}

// Start the service
mainLoop().catch(err => {
    console.error("Fatal application error:", err);
    resourceMonitor.stopMonitoring(); // Stop memory monitoring on fatal error
    process.exit(1);
});
