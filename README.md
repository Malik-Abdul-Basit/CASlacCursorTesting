# Slack Logs Automation

Automated system that fetches error logs from Slack channels every 3 hours and stores them in Google Sheets.

## Features

- ✅ Automated log fetching every 3 hours (configurable)
- ✅ Multi-channel support with enable/disable toggles
- ✅ Google Sheets integration for easy log viewing and analysis
- ✅ Duplicate message filtering
- ✅ Configurable error pattern exclusions
- ✅ Automatic backup if Google Sheets fails
- ✅ Tracks last fetch time per channel to avoid duplicates
- ✅ Rich data extraction (timestamp, level, user account, file, line, stack trace)

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure credentials:**
   - Copy `.env.example` to `.env`
   - Add your Slack bot token
   - Add your Google Sheets spreadsheet ID
   - Place `google-credentials.json` in the root directory

3. **Enable channels:**
   - Edit `config.json`
   - Set `"enabled": true` for channels you want to monitor

4. **Run the automation:**
   ```bash
   npm start
   ```

## Documentation

See [SETUP.md](SETUP.md) for detailed setup instructions including:
- Slack bot configuration
- Google Cloud service account setup
- Google Sheets API configuration
- Deployment options
- Troubleshooting guide

## Configuration

### Channels (`config.json`)

Enable or disable Slack channels to monitor:

```json
{
  "channels": [
    {
      "id": "CJ9F26TLM",
      "name": "Live V2",
      "enabled": true
    }
  ]
}
```

### Schedule (`.env`)

Change how often logs are fetched:

```env
CRON_SCHEDULE=0 */3 * * *   # Every 3 hours (default)
```

### Excluded Patterns (`config.json`)

Filter out known error patterns to reduce noise.

## Output

Logs are stored in Google Sheets with columns:
- Timestamp
- Channel
- Level
- Message
- User Account
- File
- Line
- Stack Trace
- Link (to Slack message)

## Files

- `automated-logs-fetcher.js` - Main automation script
- `get_logs_52c4.js` - Original manual log fetcher
- `config.json` - Channel and filter configuration
- `.env` - Credentials and settings
- `google-credentials.json` - Google service account key (not in repo)
- `last-fetch-times.json` - Tracks last fetch per channel (auto-generated)

## Commands

- `npm start` - Start the automated scheduler
- `npm test` - Run the original manual script

## Requirements

- Node.js v14 or higher
- Slack Bot Token with `channels:history` and `channels:read` scopes
- Google Cloud service account with Sheets API access
- Google Sheets spreadsheet shared with service account

## License

ISC
