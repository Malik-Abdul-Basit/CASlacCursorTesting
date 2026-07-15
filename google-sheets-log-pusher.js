const { WebClient } = require('@slack/web-api');
const dayjs = require('dayjs');
const { google } = require('googleapis');
require('dotenv').config();

// Slack configuration
const token = process.env.SLACK_BOT_TOKEN;
const client = new WebClient(token);

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Slack Logs';

// Channel configurations with names
const CHANNELS = [
  { id: 'CJ9F26TLM', name: 'Live V2' },
  { id: 'C031U4F4K6H', name: 'Live API' },
  { id: 'C015U4U3EKW', name: 'Master Channel' },
  { id: 'C06LC14BW4C', name: 'Staging Channel' },
  { id: 'C05FSFEBPTL', name: 'CAX Live Channel' },
  { id: 'C04LQ321DAQ', name: 'CAX Staging Channel' },
];

// Excluded patterns (from original get_logs.js)
const EXCLUDED_ATTACHMENT_PATTERNS = [
  'Booking Status Update For Cancelled Booking',
  'Not able to entertain',
  'Reminders are created for booking_id',
  'Hostaway Invoice Update ',
  'All settings are off for this booking,',
  'Connection timed out after',
  'User Account Not Active',
  'send OTA message failed',
  'Booking Source not Supported',
  'Email Content  is inactive',
  'VerifyBookingJob',
  'System Job {"id":',
  "SMS billing plan isn't subscribed",
  'No such customer:',
  'PropertyInfo not Found:',
  'Current PGTotalPaidAmount =&gt;',
  'SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry',
  'No such checkout.session:',
  'Email Content is inactive',
  'cURL error 6: Could not resolve host:',
  'cURL error 28: Operation timed out after 30000 milliseconds with 0 bytes received',
  'cURL error 7: Failed to connect to',
  'No such PaymentMethod',
  "No such subscription: 'in_1S",
  "No such subscription: 'ch_3",
  "SQLSTATE[22001]: String data, right truncated: 1406 Data too long for column 'payload' at row ",
  'cURL error 35: OpenSSL SSL_connect: SSL_ERROR_SYSCALL',
  'Booking Amount not valid or Zero for Booking ID',
  'Hostaway add_payment',
  'Hostaway add finance fields',
  'does not exist in account',
  'Booking Source not Active',
  'Booking Source is not active to fetch the booking',
  'Booking Source not active for cancellation request',
  'Stripe Hook Received: customer.subscription.created',
  'Stripe Hook Received: customer.subscription.updated',
  'Stripe Hook Received: payment_method.attached',
  'Stripe Hook Received: invoice.payment_failed',
  'Stripe Hook Received: customer.subscription.trial_will_end',
  'Your card was declined',
  'Your card number is incorrect',
  'Your card has insufficient funds',
  "Your card's security code is incorrect",
  'Property Info not active for cancellation request',
  'This transaction has been declined',
  'Sorry. Terms and conditions not found',
  'request received but the booking not found or already cancelled',
  'request received booking not found or already cancelled',
  'Booking detail not found (by getSecurityScheduleSettings)',
  'not enabled for this property',
  'Payment Invoice already updated on PMS or preferences_balance_not_reflect_able_pms_ids',
  'Currencies Updated',
  'Property Key is changed On PMS. Please refresh the page in a while to see updates',
  'Charge Failed In Runtime Helper',
  'Stripe Billing Plan not found to mark usage',
  'This object cannot be accessed right now because another API request or Stripe process is currently accessing it',
  'Gateway change',
  'Billing Customer not Found for this invoice',
  'You cannot confirm this PaymentIntent because it has already succeeded',
  'You cannot confirm this PaymentIntent because it has a status of processing',
  'Booking not found on PMS',
  'Booking already cancelled',
  'Booking Info not found for cancellation request',
  'Booking Info not found',
  'Request not supported for this PMS',
  'REMOVING Email! Email address is not correct',
  'SMX PMS Properties',
  'Payment Gateway not Active For Payments',
  'Logging Token at BAModifyJob',
  'Payment attempt failed. Please review your booking source and property settings',
  'Stripe usage billing volume is Zero',
  'No Transaction found against VCC Booking',
  'Get invoice link by intent, 3DS link is not available',
  'Siteminders raw bookings with 2 month old checkin date are deleted',
  '(Partially Paid) on PMS, Modify Job triggered',
  'Missing payment id to refund against in Guesty',
  'Property Info not found or Not Active',
  'Authorization already attempted',
  'Booking Status from PMS to Verify Cancelled Booking is not Valid to entertain Booking',
  'Refund amount is greater than Charged Amount',
  "This invoice is already finalized, you can't re-finalize a non-draft invoice",
  'Charge Failed In Payment Confirmation',
  'Cannot Copy Settings From a deleted Booking Source',
  'Your card does not support this type of purchase',
  'Account not active for cancellation request',
  'afterAuthentication, Booking not found',
  'Stripe WebHook Received, not any action implemented',
  'Transaction is already reported to the billing',
  'Your card has expired',
  'Your account cannot currently make live charges',
  'User who approved this connection is not active anymore',
  'User PMS not active. user_account_id',
  'The transaction has already been settled or reversed',
  'The transaction identifier sent with this request has already been used',
  'Properties are not available',
  'Hotel Not found',
  'Fail to fetch booking from PMS',
  'refresh token not found',
  'PMS not integrated with the account',
  'Invalid Reservation',
  'Invalid amount',
  'Rate limit cooldown activated',
];

