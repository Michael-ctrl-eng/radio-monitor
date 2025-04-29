
# Automated POC Radio Status Monitoring Script

This project offers a simple yet powerful script designed to automatically check and log the operational status of your Proof of Concept (POC) radio via its web interface. Instead of manually visiting a webpage every time, this tool handles the monitoring for you, providing peace of mind and valuable historical data.

Whether you want to know if your radio is online, the time of its last successful connection, or its current signal strength, this script automates the process.

## How It Works

The script acts like a dedicated, automated browser session:

1.  **Accesses the Radio's Web Interface:** It navigates to your radio's status webpage.
2.  **Handles Authentication:** If your radio's interface requires a login, the script can automatically provide credentials.
3.  **Extracts Key Information:** It is configured to locate and pull specific data points from the page, such as status ("Online"/"Offline"), last login timestamp, signal levels, etc.
4.  **Stores Historical Data:** The extracted information is timestamped and saved into a local database file (`.db`).
5.  **Sends Alerts (Optional):** You can configure the script to send email notifications if critical conditions are detected, like the radio going offline or signal dropping below a threshold.

## Why Use This Script?

*   **Efficiency:** Eliminates the need for repetitive manual status checks.
*   **Proactive Monitoring:** Get alerted to issues quickly, rather than discovering them hours later.
*   **Performance Tracking:** The database allows you to analyze historical trends and identify potential long-term issues.
*   **Simplified Setup:** Designed with clear steps to get you started quickly.

## Prerequisites

Before setting up the script, ensure you have the following installed and readily available:

