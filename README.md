# be-afraid-who-you-are

GBP (Google Business Profile) suspension lead scraper

## Description

This Node.js script automatically scrapes Google Business support threads for suspension-related posts, filters and prioritizes leads with fewer replies, and sends the top 3 leads via email formatted with dark/aggressive HTML styling.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Add your Zoho SMTP credentials to `.env`:**
   ```
   ZOHO_USER=your-email@example.com
   ZOHO_PASS=your-app-specific-password
   ```

   > **Note:** Use an app-specific password for Zoho Mail, not your account password.

## Usage

Run the scraper manually:
```bash
npm start
# or
node index.js
```

## Scheduling with Cron

To run the scraper automatically at 5pm Central Time every day:

1. **Open your crontab:**
   ```bash
   crontab -e
   ```

2. **Add this line:**
   ```
   0 17 * * * cd /path/to/be-afraid-who-you-are && npm start >> logs/scraper.log 2>&1
   ```

   Replace `/path/to/be-afraid-who-you-are` with the absolute path to this project directory.

   - `0 17 * * *` = Every day at 5:00 PM Central Time
   - `>> logs/scraper.log 2>&1` = Append output to logs/scraper.log

3. **Create logs directory:**
   ```bash
   mkdir -p logs
   ```

## How It Works

1. **Scrapes** Google Business support threads from: https://support.google.com/business/threads?hl=en
2. **Filters** for suspension-related keywords:
   - suspended, suspension, reinstate, taken down
   - disabled, appeal, rejected, denied, escalation
3. **Prioritizes** threads with fewer replies (newer/less-discussed leads)
4. **Selects** top 3 leads
5. **Sends** formatted email via Zoho SMTP with dark/aggressive HTML styling

## Environment Variables

- `ZOHO_USER` - Zoho Mail email address (your-email@example.com)
- `ZOHO_PASS` - Zoho Mail app-specific password

## Files

- `index.js` - Main scraper script
- `package.json` - Node dependencies
- `.env.example` - Environment variable template
- `.gitignore` - Git ignore rules
- `README.md` - This file

## Notes

- `.env` is not tracked by git for security
- Logs are generated when running via cron
- Requires Node.js 14+ and npm
