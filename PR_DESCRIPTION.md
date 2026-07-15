# Multi-Channel Automated Slack Log Fetcher

## 📋 What This PR Does

This PR completely rewrites the Slack log fetching system to support **automated multi-channel monitoring** with the following improvements:

### ✨ New Features

1. **Multi-Channel Support**
   - Monitors 6 Slack channels simultaneously
   - Each log is tagged with its source channel
   - Single unified output with all channels combined

2. **Automated Scheduling**
   - Runs automatically every 3 hours using `node-cron`
   - Runs immediately on startup, then continues on schedule
   - Shows next 5 scheduled run times on startup

3. **Smart Deduplication**
   - Removes duplicate messages by ID (channel + timestamp)
   - Removes duplicate content across all channels
   - Preserves unique messages from different channels

4. **Incremental Fetching**
   - Tracks last fetch timestamp in `last_fetch_time.json`
   - Only fetches new logs since last run
   - Avoids re-processing the same messages

5. **Excel Export with Timestamps**
   - Auto-generates Excel files with timestamp in filename
   - Formatted columns with proper widths
   - Includes Channel name for easy filtering

6. **Improved Error Handling**
   - Continues processing even if one channel fails
   - Clear console output with progress indicators
   - Detailed error messages for troubleshooting

### 📁 New Files

- `multi-channel-log-fetcher.js` - Core fetcher for all channels
- `convert-to-excel.js` - Converts text logs to Excel format
- `scheduler.js` - Automated cron scheduler (main entry point)
- `README.md` - Comprehensive documentation
- `QUICKSTART.md` - 5-minute setup guide
- `.env.example` - Environment variable template

### 🔄 Modified Files

- `package.json` - Updated scripts and dependencies (removed googleapis, added xlsx)
- `.gitignore` - Added new output files

### 🗑️ Deprecated Files (Keep for Reference)

The old files are preserved but no longer used:
- `automated-logs-fetcher.js` - Old Google Sheets integration
- `get_logs_52c4.js` - Old single-channel fetcher
- `config.json` - Old channel configuration

### 📊 Output Comparison

**Before:**
- Manual execution required
- One channel at a time
- Google Sheets integration (complex setup)

**After:**
- Fully automated (every 3 hours)
- All 6 channels in parallel
- Excel export (no external dependencies)
- Timestamped files for historical records

### 🚀 Usage

**Start Automated Scheduler:**
```bash
npm start
```

**Manual One-Time Fetch:**
```bash
npm run manual
```

**Individual Steps:**
```bash
npm run fetch    # Fetch logs only
npm run convert  # Convert to Excel only
```

### 🎯 Channels Monitored

1. Live V2 (`CJ9F26TLM`)
2. Live API (`C031U4F4K6H`)
3. Master Channel (`C015U4U3EKW`)
4. Staging Channel (`C06LC14BW4C`)
5. CAX Live Channel (`C05FSFEBPTL`)
6. CAX Staging Channel (`C04LQ321DAQ`)

### 📈 Benefits

- ✅ **No manual intervention** - Runs automatically in background
- ✅ **No duplicate logs** - Smart deduplication across all channels
- ✅ **Historical records** - Timestamped Excel files for each run
- ✅ **Incremental sync** - Only fetches new logs
- ✅ **Production ready** - Can be deployed with PM2 for 24/7 operation

### 🔧 Configuration

All configuration is in `multi-channel-log-fetcher.js`:
- Slack token (line 9)
- Channels to monitor (lines 11-18)
- Excluded error patterns (lines 21-118)

Schedule configuration in `scheduler.js`:
- Cron schedule (line 6) - Default: every 3 hours

### 📝 Testing

The system has been tested with:
- Multiple channels simultaneously
- Deduplication logic
- Time range handling
- Excel export formatting

### 🐛 Breaking Changes

None. This is an additive change. Old scripts still work but are superseded by the new system.

---

**Ready to merge and deploy!** 🚀
