# Google Sheets Integration - Complete Setup Guide

This guide will help you set up the automated Slack logs fetcher with Google Sheets integration.

## 📋 Prerequisites

- Node.js (v14 or higher)
- Slack Bot Token with appropriate permissions
- Google Cloud Project with Sheets API enabled
- Google Service Account credentials

---

## 🔧 Step 1: Google Cloud Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"**
3. Enter project name (e.g., "Slack Logs Automation")
4. Click **"Create"**

### 1.2 Enable Google Sheets API

1. In your project, go to **"APIs & Services"** > **"Library"**
2. Search for **"Google Sheets API"**
3. Click on it and press **"Enable"**

### 1.3 Create Service Account

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"Service Account"**
3. Enter details:
   - **Service account name**: `slack-logs-pusher`
   - **Service account ID**: Will auto-generate
   - **Description**: Service account for pushing Slack logs to Google Sheets
4. Click **"Create and Continue"**
5. Skip optional steps and click **"Done"**

### 1.4 Generate Service Account Key

1. Click on the service account you just created
2. Go to **"Keys"** tab
3. Click **"Add Key"** > **"Create new key"**
4. Choose **JSON** format
5. Click **"Create"**
6. A JSON file will download - **keep this safe!**

---

## 📊 Step 2: Google Sheets Setup

### 2.1 Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new blank spreadsheet
3. Name it (e.g., "Slack Error Logs")
4. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```

### 2.2 Share Sheet with Service Account

1. Click the **"Share"** button in your Google Sheet
2. Paste the **service account email** from the JSON file
   - Format: `slack-logs-pusher@your-project.iam.gserviceaccount.com`
3. Set permission to **"Editor"**
4. **Uncheck** "Notify people"
5. Click **"Share"**

---

## 🔑 Step 3: Environment Configuration

### 3.1 Copy Environment Template

```bash
cp .env.example .env
```

### 3.2 Configure .env File

Open `.env` and fill in the following:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-312776062608-9167975865845-YOUR_ACTUAL_TOKEN

# Google Sheets Configuration
GOOGLE_SPREADSHEET_ID=1ABC123XYZ456_YOUR_SPREADSHEET_ID
GOOGLE_SHEET_NAME=Slack Logs

# Google Service Account Key
# Paste the ENTIRE contents of your downloaded JSON file on one line
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
```

#### 📝 Important Notes:

- **SLACK_BOT_TOKEN**: Your existing Slack bot token
- **GOOGLE_SPREADSHEET_ID**: The ID from Step 2.1
- **GOOGLE_SHEET_NAME**: Name of the sheet tab (default: "Slack Logs")
- **GOOGLE_SERVICE_ACCOUNT_KEY**: The entire JSON content from Step 1.4 as a **single line**

#### 🔄 Converting JSON to Single Line:

```bash
# Linux/Mac
cat service-account-key.json | jq -c . | tr -d '\n'

# Or manually: Remove all newlines and keep it as one line
```

---

## 📦 Step 4: Install Dependencies

```bash
npm install
```

This will install:
- `googleapis` - Google Sheets API client
- `@slack/web-api` - Slack API client
- `dayjs` - Date/time handling
- `node-cron` - Scheduler
- `dotenv` - Environment variables

---

## 🚀 Step 5: Run the Application

### Option A: Automated Scheduler (Recommended)

Run every 3 hours automatically:

```bash
npm run google-sheets
```

This will:
- ✅ Run immediately on startup
- ✅ Fetch logs from all 6 channels
- ✅ Deduplicate across channels
- ✅ Push to Google Sheets
- ✅ Repeat every 3 hours automatically

### Option B: One-Time Manual Run

Run once and exit:

```bash
npm run google-sheets-once
```

---

## 📊 Expected Output

