# Slack Logs Automation - Setup Guide

This automated system fetches error logs from Slack channels every 3 hours and stores them in Google Sheets.

## Prerequisites

1. Node.js (v14 or higher)
2. A Slack Bot Token with appropriate permissions
3. A Google Cloud Service Account with Google Sheets API access
4. A Google Sheets spreadsheet

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Slack Bot Token

1. Go to [Slack API](https://api.slack.com/apps)
2. Create or select your Slack app
3. Navigate to "OAuth & Permissions"
4. Add the following Bot Token Scopes:
   - `channels:history`
   - `channels:read`
   - `groups:history`
   - `groups:read`
5. Install the app to your workspace
6. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

### 3. Set Up Google Sheets API

#### Create a Service Account:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"
   - Fill in the service account details
   - Click "Create and Continue"
   - Skip granting additional roles (click "Continue")
   - Click "Done"
5. Generate a key:
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Select "JSON" format
   - Download the key file
6. Rename the downloaded file to `google-credentials.json` and place it in the project root

#### Create and Share Google Sheet:

1. Create a new Google Sheet
2. Copy the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```
3. Share the spreadsheet with your service account email:
   - Click "Share" button
   - Add the service account email (found in `google-credentials.json` under `client_email`)
   - Give it "Editor" permissions

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   SLACK_BOT_TOKEN=xoxb-your-actual-bot-token
   GOOGLE_SHEETS_SPREADSHEET_ID=your-actual-spreadsheet-id
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   CRON_SCHEDULE=0 */3 * * *
   TIMEZONE=UTC
   ```

### 5. Configure Channels

Edit `config.json` to enable/disable channels you want to monitor:

```json
{
  "channels": [
    {
      "id": "CJ9F26TLM",
      "name": "Live V2",
      "enabled": true    // Set to true to enable monitoring
    },
    {
      "id": "C031U4F4K6H",
      "name": "Live API",
      "enabled": false   // Set to false to disable
    }
  ]
}
```

## Running the Application

### Start the Automated Scheduler

```bash
npm start
```

This will:
- Run immediately to fetch logs since the last fetch (or last 3 hours if first run)
- Schedule to run every 3 hours automatically
- Append new logs to your Google Sheet

### Test with Original Script

To test the original manual script:

```bash
npm test
```

## Customization

### Change Schedule

Edit the `CRON_SCHEDULE` in `.env`:

- Every 3 hours: `0 */3 * * *` (default)
- Every hour: `0 * * * *`
- Every 6 hours: `0 */6 * * *`
- Daily at midnight: `0 0 * * *`
- Every 30 minutes: `*/30 * * * *`

### Add/Remove Excluded Patterns

Edit the `excludedPatterns` array in `config.json` to filter out unwanted error messages.

### Modify Data Fields

Edit `automated-logs-fetcher.js` to customize:
- Data extraction logic (lines 95-120)
- Google Sheets columns (lines 155-164)
- Message parsing (lines 80-130)

## Google Sheets Output Format

The logs will be stored with the following columns:

| Column | Description |
|--------|-------------|
| Timestamp | When the error occurred |
| Channel | Slack channel name |
| Level | Error level (ERROR, WARNING, etc.) |
| Message | Error message text |
| User Account | Extracted user account ID |
| File | Source file where error occurred |
| Line | Line number in source file |
| Stack Trace | Truncated stack trace (first 500 chars) |
| Link | Direct link to Slack message |

## Monitoring

### Check Logs

The application prints logs to console:
- Fetch start/end times
- Number of messages found per channel
- Success/failure of Google Sheets append
- Any errors encountered

### Backup Files

If Google Sheets API fails, logs are automatically saved to:
```
backup-logs-YYYY-MM-DD-HHmmss.json
```

### Last Fetch Times

The file `last-fetch-times.json` tracks the last successful fetch time for each channel to avoid duplicates.

## Deployment

### Running as a Background Service (Linux)

1. Install PM2:
   ```bash
   npm install -g pm2
   ```

2. Start the service:
   ```bash
   pm2 start automated-logs-fetcher.js --name slack-logs-automation
   ```

3. Save the PM2 process list:
   ```bash
   pm2 save
   ```

4. Set PM2 to start on system boot:
   ```bash
   pm2 startup
   ```

5. Monitor the service:
   ```bash
   pm2 logs slack-logs-automation
   pm2 status
   ```

### Running with Docker (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t slack-logs-automation .
docker run -d --name slack-logs-automation slack-logs-automation
```

## Troubleshooting

### Slack API Errors

- **Error: not_authed** - Check your Slack bot token
- **Error: channel_not_found** - Verify channel IDs and bot permissions
- **Error: missing_scope** - Add required scopes to your bot

### Google Sheets Errors

- **Error: The caller does not have permission** - Share the spreadsheet with service account email
- **Error: Unable to parse range** - The "Logs" sheet will be created automatically
- **Error: Requested entity was not found** - Check spreadsheet ID in `.env`

### Rate Limiting

If you hit rate limits:
- Reduce the number of enabled channels
- Increase the time between fetches
- Add delays between channel fetches (modify code)

## Support

For issues or questions, please check:
1. All credentials are correct in `.env`
2. Service account has access to the spreadsheet
3. Bot has necessary Slack permissions
4. Node.js version is compatible (v14+)