// Skip levels (from convert.js)
const SKIP_LEVELS = new Set(['INFO', 'NOTICE', 'WARNING']);

function isExcludedAttachmentText(attachmentText) {
  return EXCLUDED_ATTACHMENT_PATTERNS.some((pattern) => attachmentText.includes(pattern));
}

function shouldIncludeMessage(attachmentText, seenAttachmentTexts) {
  return attachmentText
    && !seenAttachmentTexts.has(attachmentText)
    && !isExcludedAttachmentText(attachmentText);
}

// Initialize Google Sheets API
async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

// Fetch logs from a single channel
async function fetchChannelLogs(channelId, channelName, startTime, endTime) {
  console.log(`\n📡 Fetching logs from ${channelName} (${channelId})...`);
  
  let allMessages = [];
  let cursor;

  do {
    const response = await client.conversations.history({
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

  console.log(`   ✓ Fetched ${allMessages.length} raw messages from ${channelName}`);
  return allMessages.map(msg => ({ ...msg, channelId, channelName }));
}

// Process and deduplicate messages
function processMessages(allMessages) {
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

  return filteredMessages;
}

// Convert messages to Google Sheets rows
function messagesToRows(messages) {
  const rows = [];

  for (const msg of messages) {
    let message_text = '';
    let level = 'Unknown';

    const att0 = msg.attachments?.[0];

    if (att0?.text) {
      message_text = att0.text;
      level = att0.fields?.[0]?.value || level;

      if (level === 'Unknown') {
        const m = att0.text.match(/\*Level:\*\s*\n?([A-Z]+)/i);
        if (m?.[1]) level = m[1].toUpperCase();
      }
    } else if (msg.text) {
      message_text = msg.text;
      const m = msg.text.match(/\b(INFO|WARNING|ERROR|CRITICAL|DEBUG)\b/i);
      if (m?.[1]) level = m[1].toUpperCase();
    } else {
      message_text = 'No text content';
    }

    // Skip INFO, NOTICE, WARNING levels (from convert.js logic)
    if (SKIP_LEVELS.has(level)) {
      continue;
    }

    const timestamp = dayjs.unix(Number(String(msg.ts).split('.')[0])).format('YYYY-MM-DD HH:mm:ss');
    const messageLink = `https://app.slack.com/client/${msg.channelId}/p${String(msg.ts).replace('.', '')}`;

    rows.push([timestamp, msg.channelName, message_text, messageLink, level]);
  }

  return rows;
}

// Push logs to Google Sheets
async function pushToGoogleSheets(rows) {
  if (rows.length === 0) {
    console.log('\n⚠️  No new logs to push to Google Sheets');
    return;
  }

  console.log(`\n📊 Pushing ${rows.length} logs to Google Sheets...`);

  const sheets = await getGoogleSheetsClient();

  // Add header row
  const values = [
    ['Timestamp', 'Channel', 'Message', 'Link', 'Level'],
    ...rows
  ];

  // Check if sheet exists, if not create it
  try {
    await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
    });
  } catch (error) {
    // Sheet doesn't exist, create it
    console.log(`   Creating new sheet: ${SHEET_NAME}`);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          addSheet: {
            properties: {
              title: SHEET_NAME,
            },
          },
        }],
      },
    });
  }

  // Append data to the sheet
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values,
    },
  });

  console.log(`   ✅ Successfully pushed ${rows.length} logs to Google Sheets!`);
  console.log(`   📄 View at: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`);
}

// Main function
async function main() {
  console.log('🚀 Starting Slack Logs to Google Sheets Pusher...');
  console.log(`⏰ Run time: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);

  // Calculate time range (last 3 hours by default)
  const endTime = dayjs().unix();
  const startTime = dayjs().subtract(3, 'hour').unix();

  console.log(`📅 Fetching logs from ${dayjs.unix(startTime).format('YYYY-MM-DD HH:mm:ss')} to ${dayjs.unix(endTime).format('YYYY-MM-DD HH:mm:ss')}`);

  try {
    // Fetch logs from all channels in parallel
    const fetchPromises = CHANNELS.map(channel =>
      fetchChannelLogs(channel.id, channel.name, startTime, endTime)
    );

    const channelMessages = await Promise.all(fetchPromises);
    const allMessages = channelMessages.flat();

    console.log(`\n📦 Total raw messages fetched: ${allMessages.length}`);

    // Process and deduplicate
    const filteredMessages = processMessages(allMessages);
    console.log(`✨ After deduplication: ${filteredMessages.length} unique messages`);

    // Convert to rows
    const rows = messagesToRows(filteredMessages);
    console.log(`📝 After filtering levels (ERROR, CRITICAL, DEBUG): ${rows.length} rows`);

    // Push to Google Sheets
    await pushToGoogleSheets(rows);

    console.log('\n✅ Process completed successfully!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