1.  **Node.js:** This JavaScript runtime is required to execute the script.
    *   **Check if installed:** Open your command line (Search for "Command Prompt" or "PowerShell" on Windows; "Terminal" on macOS/Linux). Type `node -v` and press Enter. If a version number (e.g., `v18.x.x` or higher) appears, you're set.
    *   **Installation:** If not installed, download the recommended version from [https://nodejs.org/](https://nodejs.org/) and follow the installation instructions for your operating system. Close and reopen your command line after installation and verify with `node -v`.

2.  **Basic Command Line / Terminal Familiarity:** You should be comfortable with:
    *   Navigating directories using the `cd` command.
    *   Running commands like `npm install` and `node`.

3.  **Your Radio's Web Interface Details:** You will need:
    *   The base URL of your radio's web interface (e.g., `http://192.168.1.150`).
    *   The specific path to the status page (e.g., `/status.html`, `/info.cgi`).
    *   If login is required, the path to the login page (e.g., `/login.htm`) and your username/password.

## Step-by-Step Setup Guide

Follow these steps to get the Radio Monitoring Script configured and running.

**Step 1: Obtain the Script Files**

Get the project code onto your local machine. You can do this via ZIP download or Git clone.

*   **Option A: Download ZIP (Recommended for beginners)**
    1.  Go to the project's GitHub page: [https://github.com/Michael-ctrl-eng/radio-monitor](https://github.com/Michael-ctrl-eng/radio-monitor)
    2.  Click the green `<> Code` button.
    3.  Select "Download ZIP".
    4.  Locate the downloaded `radio-monitor-main.zip` file (usually in your Downloads folder).
    5.  **Extract** the contents of the ZIP file. This will create a folder named `radio-monitor-main`.
    6.  (Optional but recommended) Rename this folder to `radio-monitor` for simplicity and move it to a convenient location (e.g., your Documents or a dedicated projects folder).

*   **Option B: Clone with Git (For users familiar with Git)**
    If you have Git installed, open your command line and execute:
    ```bash
    git clone https://github.com/Michael-ctrl-eng/radio-monitor.git
    cd radio-monitor
    ```

**Step 2: Install Dependencies**

The script relies on external libraries (packages). Use `npm` to install them.

1.  **Open your Command Line/Terminal.**
2.  **Navigate to the Project Folder:** Use the `cd` command to change your current directory to the `radio-monitor` folder you obtained in Step 1.
    *   *Example:* If you put the folder in your Documents: `cd Documents/radio-monitor`
    *   *Tip:* You can usually type `cd ` (with a space) and drag the `radio-monitor` folder directly from your file explorer into the command line window, then press Enter.
3.  **Run Installation Command:** While *inside* the project folder in your command line, type:
    ```bash
    npm install
    ```
    This command downloads and installs all required packages. Wait for the process to complete. Minor warnings are usually fine, but significant errors indicate a problem.

**Step 3: Configure Script Settings**

You need to provide the script with details about your specific radio and monitoring preferences by editing configuration files.

**Step 3a: Essential Settings (`.env` file)**

This file holds critical, environment-specific settings like URLs, credentials, and email configuration.

1.  **Locate `.env.example`:** In your project folder, find the file named `.env.example`.
2.  **Rename to `.env`:** **Rename this file to `.env`**. Make sure you remove the `.example` extension completely. On some operating systems, file extensions might be hidden by default, so double-check the full filename.
3.  **Open `.env` in a Text Editor:** Use a plain text editor (like Notepad, VS Code, Sublime Text, TextEdit on macOS) to open the newly renamed `.env` file.
4.  **Edit the Values:** The file contains lines defining settings. Replace the placeholder values with your actual details:

    ```dotenv
    # --- Basic Radio Web Interface Details ---
    WEBSITE_BASE_URL=https://your-radio-domain.com # <-- Replace with your radio's IP address or domain. Include http:// or https://.
    LOGIN_URL_PATH=/login                          # <-- Path to the login page relative to BASE_URL (e.g., /login.html). Keep as /login if no specific login page.
    STATUS_PAGE_PATH=/radio_status                 # <-- Path to the page showing the radio's status (e.g., /status.cgi, /info.html).

    # --- Login Credentials (Required if your radio web interface needs login) ---
    SCRAPE_USERNAME=your_username                  # <-- Your username for the radio web interface.
    SCRAPE_PASSWORD=your_password                  # <-- Your password for the radio web interface.

    # --- Email Alert Settings (Optional) ---
    ALERT_ENABLED=false                            # <-- Set to true to enable email alerts.
    SMTP_SERVICE=Gmail                             # <-- Your email provider (e.g., Gmail, Outlook, or specific SMTP).
    SMTP_USER=your_sending_email@example.com       # <-- The email address that will send the alerts.
    SMTP_PASS=your_email_password                  # <-- The password for the sending email account. **SECURITY WARNING: For services like Gmail with 2FA, strongly consider using an App Password instead of your main password.**
    ALERT_RECIPIENTS=recipient1@example.com,recipient2@example.com # <-- One or more email addresses to receive alerts (comma-separated).

    # --- Other Settings (Generally okay to leave default) ---
    SCRAPE_INTERVAL=60000                          # <-- How often to check the radio status, in milliseconds (60000 = 1 minute).
    # Add or uncomment other settings from .env.example as needed...
    ```
    *   **Replace all placeholder text** (the parts starting with `# <--`) with your specific radio and email details.
    *   Pay close attention to the `ALERT_ENABLED` setting if you want email alerts. If enabled, fill in *all* the related email settings. **Prioritize using an App Password** for enhanced security if your email provider supports it, especially for Gmail if you use 2-factor authentication.
    *   Save the `.env` file.

**Step 3b: Data Extraction Configuration (`selectors.json`)**

This file tells the script precisely *where* on your radio's status webpage to find the specific data points (status, login time, etc.) using web technologies like CSS Selectors or XPath. Since every webpage structure is different, the default `selectors.json` might not work for your radio.

*   **Initial Attempt:** It's recommended to **first try running the script with the default `selectors.json` file** included in the project. It might be compatible with some common radio interface layouts.
*   **If Scraping Fails (Requires Editing):** If the script runs but fails to extract data from the page (indicated by "FAILURE" messages related to scraping or empty data fields in logs), you **will need to customize the `selectors.json` file**. This is the most technical part of the setup. You'll need to use your web browser's developer tools (usually accessed by right-clicking on the status webpage and selecting "Inspect" or "Inspect Element") to examine the HTML structure of your radio's status page and determine the correct CSS selectors or XPath expressions for each data point the script needs to find.
    *   Refer to the comments within the `selectors.json` file itself for guidance on the expected structure and how to find selectors. There are also many online resources explaining how to use browser developer tools for web scraping.

**Step 4: Run the Script!**

With the configuration complete, you can now execute the monitoring script.

1.  **Open your Command Line/Terminal (if closed).**
2.  **Navigate to the Project Folder:** Use `cd` to go back into your `radio-monitor` folder, just like in Step 2.
3.  **Execute the Script:** Type the following command and press Enter:
    ```bash
    node radio-monitor.js
    ```

**What to Expect:**

*   **Console Output:** The command line will display messages indicating the script's progress: connecting, logging in, attempting to scrape, saving data, or reporting errors. Look for "SUCCESS" or "FAILURE" indicators.
*   **Log Files:** Text files starting with `scrape-log-v3-` will be created in your project folder. These contain detailed logs of each check, which are invaluable for troubleshooting.
*   **HTML Snapshots:** Files like `html-response-v3-*.html` are saved copies of the webpage source the script accessed during a check. These are extremely helpful if you need to debug `selectors.json`.
*   **Database File:** A file named `radio_status_v3.db` will appear. This is the SQLite database storing all collected status history. You'll need an SQLite viewer (like "DB Browser for SQLite") to easily view its contents.

**Allow the script to run for a few minutes.** Observe the console output. If you consistently see "SUCCESS" messages indicating data was found and saved, your basic setup is working! If you encounter persistent "FAILURE" or error messages, consult the Troubleshooting section.

**To Stop the Script:** Return to the command line window where the script is running and press `Ctrl + C` (hold down the Control key and press C).

## Troubleshooting Common Issues

If you encounter problems, check these common areas:

*   **Script fails to start (e.g., `command not found: node`)**:
    *   Ensure Node.js is installed correctly (revisit Prerequisites, Step 1). Close and reopen your terminal after installing. Verify with `node -v`.
    *   Confirm you are running the `node radio-monitor.js` command *from within the project folder* (Step 4).
*   **Script runs but reports "FAILURE" or scraping errors:**
    *   **`.env` File Errors:** **This is the most frequent cause.** Double-check *all* the values you entered in the `.env` file (Step 3a): `WEBSITE_BASE_URL`, `LOGIN_URL_PATH`, `STATUS_PAGE_PATH`, `SCRAPE_USERNAME`, `SCRAPE_PASSWORD`. Small typos or incorrect paths are common mistakes. Ensure `http://` or `https://` is included in the base URL.
    *   **Manual Web Access:** Can you manually access the radio's status page in a standard web browser using the URLs you configured? Can you log in manually? If you cannot access the page yourself, the script won't be able to either. Check network connectivity.
    *   **`selectors.json` Mismatch:** If the script can access the page but fails to get the data, the `selectors.json` file is likely not configured correctly for your radio's specific webpage structure. You *must* edit `selectors.json` to tell the script where to find the data using the method described in Step 3b (using browser developer tools).
*   **Email alerts are not received (if enabled):**
    *   Confirm `ALERT_ENABLED=true` in your `.env` file.
    *   Carefully review all email configuration settings (`SMTP_SERVICE`, `SMTP_USER`, `SMTP_PASS`, `ALERT_RECIPIENTS`) in `.env` for accuracy.
    *   If using Gmail with 2-Factor Authentication, ensure you are using an **App Password** for `SMTP_PASS`.
    *   Check the recipient's spam/junk folders.
    *   The script's log file (`scrape-log-v3-*.log`) may contain specific error messages if email sending failed.
    *   Verify your email account allows sending via SMTP.


## License

This project is open-source software licensed under the [MIT License](LICENSE).
