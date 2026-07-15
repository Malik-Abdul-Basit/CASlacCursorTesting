# Multi-Channel Slack Log Fetcher & Automation

Automated system to fetch error logs from multiple Slack channels every 3 hours, deduplicate them, and export to Excel.

## 🚀 Features

- ✅ **Multi-Channel Support**: Monitors 6+ Slack channels simultaneously
- ✅ **Automatic Deduplication**: Removes duplicate logs across all channels
- ✅ **Smart Filtering**: Excludes known/irrelevant error patterns
- ✅ **Level Filtering**: Only exports ERROR, CRITICAL, DEBUG (skips INFO, WARNING, NOTICE)
- ✅ **Automated Scheduling**: Runs every 3 hours automatically
- ✅ **Excel Export**: Generates timestamped Excel files with formatted data
- ✅ **Incremental Fetching**: Tracks last fetch time to avoid duplicates
- ✅ **Channel Identification**: Each log tagged with its source channel

## 📋 Monitored Channels

1. **Live V2** (`CJ9F26TLM`)
2. **Live API** (`C031U4F4K6H`)
3. **Master Channel** (`C015U4U3EKW`)
4. **Staging Channel** (`C06LC14BW4C`)
5. **CAX Live Channel** (`C05FSFEBPTL`)
6. **CAX Staging Channel** (`C04LQ321DAQ`)

## 🛠️ Setup

### Prerequisites

- Node.js (v14 or higher)
- Slack Bot Token with `channels:history` permission

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd <repo-folder>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Slack Token**
   
   Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Slack Bot Token:
   ```
   SLACK_BOT_TOKEN=xoxb-your-actual-token-here
   ```
   
   **Alternative:** Export as environment variable:
   ```bash
   export SLACK_BOT_TOKEN=xoxb-your-actual-token-here
   ```

## 🎯 Usage

### Automated Mode (Recommended)

Run the scheduler to fetch logs every 3 hours automatically:

```bash
npm start
```

The scheduler will:
- Run immediately on startup
- Fetch logs every 3 hours (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 UTC)
- Keep running in the background
- Generate new Excel files with timestamps

**Output:**
- `unique_slack_logs.txt` - Combined deduplicated logs from all channels
- `slack_logs_YYYY-MM-DD_HHmmss.xlsx` - Excel file with timestamped filename

### Manual Mode

Fetch logs once manually:

```bash
npm run manual
```

Or run individual steps:

```bash
# Step 1: Fetch logs only
npm run fetch

# Step 2: Convert to Excel only
npm run convert
```

## 📊 Output Format

### Text File (`unique_slack_logs.txt`)

```
[2026-07-15 10:30:45] [Live V2] Error message here (https://app.slack.com/...) ERROR
[2026-07-15 10:31:12] [CAX Live Channel] Another error (https://app.slack.com/...) CRITICAL
```

### Excel File (`slack_logs_YYYY-MM-DD_HHmmss.xlsx`)

| Timestamp | Channel | Message Text | Message Link | Level |
|-----------|---------|--------------|--------------|-------|
| 2026-07-15 10:30:45 | Live V2 | Error message here | https://... | ERROR |
| 2026-07-15 10:31:12 | CAX Live Channel | Another error | https://... | CRITICAL |

## 🔧 Configuration

### Change Schedule

Edit `scheduler.js` line 6 to modify the cron schedule:

```javascript
const CRON_SCHEDULE = '0 */3 * * *'; // Every 3 hours

// Examples:
// '0 */1 * * *'  - Every hour
// '0 */6 * * *'  - Every 6 hours
// '0 0 * * *'    - Daily at midnight
// '0 9,17 * * *' - Twice daily (9 AM and 5 PM)
```

### Add/Remove Channels

Edit `multi-channel-log-fetcher.js` lines 11-18:

```javascript
const CHANNELS = [
  { id: 'CJ9F26TLM', name: 'Live V2' },
  { id: 'C031U4F4K6H', name: 'Live API' },
  // Add more channels here
  { id: 'YOUR_CHANNEL_ID', name: 'Your Channel Name' },
];
```

### Modify Excluded Patterns

Edit the `EXCLUDED_PATTERNS` array in `multi-channel-log-fetcher.js` to add or remove error patterns you want to exclude.

## 📁 Project Structure

```
.
├── scheduler.js                   # Main automation scheduler (runs every 3 hours)
├── multi-channel-log-fetcher.js   # Fetches logs from all Slack channels
├── convert-to-excel.js            # Converts text logs to Excel format
├── package.json                   # Dependencies and scripts
├── last_fetch_time.json           # Tracks last fetch timestamp (auto-generated)
├── unique_slack_logs.txt          # Combined deduplicated logs (auto-generated)
└── slack_logs_*.xlsx              # Excel output files (auto-generated)
```

## 🔄 How It Works

1. **Scheduler starts** and runs immediately
2. **Fetches logs** from all 6 channels since last fetch time (or past 3 hours on first run)
3. **Combines messages** from all channels into a single array
4. **Deduplicates** based on:
   - Message ID (channel + timestamp)
   - Message content (removes duplicate text across channels)
5. **Filters out** excluded patterns and INFO/WARNING/NOTICE levels
6. **Sorts** by timestamp (oldest first)
7. **Saves** to `unique_slack_logs.txt` with channel names
8. **Converts** to Excel with proper formatting
9. **Updates** last fetch timestamp
10. **Waits** 3 hours and repeats

## 🐛 Troubleshooting

### "Error fetching from [channel]"

- Check your Slack Bot Token has correct permissions
- Verify the channel IDs are correct
- Ensure the bot is added to all channels

### "No logs found"

- Check the time range in `last_fetch_time.json`
- Verify there are actual error messages in the channels
- Check if all errors are being filtered by excluded patterns

### Scheduler not running

```bash
# Make sure no other instance is running
pkill -f scheduler.js

# Restart
npm start
```

## 🚀 Running in Background (Production)

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the scheduler
pm2 start scheduler.js --name slack-log-fetcher

# View logs
pm2 logs slack-log-fetcher

# Stop
pm2 stop slack-log-fetcher

# Restart
pm2 restart slack-log-fetcher

# Auto-start on system reboot
pm2 startup
pm2 save
```

### Using nohup

```bash
nohup npm start > logs.txt 2>&1 &
```

## 📝 Notes

- The first run fetches logs from the past 3 hours
- Subsequent runs fetch logs since the last fetch time
- All timestamps are in UTC
- Excel files are timestamped to avoid overwriting
- The system automatically handles Slack API rate limits

## 📄 License

ISC

## 🤝 Support

For issues or questions, please open an issue in the repository.