### Console Output:
```
🚀 Starting Slack Logs to Google Sheets Pusher...
⏰ Run time: 2026-07-15 12:00:00
📅 Fetching logs from 2026-07-15 09:00:00 to 2026-07-15 12:00:00

📡 Fetching logs from Live V2 (CJ9F26TLM)...
   ✓ Fetched 45 raw messages from Live V2

📡 Fetching logs from Live API (C031U4F4K6H)...
   ✓ Fetched 23 raw messages from Live API

...

📦 Total raw messages fetched: 180
✨ After deduplication: 85 unique messages
📝 After filtering levels (ERROR, CRITICAL, DEBUG): 42 rows

📊 Pushing 42 logs to Google Sheets...
   ✅ Successfully pushed 42 logs to Google Sheets!
   📄 View at: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID

✅ Process completed successfully!
```

### Google Sheets Output:

| Timestamp | Channel | Message | Link | Level |
|-----------|---------|---------|------|-------|
| 2026-07-15 10:30:15 | Live V2 | Attempt to read property "id" on null | [Link] | ERROR |
| 2026-07-15 10:45:22 | CAX Live Channel | Database connection failed | [Link] | CRITICAL |
| ... | ... | ... | ... | ... |

---

## 🔄 Scheduler Details

The scheduler runs at:
- **00:00** (Midnight)
- **03:00** (3 AM)
- **06:00** (6 AM)
- **09:00** (9 AM)
- **12:00** (Noon)
- **15:00** (3 PM)
- **18:00** (6 PM)
- **21:00** (9 PM)

Each run fetches logs from the **last 3 hours**.

---

## 🐛 Troubleshooting

### Error: "Invalid Credentials"

**Cause**: Service account key is incorrect or malformed

**Solution**:
1. Verify the JSON key is on a single line in `.env`
2. Ensure no extra quotes or escaping
3. Re-download the service account key if needed

### Error: "Permission denied"

**Cause**: Service account doesn't have access to the spreadsheet

**Solution**:
1. Open your Google Sheet
2. Click "Share"
3. Add the service account email with "Editor" permissions

### Error: "Spreadsheet not found"

**Cause**: Incorrect spreadsheet ID

**Solution**:
1. Double-check the spreadsheet ID in `.env`
2. Ensure the URL format is correct
3. Make sure the sheet hasn't been deleted

### Error: "API has not been enabled"

**Cause**: Google Sheets API not enabled in project

**Solution**:
1. Go to Google Cloud Console
2. Navigate to "APIs & Services" > "Library"
3. Enable "Google Sheets API"

---

## 📝 Channel Configuration

The script fetches from these channels by default:

```javascript
const CHANNELS = [
  { id: 'CJ9F26TLM', name: 'Live V2' },
  { id: 'C031U4F4K6H', name: 'Live API' },
  { id: 'C015U4U3EKW', name: 'Master Channel' },
  { id: 'C06LC14BW4C', name: 'Staging Channel' },
  { id: 'C05FSFEBPTL', name: 'CAX Live Channel' },
  { id: 'C04LQ321DAQ', name: 'CAX Staging Channel' },
];
```

To modify channels, edit `google-sheets-log-pusher.js` lines 16-23.

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** to git
2. **Keep service account key secure**
3. **Use environment variables** for all secrets
4. **Rotate tokens** periodically
5. **Limit service account permissions** to only what's needed

---

## 🚀 Production Deployment

### Using PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start scheduler-google-sheets.js --name slack-logs-google-sheets

# View logs
pm2 logs slack-logs-google-sheets

# Auto-restart on server reboot
pm2 startup
pm2 save
```

### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["node", "scheduler-google-sheets.js"]
```

---

## 📞 Support

For issues or questions, contact the development team.

---

## ✅ Quick Checklist

- [ ] Google Cloud project created
- [ ] Google Sheets API enabled
- [ ] Service account created and key downloaded
- [ ] Google Sheet created and shared with service account
- [ ] `.env` file configured with all credentials
- [ ] Dependencies installed (`npm install`)
- [ ] Test run completed successfully (`npm run google-sheets-once`)
- [ ] Automated scheduler running (`npm run google-sheets`)

---

**Last Updated**: 2026-07-15
