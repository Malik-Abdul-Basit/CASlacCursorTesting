const { WebClient } = require('@slack/web-api'); // Import Slack Web API client
const dayjs = require('dayjs'); // Import dayjs for date/time handling
const fs = require('fs'); // Import fs for file writing
const XLSX = require('xlsx');

const filterKeyword = 'Error';

// Your Slack Bot Token (must start with xoxb- and have correct permissions)
require('dotenv').config();
const token = process.env.SLACK_BOT_TOKEN || 'your-bot-token-here'; // Get from environment variable

// Initialize the Slack Web API client
const client = new WebClient(token);

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

function isExcludedAttachmentText(attachmentText) {
  return EXCLUDED_ATTACHMENT_PATTERNS.some((pattern) => attachmentText.includes(pattern));
}

function shouldIncludeMessage(attachmentText, seenAttachmentTexts) {
  return attachmentText
    && !seenAttachmentTexts.has(attachmentText)
    && !isExcludedAttachmentText(attachmentText);
}

// Calculate the Unix timestamps for the last 24 hours
//const startTime = dayjs().subtract(24, 'hour').unix(); // 24 hours ago from current date time
//const startTime = dayjs().subtract(1, 'day').startOf('day').unix(); // 1 day ago from the current day start time
//const endTime = dayjs().endOf('day').unix(); // Current time (now)

//const startTime= dayjs('2026-02-16 19:00:01').unix(); // 02:00PM - 08:00 PM
//const endTime = dayjs('2026-02-17 13:59:59').unix();
//const endTime = dayjs().unix(); // Current time (now)

const startTime = dayjs('2026-07-13 16:00:01').unix();
const endTime   = dayjs('2026-07-14 15:45:00').unix();

// The channel ID you want to scrape logs from
const channelId = 'CJ9F26TLM';        // Live V2
//const channelId = 'C031U4F4K6H';      // Live API
//const channelId = 'C015U4U3EKW';      // Master Channel
//const channelId = 'C06LC14BW4C';      // Staging Channel
//const channelId = 'C05FSFEBPTL';      // CAX Live Channel
//const channelId = 'C04LQ321DAQ';      // CAX Staging Channel
//const channelId = 'C09TV9NNCUW';      // GISA Live Channel
//const channelId = 'C09RPSUA62K';      // GISA Staging Channel

// Main function to fetch and save Slack logs
async function fetchSlackLogs() {
  let allMessages = []; // Array to store all fetched messages
  let cursor; // Pagination cursor for Slack API

  // Fetch messages in a loop to handle pagination
  do {
    // Call Slack API to get conversation history for the channel
    const response = await client.conversations.history({
      channel: channelId,      // Channel to fetch from
      oldest: startTime,       // Only messages after this timestamp
      latest: endTime,         // Only messages before this timestamp
      limit: 200,              // Max messages per API call
      cursor,                  // Pagination cursor
      inclusive: true,         // Include messages at the boundaries
      query: filterKeyword, // filter message
    });

    // Add fetched messages to the array
    if (response.messages) {
      allMessages = allMessages.concat(response.messages);
    }
    // Update cursor for next page (if any)
    cursor = response.response_metadata?.next_cursor;
  } while (cursor);

  const filteredMessages = [];
  const seenAttachmentTexts = new Set();

  for (const msg of allMessages) {

    let attachmentText = '';
    if (msg.attachments && msg.attachments.length > 0) {
        attachmentText = msg.attachments.map(att => att.text || att.fallback || '').join(' ');
    }

    // If no attachment text, use message text as fallback
    if (!attachmentText && msg.text) {
      attachmentText = msg.text;
    }
    
    if (shouldIncludeMessage(attachmentText, seenAttachmentTexts)) {
      filteredMessages.push(msg);
      seenAttachmentTexts.add(attachmentText);
    }
  }

  console.log('Number of filtered messages:', filteredMessages.length);

  const output = filteredMessages.map(msg => {
    let message_text = '';
    let level = 'Unknown';

    const att0 = msg.attachments?.[0];

    // Prefer attachment text
    if (att0?.text) {
      message_text = att0.text;

      // Try to read Level from fields (if present)
      level = att0.fields?.[0]?.value || level;

      // If fields not present, try to parse "*Level:* XYZ" from text
      if (level === 'Unknown') {
        const m = att0.text.match(/\*Level:\*\s*\n?([A-Z]+)/i);
        if (m?.[1]) level = m[1].toUpperCase();
      }
    } else if (msg.text) {
      // Fallback to plain message text
      message_text = msg.text;

      // Optional: parse "Level" if your text contains it
      const m = msg.text.match(/\b(INFO|WARNING|ERROR|CRITICAL|DEBUG)\b/i);
      if (m?.[1]) level = m[1].toUpperCase();
    } else {
      message_text = 'No text content';
    }

    const timestamp = dayjs.unix(Number(String(msg.ts).split('.')[0])).format('YYYY-MM-DD HH:mm:ss');
    const messageLink = `https://app.slack.com/archives/${channelId}/p${String(msg.ts).replace('.', '')}`;

    return `[${timestamp}] ${message_text} (${messageLink}) ${level}`;
  }).join('\n');

  // Write the formatted messages to a text file
  fs.writeFileSync('unique_slack_logs.txt', output, 'utf8');
}

// Run the main function and catch any errors
fetchSlackLogs().catch(console.error);
console.log('Processing...');