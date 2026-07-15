# 📊 Slack Logs to Google Sheets - Automated System

## 🎯 What This Does

Automatically fetches error logs from 6 Slack channels every 3 hours and pushes them to a Google Sheet.

### ✨ Features

- ✅ **Multi-Channel Support**: Fetches from 6 channels simultaneously
  - Live V2 (CJ9F26TLM)
  - Live API (C031U4F4K6H)
  - Master Channel (C015U4U3EKW)
  - Staging Channel (C06LC14BW4C)
  - CAX Live Channel (C05FSFEBPTL)
  - CAX Staging Channel (C04LQ321DAQ)

- ✅ **Smart Deduplication**: Removes duplicate logs across all channels
- ✅ **Level Filtering**: Only includes ERROR, CRITICAL, and DEBUG (skips INFO, WARNING, NOTICE)
- ✅ **Excluded Patterns**: Filters out 117+ known non-actionable errors
- ✅ **Google Sheets Integration**: Auto-appends to your sheet with clean formatting
- ✅ **Automated Scheduling**: Runs every 3 hours without manual intervention
- ✅ **Incremental Updates**: Fetches only new logs since last run

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Credentials

Edit `.env` file and add:

```env
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token-here
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id-here
GOOGLE_SHEET_NAME=Slack Logs
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account"...}
```

### 3. Run

**One-time test run:**
```bash
npm run google-sheets-once
```

**Automated (every 3 hours):**
```bash
npm run google-sheets
```

---

## 📋 Setup Requirements

### Google Cloud Setup (Required)

1. **Create Google Cloud Project**
   - Go to [console.cloud.google.com](https://console.cloud.google.com/)
   - Create new project

2. **Enable Google Sheets API**
   - Go to APIs & Services → Library
   - Search "Google Sheets API" → Enable

3. **Create Service Account**
   - Go to APIs & Services → Credentials
   - Create Service Account
   - Download JSON key

4. **Share Google Sheet**
   - Create a Google Sheet
   - Share with service account email (from JSON)
   - Give "Editor" permission

**Full setup guide**: See `GOOGLE_SHEETS_SETUP.md`

---

## 📊 Output Format

Logs are appended to Google Sheets with these columns:

| Timestamp | Channel | Message | Link | Level |
|-----------|---------|---------|------|-------|
| 2026-07-15 10:30:15 | Live V2 | Attempt to read property "id" on null | [Slack Link] | ERROR |
| 2026-07-15 10:45:22 | CAX Live | Database connection failed | [Slack Link] | CRITICAL |

---

## 🔧 Commands

| Command | Description |
|---------|-------------|
| `npm run google-sheets` | Start automated scheduler (runs every 3 hours) |
| `npm run google-sheets-once` | Run once and exit |
| `npm start` | Old Excel-based system |
| `npm run manual` | Old manual fetch |

---

## ⏰ Schedule

Runs automatically at:
- 00:00 (Midnight)
- 03:00 (3 AM)
- 06:00 (6 AM)
- 09:00 (9 AM)
- 12:00 (Noon)
- 15:00 (3 PM)
- 18:00 (6 PM)
- 21:00 (9 PM)

Each run fetches logs from the **last 3 hours**.

---

## 🗂️ Files

- `google-sheets-log-pusher.js` - Main fetcher and pusher
- `scheduler-google-sheets.js` - Cron scheduler
- `GOOGLE_SHEETS_SETUP.md` - Detailed setup guide
- `QUICKSTART_GOOGLE_SHEETS.md` - 5-minute quick start
- `.env` - Configuration file (add your credentials here)

---

## 🔒 Security

- ✅ All credentials in `.env` (not committed to git)
- ✅ Service account with minimal permissions
- ✅ Environment variables for all secrets
- ✅ No hardcoded tokens

---

## 🐛 Troubleshooting

### "Invalid Credentials"
→ Check `GOOGLE_SERVICE_ACCOUNT_KEY` is on one line in `.env`

### "Permission Denied"
→ Share Google Sheet with service account email

### "Spreadsheet Not Found"
→ Verify `GOOGLE_SPREADSHEET_ID` in `.env`

**Full troubleshooting**: See `GOOGLE_SHEETS_SETUP.md`

---

## 📈 Monitoring

Console output shows:
- Number of messages fetched per channel
- Deduplication statistics
- Rows pushed to Google Sheets
- Direct link to view the sheet

---

## 🚀 Production Deployment

### Using PM2:
```bash
pm2 start scheduler-google-sheets.js --name slack-logs
pm2 startup
pm2 save
```

### Using Docker:
```bash
docker build -t slack-logs-fetcher .
docker run -d --env-file .env slack-logs-fetcher
```

---

## 📞 Support

For issues:
1. Check `GOOGLE_SHEETS_SETUP.md` for detailed troubleshooting
2. Verify all credentials are correct
3. Test with `npm run google-sheets-once` first

---

**Version**: 3.0.0  
**Last Updated**: 2026-07-15
