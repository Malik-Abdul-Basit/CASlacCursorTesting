# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Slack Token

**Option A: Using Environment Variable (Recommended)**
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your token
nano .env
```

**Option B: Direct Configuration**
Edit `multi-channel-log-fetcher.js` line 9:
```javascript
const SLACK_TOKEN = 'xoxb-YOUR-SLACK-BOT-TOKEN';
```

### Step 3: Run

**Automated Mode (Runs every 3 hours):**
```bash
npm start
```

**Manual Mode (One-time fetch):**
```bash
npm run manual
```

## 🔑 Getting Your Slack Bot Token

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name your app (e.g., "Log Fetcher") and select your workspace
4. Go to "OAuth & Permissions" in the sidebar
5. Under "Scopes" → "Bot Token Scopes", add:
   - `channels:history`
   - `channels:read`
6. Click "Install to Workspace" at the top
7. Copy the "Bot User OAuth Token" (starts with `xoxb-`)
8. Add the bot to your channels:
   - Go to each Slack channel
   - Type `/invite @YourBotName`

## 📊 Expected Output

After running, you'll get:

1. **Console Output:**
   ```
   🚀 Starting Multi-Channel Slack Log Fetcher
   📥 Fetching logs from Live V2 (CJ9F26TLM)...
   ✓ Fetched 45 messages from Live V2
   ...
   ✅ Complete! Saved 123 unique logs
   ```

2. **Files Created:**
   - `unique_slack_logs.txt` - All deduplicated logs
   - `slack_logs_2026-07-15_115930.xlsx` - Excel file
   - `last_fetch_time.json` - Timestamp tracker

## ⚙️ Customization

### Change Fetch Interval

Edit `scheduler.js` line 6:
```javascript
// Every 3 hours (current)
const CRON_SCHEDULE = '0 */3 * * *';

// Every hour
const CRON_SCHEDULE = '0 */1 * * *';

// Every 6 hours
const CRON_SCHEDULE = '0 */6 * * *';
```

### Add More Channels

Edit `multi-channel-log-fetcher.js` lines 11-18:
```javascript
const CHANNELS = [
  { id: 'CJ9F26TLM', name: 'Live V2' },
  // Add your channel
  { id: 'C123ABC456', name: 'My Channel' },
];
```

## 🐛 Common Issues

**❌ "Missing required scope: channels:history"**
- Go to Slack App settings → OAuth & Permissions
- Add the `channels:history` scope
- Reinstall the app to your workspace

**❌ "Channel not found"**
- Make sure you've invited the bot to the channel: `/invite @YourBotName`
- Verify the channel ID is correct

**❌ "No logs fetched"**
- Check that there are messages in the time range
- Verify the bot has access to the channels
- Try increasing the time range for testing

## 🎯 Testing

To test with a specific time range, edit `multi-channel-log-fetcher.js` and temporarily replace the `getLastFetchTime()` function:

```javascript
// Test: Fetch last 24 hours
function getLastFetchTime() {
  return dayjs().subtract(24, 'hours').unix();
}
```

## 📞 Need Help?

1. Check the full README.md for detailed documentation
2. Review the troubleshooting section
3. Open an issue on GitHub

## ✅ Verification Checklist

- [ ] Node.js installed (v14+)
- [ ] Dependencies installed (`npm install`)
- [ ] Slack bot token configured
- [ ] Bot added to all channels
- [ ] Test run completed successfully (`npm run manual`)
- [ ] Output files generated

Ready to automate? Run `npm start` and let it run in the background!
