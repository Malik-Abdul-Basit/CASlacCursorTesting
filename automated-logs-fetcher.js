const { WebClient } = require('@slack/web-api');
const { google } = require('googleapis');
const cron = require('node-cron');
const dayjs = require('dayjs');
const fs = require('fs');
require('dotenv').config();

// Load configuration
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// Initialize Slack client
const slackToken = process.env.SLACK_BOT_TOKEN;
const slackClient = new WebClient(slackToken);

// Google Sheets configuration
const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

// File to track last fetch time for each channel
const LAST_FETCH_FILE = './last-fetch-times.json';

// Initialize or load last fetch times
function loadLastFetchTimes() {
  if (fs.existsSync(LAST_FETCH_FILE)) {
    return JSON.parse(fs.readFileSync(LAST_FETCH_FILE, 'utf8'));
  }
  return {};
}

function saveLastFetchTimes(times) {
  fs.writeFileSync(LAST_FETCH_FILE, JSON.stringify(times, null, 2), 'utf8');
}

// Google Sheets authentication
async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: './google-credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

// Check if attachment text should be excluded
function isExcludedAttachmentText(attachmentText) {
  return config.excludedPatterns.some((pattern) => attachmentText.includes(pattern));
}

// Check if message should be included
function shouldIncludeMessage(attachmentText, seenAttachmentTexts) {
  return attachmentText
    && !seenAttachmentTexts.has(attachmentText)
    && !isExcludedAttachmentText(attachmentText);
}

// Fetch logs from a single Slack channel
async function fetchLogsFromChannel(channelId, channelName, startTime, endTime) {
  console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Fetching logs from ${channelName} (${channelId})...`);
  
  let allMessages = [];
  let cursor;

  try {
    do {
      const response = await slackClient.conversations.history({
        channel: channelId,
        oldest: startTime,
        latest: endTime,
        limit: 200,
        cursor,
        inclusive: true,
      });

      if (response.messages) {
        allMessages = allMessages.concat(response.messages);
      }
      cursor = response.response_metadata?.next_cursor;
    } while (cursor);

    // Filter messages
    const filteredMessages = [];
    const seenAttachmentTexts = new Set();

    for (const msg of allMessages) {
      let attachmentText = '';
      if (msg.attachments && msg.attachments.length > 0) {
        attachmentText = msg.attachments.map(att => att.text || att.fallback || '').join(' ');
      }

      if (!attachmentText && msg.text) {
        attachmentText = msg.text;
      }

      if (shouldIncludeMessage(attachmentText, seenAttachmentTexts)) {
        filteredMessages.push(msg);
        seenAttachmentTexts.add(attachmentText);
      }
    }

    console.log(`  → Found ${filteredMessages.length} unique filtered messages`);

    // Parse messages for Google Sheets
    const parsedMessages = filteredMessages.map(msg => {
      let message_text = '';
      let level = 'Unknown';
      let userAccount = '';
      let file = '';
      let line = '';
      let stackTrace = '';

      const att0 = msg.attachments?.[0];

      if (att0?.text) {
        message_text = att0.text;
        level = att0.fields?.[0]?.value || level;

        if (level === 'Unknown') {
          const m = att0.text.match(/\*Level:\*\s*\n?([A-Z]+)/i);
          if (m?.[1]) level = m[1].toUpperCase();
        }

        // Extract additional fields
        const userAccountMatch = message_text.match(/UserAccount["\s:]+(\d+)/);
        if (userAccountMatch) userAccount = userAccountMatch[1];

        const fileMatch = message_text.match(/File:\s*([^\n]+)/);
        if (fileMatch) file = fileMatch[1].trim();

        const lineMatch = message_text.match(/Line:\s*(\d+)/);
        if (lineMatch) line = lineMatch[1];

        const stackTraceMatch = message_text.match(/StackTrace:\s*([\s\S]+?)(?:\n\*|$)/);
        if (stackTraceMatch) stackTrace = stackTraceMatch[1].trim().substring(0, 500); // Limit stack trace length

      } else if (msg.text) {
        message_text = msg.text;
        const m = msg.text.match(/\b(INFO|WARNING|ERROR|CRITICAL|DEBUG)\b/i);
        if (m?.[1]) level = m[1].toUpperCase();
      } else {
        message_text = 'No text content';
      }

      const timestamp = dayjs.unix(Number(String(msg.ts).split('.')[0])).format('YYYY-MM-DD HH:mm:ss');
      const messageLink = `https://app.slack.com/archives/${channelId}/p${String(msg.ts).replace('.', '')}`;

      return {
        timestamp,
        channel: channelName,
        level,
        message: message_text.substring(0, 1000), // Limit message length
        userAccount,
        file,
        line,
        stackTrace,
        link: messageLink
      };
    });

    return parsedMessages;
  } catch (error) {
    console.error(`  ✗ Error fetching logs from ${channelName}:`, error.message);
    return [];
  }
}

