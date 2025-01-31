# Radio Monitoring Script - Simple Setup Guide

## What is this project?

This project is a tool to help you automatically check the status of your POC (Proof of Concept) radio.  Imagine you want to know if your radio is online, when it last logged in, or its signal strength.  Instead of manually checking a website every time, this tool does it for you automatically.

It works by:

1.  **Visiting your radio's status webpage:**  Just like you would in a web browser.
2.  **Logging in (if needed):**  It can enter your username and password automatically.
3.  **Looking for important information:**  It finds things like "Status: Online" or "Last Login: 2024-01-20 10:00:00".
4.  **Saving this information:**  It keeps a record of the status over time in a database.
5.  **Sending you an email if something goes wrong:** For example, if the radio goes offline, or the signal is weak.

This is useful for anyone who wants to monitor their POC radio's performance without having to check its website constantly.

## Before you start - Prerequisites

To use this tool, you need to install a few things on your computer first.  Think of these as the tools you need before you can build something.

1.  **Node.js:** This is a software that allows your computer to run JavaScript code (which is what this tool is written in).
    *   **Do you have it?** Open your computer's command line (on Windows, search for "Command Prompt" or "PowerShell"; on macOS, search for "Terminal"). Type `node -v` and press Enter.
        *   If you see a version number (like `v18.x.x` or higher), Node.js is already installed. You can skip to step 2.
        *   If you get an error message, you need to install Node.js.
    *   **How to install:** Go to [https://nodejs.org/](https://nodejs.org/) and download the installer for your computer's operating system (Windows, macOS, or Linux). Run the installer and follow the on-screen instructions.  After installation, try `node -v` in the command line again to check if it's installed correctly.

2.  **Basic Computer Skills:** You should be comfortable with:
    *   Using your computer's operating system (Windows, macOS, or Linux).
    *   Opening and editing text files.
    *   Using the command line or terminal (for running commands).

## Step-by-step Installation and Setup

Let's set up the Radio Monitoring Script step by step.

**Step 1: Get the Project Files**

You need to download the files for this project to your computer.  You said you have a GitHub repository at [https://github.com/Michael-ctrl-eng/radio-monitor/tree/main](https://github.com/Michael-ctrl-eng/radio-monitor/tree/main).

*   **Download as ZIP (easiest method):**
    1.  Go to the GitHub link above in your web browser.
    2.  Click the green button labeled "Code".
    3.  In the dropdown menu, click "Download ZIP".
    4.  Your browser will download a ZIP file (probably named something like `radio-monitor-main.zip`).
    5.  Find the downloaded ZIP file on your computer (usually in your "Downloads" folder).
    6.  **Extract the ZIP file.** Right-click on the ZIP file and choose "Extract All..." (on Windows) or double-click to extract (on macOS). Choose a location on your computer to extract the files (e.g., your "Documents" folder or Desktop).  This will create a folder named `radio-monitor-main` (or similar).
    7.  **Rename the folder:** (Optional, but recommended) Rename the extracted folder to something simpler, like `radio-monitor`.

*   **Using Git (if you are familiar with Git):** If you know how to use Git and have it installed, you can clone the repository using this command in your command line:
    ```bash
    git clone https://github.com/Michael-ctrl-eng/radio-monitor.git
    cd radio-monitor
    ```

**Step 2: Install Required Software Packages**

This project uses some extra "packages" of code that need to be installed. We'll use `npm` (which came with Node.js) to do this.

1.  **Open the Command Line:** Open your computer's command line again (Command Prompt/PowerShell on Windows, Terminal on macOS/Linux).
2.  **Navigate to the Project Folder:** You need to tell the command line to "go into" the folder where you downloaded the project files (`radio-monitor` or `radio-monitor-main`). Use the `cd` command (which stands for "change directory").
    *   **Example:** If you extracted the folder to your "Documents" folder, and renamed it to `radio-monitor`, you would type:
        ```bash
        cd Documents/radio-monitor
        ```
        (On macOS/Linux, it might be `cd Documents/radio-monitor` or `cd ~/Documents/radio-monitor` or `cd ~/Desktop/radio-monitor` depending on where you extracted it).  **Make sure to use the correct path to the folder where you extracted the files.**
    *   **Tip:** You can usually type `cd ` (that's `cd` and a space) and then drag and drop the project folder from your file explorer window into the command line window. This will automatically paste the correct path. Then press Enter.
3.  **Install Packages:** Once you are inside the project folder in the command line, type the following command exactly as it is and press Enter:
    ```bash
    npm install
    ```
    This command will download and install all the necessary software packages that the Radio Monitoring Script needs to run. You will see text scrolling in the command line. Wait until it finishes without any major error messages (warnings are usually okay). It might take a few minutes.

**Step 3: Configure the Script - Tell it about Your Radio**

Now, you need to tell the script about your specific POC radio: its website address, login details, and where to find the status information on the webpage. You will do this by editing two configuration files.

**File 1: `.env` - Basic Settings (Website, Login, Email)**

The `.env` file contains important settings like website addresses, usernames, passwords, and email settings.

1.  **Find the `.env.example` file:** In your project folder, find a file named `.env.example`.
2.  **Rename it to `.env`:** Remove the `.example` part from the name. It should just be `.env`. **Make sure to remove the `.example` extension**.  Your operating system might hide file extensions by default. Ensure you are renaming just the `.example` part.
3.  **Open `.env` in a Text Editor:** Open the `.env` file with a simple text editor like Notepad (on Windows) or TextEdit (on macOS).
4.  **Edit the Settings:** You will see lines like:

    ```
    WEBSITE_BASE_URL=https://your-poc-website.com
    LOGIN_URL_PATH=/login
    STATUS_PAGE_PATH=/radio_status
    SCRAPE_USERNAME=your_username
    SCRAPE_PASSWORD=your_password

    ALERT_ENABLED=true
    # ... (and many more settings) ...
    ```

    *   **`WEBSITE_BASE_URL`**:  Replace `https://your-poc-website.com` with the **actual web address of your POC radio**.  This might be something like `http://192.168.1.1` or `http://your-radio-local.net`.  **Important: Include `http://` or `https://` at the beginning.**
    *   **`LOGIN_URL_PATH`**: If your radio's website has a login page, replace `/login` with the **path to the login page** (usually something like `/login` or `/login.html`). If there is no login page, you can usually leave this as `/login`.
    *   **`STATUS_PAGE_PATH`**: Replace `/radio_status` with the **path to the page that shows the radio's status** (e.g., `/status.html` or `/radio_status`).
    *   **`SCRAPE_USERNAME`**: If your radio's website requires login, replace `your_username` with your **username** for the radio's website. If no login, you can leave this as `your_username` (it won't be used).
    *   **`SCRAPE_PASSWORD`**: If login is needed, replace `your_password` with your **password**. If no login, you can leave it as `your_password`.

    *   **Email Alert Settings (Optional):** If you want to receive email alerts when something is wrong, you need to fill in the lines starting with `ALERT_ENABLED`, `SMTP_SERVICE`, `SMTP_USER`, `SMTP_PASS`, and `ALERT_RECIPIENTS`.  You'll need to provide your email service details and an email address to receive alerts. If you don't want email alerts for now, you can leave `ALERT_ENABLED=false`.  **If you enable email alerts, be very careful with your `SMTP_PASS` (email password).**  For Gmail, it is strongly recommended to use an "App Password" instead of your main Gmail password for security.

    *   **Other Settings:**  There are many other settings in `.env`, but for now, you can usually leave them as they are (the default values are generally good).

    **Example `.env` file after editing:**

    ```
    WEBSITE_BASE_URL=http://192.168.1.100  # Example radio IP address
    LOGIN_URL_PATH=/login.htm
    STATUS_PAGE_PATH=/status_page.cgi
    SCRAPE_USERNAME=admin
    SCRAPE_PASSWORD=securePassword123

    ALERT_ENABLED=false  # Email alerts disabled for now
    # ... (rest of the settings left as default) ...
    ```

    **Save the `.env` file after you have edited it.**

**File 2: `selectors.json` - Finding Information on the Webpage (Advanced Step)**

The `selectors.json` file tells the script *how to find* the "On/Off Status", "Last Login Time", etc. on your radio's status webpage. This is the most technical part and may require some extra work.

**If the script does not work correctly after running it for the first time (in the next step), you will likely need to adjust the `selectors.json` file.**

*   **For now, you can try running the script with the default `selectors.json` file that is already in the project folder.** It might work if your radio's website uses a common layout.

*   **If you need to adjust `selectors.json` (Troubleshooting):**  This requires using your web browser's "Developer Tools" to inspect the HTML code of your radio's status webpage and find the correct "CSS Selectors" or "XPath Expressions".  **This is a more advanced task and you might need help from someone with web development experience.**  The `README.md` file and comments in the `radio-monitor.js` script have more information on how to do this, but it can be complex for beginners.

**Step 4: Run the Radio Monitoring Script!**

You are now ready to run the Radio Monitoring Script.

1.  **Open the Command Line (if it's closed):** Open your command line (Command Prompt/PowerShell on Windows, Terminal on macOS/Linux).
2.  **Navigate to the Project Folder Again:** Use the `cd` command to go back into your project folder (`radio-monitor`). Just like you did in Step 2, point 2.
3.  **Run the Script:** Type the following command and press Enter:
    ```bash
    node radio-monitor.js
    ```
    This will start the script.

**What to Expect When Running the Script:**

*   **Console Output:** You will see messages in the command line as the script runs. It will tell you what it's doing, and if it is successful or if there are any errors. Look for lines that say "SUCCESS" and "FAILURE".
*   **Log Files:** The script will create log files in your project folder with names starting with `scrape-log-v3-`. These files contain more detailed information about what the script did. You can open these files with a text editor to see the logs.
*   **HTML Snapshot Files:**  Files starting with `html-response-v3-` are copies of the HTML code of your radio's status webpage that the script downloaded. These can be useful for debugging if something is not working.
*   **SQLite Database File:** A file named `radio_status_v3.db` will be created. This is a database file where the script stores all the collected status information. You need special software to open and view SQLite database files (like "DB Browser for SQLite").

**Let the script run for a few minutes.**  Check the console output for "SUCCESS" messages. If you see many "FAILURE" or "ERROR" messages, something is likely wrong with your configuration in `.env` or `selectors.json`, and you need to troubleshoot.

**To Stop the Script:** Press `Ctrl + C` in the command line window where the script is running.

## Troubleshooting Common Issues

*   **Script won't start or gives errors immediately:**
    *   Make sure you completed **Step 2** ("Install Required Software Packages") successfully. Run `npm install` again in the project folder and check for errors.
    *   Check if you have Node.js installed correctly by typing `node -v` in the command line and seeing a version number.
*   **Script runs, but shows "FAILURE" or "ERROR" messages repeatedly:**
    *   **Check `.env` file:** Double-check that you entered the correct `WEBSITE_BASE_URL`, `LOGIN_URL_PATH`, `STATUS_PAGE_PATH`, `SCRAPE_USERNAME`, and `SCRAPE_PASSWORD` in the `.env` file.  **Small typos are easy to make!** Make sure you are using `http://` or `https://` at the start of the website address if needed.
    *   **Check Radio Website Access:** Open a web browser on your computer and try to access your radio's status webpage manually using the `WEBSITE_BASE_URL` and `STATUS_PAGE_PATH` you put in `.env`. Can you see the status page in your browser? Can you log in manually if required? If you cannot access the webpage manually, the script won't be able to either.
    *   **Adjust `selectors.json` (Advanced):** If the script can access the website, but still fails to extract data, it's likely that the selectors in `selectors.json` are not correct for your radio's webpage. You will need to use browser Developer Tools to inspect your radio's status webpage's HTML code and update the selectors in `selectors.json` as described earlier. This is the most common reason for scraping failures.
*   **Email alerts are not working (if you enabled them):**
    *   Make sure `ALERT_ENABLED=true` in `.env`.
    *   Double-check all your email settings in `.env` (`SMTP_SERVICE`, `SMTP_USER`, `SMTP_PASS`, `ALERT_RECIPIENTS`). Again, typos are common.
    *   For Gmail, make sure you are using an "App Password" if you have 2-Factor Authentication enabled.
    *   Check your email "Spam" or "Junk" folder to see if the alerts are going there.
    *   Try sending a test email from your email account to make sure your email settings are generally working.

## Customizing the Script (Optional)

This is just the basic setup. You can customize the script further later:

*   **Adjust scraping interval:** Change `SCRAPE_INTERVAL` in `.env` to change how often the script checks the radio status (time in milliseconds).
*   **Monitor different data:** If your radio's website shows other information, you can try to extract that as well by updating `selectors.json` and modifying the `radio-monitor.js` script (more advanced).
*   **Create reports or dashboards:**  You could build on this script to generate reports from the collected data or create a web dashboard to visualize the radio status in real-time (more advanced programming required
