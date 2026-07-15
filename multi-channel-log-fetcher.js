const { WebClient } = require('@slack/web-api');
const dayjs = require('dayjs');
const fs = require('fs');
const path = require('path');

// Configuration
const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN || '';
const LAST_FETCH_FILE = 'last_fetch_time.json';

if (!SLACK_TOKEN) {
  console.error('❌ Error: SLACK_BOT_TOKEN environment variable is not set!');
  console.error('Please set it using one of these methods:');
  console.error('1. Create a .env file with: SLACK_BOT_TOKEN=xoxb-your-token');
  console.error('2. Export it: export SLACK_BOT_TOKEN=xoxb-your-token');
  console.error('3. Run with: SLACK_BOT_TOKEN=xoxb-your-token npm start');
  process.exit(1);
}

// All Slack channels to monitor
const CHANNELS = [
  { id: 'CJ9F26TLM', name: 'Live V2' },
  { id: 'C031U4F4K6H', name: 'Live API' },
  { id: 'C015U4U3EKW', name: 'Master Channel' },
  { id: 'C06LC14BW4C', name: 'Staging Channel' },
  { id: 'C05FSFEBPTL', name: 'CAX Live Channel' },
  { id: 'C04LQ321DAQ', name: 'CAX Staging Channel' },
  // { id: 'C09TV9NNCUW', name: 'GISA Live Channel' },
  // { id: 'C09RPSUA62K', name: 'GISA Staging Channel' },
];

const EXCLUDED_PATTERNS = [
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

const client = new WebClient(SLACK_TOKEN);

// Check if message should be excluded
function isExcludedMessage(text) {
  return EXCLUDED_PATTERNS.some(pattern => text.includes(pattern));
}

// Get last fetch time or default to 3 hours ago
function getLastFetchTime() {
  try {
    if (fs.existsSync(LAST_FETCH_FILE)) {
      const data = JSON.parse(fs.readFileSync(LAST_FETCH_FILE, 'utf8'));
      return data.lastFetchTime;
    }
  } catch (error) {
    console.log('No previous fetch time found, starting from 3 hours ago');
  }
  // Default: 3 hours ago
  return dayjs().subtract(3, 'hours').unix();
}

// Save current fetch time
function saveLastFetchTime(timestamp) {
  fs.writeFileSync(
    LAST_FETCH_FILE,
    JSON.stringify({ 
      lastFetchTime: timestamp,
      lastFetchDate: dayjs.unix(timestamp).format('YYYY-MM-DD HH:mm:ss')
    }, null, 2),
    'utf8'
  );
}

// Fetch logs from a single channel
async function fetchChannelLogs(channelId, channelName, startTime, endTime) {
  console.log(`\n📥 Fetching logs from ${channelName} (${channelId})...`);
  
  let allMessages = [];
  let cursor;

  try {
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

    console.log(`   ✓ Fetched ${allMessages.length} messages from ${channelName}`);
    
    // Add channel info to each message
    return allMessages.map(msg => ({
      ...msg,
      channelId,
      channelName
    }));
  } catch (error) {
    console.error(`   ✗ Error fetching from ${channelName}:`, error.message);
    return [];
  }
}

// Process and deduplicate messages
function processMessages(allMessages) {
  console.log(`\n🔄 Processing ${allMessages.length} total messages...`);
  
  const filteredMessages = [];
  const seenAttachmentTexts = new Set();
  const seenMessageIds = new Set();

  for (const msg of allMessages) {
    // Skip duplicates by message ID
    const msgId = `${msg.channelId}-${msg.ts}`;
    if (seenMessageIds.has(msgId)) continue;
    seenMessageIds.add(msgId);

    let attachmentText = '';
    if (msg.attachments && msg.attachments.length > 0) {
      attachmentText = msg.attachments.map(att => att.text || att.fallback || '').join(' ');
    }

    if (!attachmentText && msg.text) {
      attachmentText = msg.text;
    }

    // Skip if no content
    if (!attachmentText) continue;

    // Skip excluded patterns
    if (isExcludedMessage(attachmentText)) continue;

    // Skip duplicate content (deduplicate by message text across all channels)
    if (seenAttachmentTexts.has(attachmentText)) continue;
    
    seenAttachmentTexts.add(attachmentText);
    filteredMessages.push(msg);
  }

  console.log(`   ✓ Filtered to ${filteredMessages.length} unique messages`);
  return filteredMessages;
}

// Format messages for output
function formatMessages(messages) {
  return messages.map(msg => {
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

    const timestamp = dayjs.unix(Number(String(msg.ts).split('.')[0])).format('YYYY-MM-DD HH:mm:ss');
    const messageLink = `https://app.slack.com/archives/${msg.channelId}/p${String(msg.ts).replace('.', '')}`;

    return `[${timestamp}] [${msg.channelName}] ${message_text} (${messageLink}) ${level}`;
  }).join('\n');
}

// Main function
async function fetchAllChannelLogs() {
  console.log('🚀 Starting Multi-Channel Slack Log Fetcher');
  console.log('━'.repeat(60));
  
  const startTime = getLastFetchTime();
  const endTime = dayjs().unix();
  
  console.log(`📅 Fetch Time Range:`);
  console.log(`   From: ${dayjs.unix(startTime).format('YYYY-MM-DD HH:mm:ss')}`);
  console.log(`   To:   ${dayjs.unix(endTime).format('YYYY-MM-DD HH:mm:ss')}`);
  console.log(`   Duration: ~${Math.round((endTime - startTime) / 3600)} hours`);

  // Fetch from all channels
  let allMessages = [];
  for (const channel of CHANNELS) {
    const messages = await fetchChannelLogs(channel.id, channel.name, startTime, endTime);
    allMessages = allMessages.concat(messages);
  }

  // Process and deduplicate
  const filteredMessages = processMessages(allMessages);

  // Sort by timestamp (oldest first)
  filteredMessages.sort((a, b) => {
    const tsA = Number(String(a.ts).split('.')[0]);
    const tsB = Number(String(b.ts).split('.')[0]);
    return tsA - tsB;
  });

  // Format and save
  const output = formatMessages(filteredMessages);
  fs.writeFileSync('unique_slack_logs.txt', output, 'utf8');

  // Save last fetch time
  saveLastFetchTime(endTime);

  console.log(`\n✅ Complete! Saved ${filteredMessages.length} unique logs to unique_slack_logs.txt`);
  console.log('━'.repeat(60));
}

// Export for use in scheduler
module.exports = { fetchAllChannelLogs };

// Run if called directly
if (require.main === module) {
  fetchAllChannelLogs()
    .then(() => {
      console.log('✓ Process completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('✗ Error:', error);
      process.exit(1);
    });
}
