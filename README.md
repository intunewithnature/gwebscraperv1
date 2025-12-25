# euringer-test

GBP (Google Business Profile) suspension lead scraper

## Description

This Node.js script automatically scrapes Google Business support threads for suspension-related posts, filters and prioritizes leads with fewer replies, and sends the top 3 leads via email 

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
