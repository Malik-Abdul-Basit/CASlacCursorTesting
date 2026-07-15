# 🚀 Quick Start Guide - Google Sheets Integration

Get up and running in 5 minutes!

## Step 1: Install Dependencies (30 seconds)

```bash
npm install
```

## Step 2: Get Google Credentials (2 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable "Google Sheets API"
3. Create Service Account → Download JSON key
4. Create a Google Sheet → Share it with service account email

## Step 3: Configure Environment (1 minute)

```bash
# Copy template
cp .env.example .env

# Edit .env and add:
# - SLACK_BOT_TOKEN (your existing token)
# - GOOGLE_SPREADSHEET_ID (from sheet URL)
# - GOOGLE_SERVICE_ACCOUNT_KEY (paste JSON content as single line)
```

## Step 4: Run! (30 seconds)

### Test Run (one-time):
```bash
npm run google-sheets-once
```

### Automated (every 3 hours):
```bash
npm run google-sheets
```

## ✅ Done!

Check your Google Sheet - logs should appear automatically!

---

## 📊 What It Does

- ✅ Fetches logs from 6 Slack channels
- ✅ Removes duplicates
- ✅ Filters out INFO/WARNING/NOTICE
- ✅ Pushes to Google Sheets
- ✅ Runs automatically every 3 hours

---

## 🆘 Need Help?

See detailed guide: `GOOGLE_SHEETS_SETUP.md`