// Append logs to Google Sheets
async function appendToGoogleSheets(logs) {
  if (logs.length === 0) {
    console.log('No logs to append to Google Sheets');
    return;
  }

  try {
    const sheets = await getGoogleSheetsClient();
    
    // Prepare rows for Google Sheets
    const rows = logs.map(log => [
      log.timestamp,
      log.channel,
      log.level,
      log.message,
      log.userAccount,
      log.file,
      log.line,
      log.stackTrace,
      log.link
    ]);

    // Check if sheet exists and create header if needed
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Logs!A1:I1',
      });

      // If no data, add headers
      if (!response.data.values || response.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: 'Logs!A1:I1',
          valueInputOption: 'RAW',
          resource: {
            values: [['Timestamp', 'Channel', 'Level', 'Message', 'User Account', 'File', 'Line', 'Stack Trace', 'Link']]
          }
        });
      }
    } catch (error) {
      // Sheet might not exist, create headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Logs!A1:I1',
        valueInputOption: 'RAW',
        resource: {
          values: [['Timestamp', 'Channel', 'Level', 'Message', 'User Account', 'File', 'Line', 'Stack Trace', 'Link']]
        }
      });
    }

    // Append data
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Logs!A2:I',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: rows
      }
    });

    console.log(`✓ Successfully appended ${logs.length} logs to Google Sheets`);
  } catch (error) {
    console.error('✗ Error appending to Google Sheets:', error.message);
    // Save to backup file if Google Sheets fails
    const backupFile = `backup-logs-${dayjs().format('YYYY-MM-DD-HHmmss')}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(logs, null, 2), 'utf8');
    console.log(`  → Logs saved to backup file: ${backupFile}`);
  }
}

// Main function to fetch and store logs
async function fetchAndStoreLogs() {
  console.log('\n========================================');
  console.log(`Starting log fetch at ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
  console.log('========================================\n');

  const lastFetchTimes = loadLastFetchTimes();
  const currentTime = dayjs().unix();
  const allLogs = [];

  // Get enabled channels
  const enabledChannels = config.channels.filter(ch => ch.enabled);

  if (enabledChannels.length === 0) {
    console.log('⚠ No channels enabled in config.json');
    return;
  }

  for (const channel of enabledChannels) {
    // Use last fetch time or default to 3 hours ago
    const lastFetchTime = lastFetchTimes[channel.id] || dayjs().subtract(3, 'hour').unix();
    
    const logs = await fetchLogsFromChannel(
      channel.id,
      channel.name,
      lastFetchTime,
      currentTime
    );

    allLogs.push(...logs);

    // Update last fetch time for this channel
    lastFetchTimes[channel.id] = currentTime;
  }

  // Save updated fetch times
  saveLastFetchTimes(lastFetchTimes);

  // Append all logs to Google Sheets
  await appendToGoogleSheets(allLogs);

  console.log('\n========================================');
  console.log(`Completed at ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
  console.log(`Total logs collected: ${allLogs.length}`);
  console.log('========================================\n');
}

// Schedule the task
function startScheduler() {
  const cronSchedule = process.env.CRON_SCHEDULE || '0 */3 * * *'; // Default: every 3 hours
  
  console.log('========================================');
  console.log('Slack Logs Automation Started');
  console.log('========================================');
  console.log(`Schedule: ${cronSchedule} (every 3 hours)`);
  console.log(`Spreadsheet ID: ${spreadsheetId}`);
  console.log(`Enabled Channels: ${config.channels.filter(ch => ch.enabled).length}`);
  console.log('========================================\n');

  // Run immediately on start
  fetchAndStoreLogs().catch(console.error);

  // Schedule recurring task
  cron.schedule(cronSchedule, () => {
    fetchAndStoreLogs().catch(console.error);
  });

  console.log('✓ Scheduler is running. Press Ctrl+C to stop.\n');
}

// Start the automation
startScheduler();
