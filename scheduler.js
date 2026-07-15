const cron = require('node-cron');
require('dotenv').config(); // Load environment variables
const { fetchAllChannelLogs } = require('./multi-channel-log-fetcher');
const { convertLogsToExcel } = require('./convert-to-excel');
const dayjs = require('dayjs');

// Configuration
const CRON_SCHEDULE = '0 */3 * * *'; // Every 3 hours at minute 0 (00:00, 03:00, 06:00, etc.)

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   Multi-Channel Slack Log Fetcher - Automated Scheduler   ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');
console.log('⏰ Schedule: Every 3 hours');
console.log('📋 Channels: 6 channels monitored');
console.log('💾 Output: unique_slack_logs.txt → slack_logs_[timestamp].xlsx');
console.log('');

// Function to run the complete process
async function runLogFetchProcess() {
  const startTime = dayjs();
  console.log('\n' + '═'.repeat(60));
  console.log(`🕐 Process Started at: ${startTime.format('YYYY-MM-DD HH:mm:ss')}`);
  console.log('═'.repeat(60));

  try {
    // Step 1: Fetch logs from all channels
    console.log('\n📥 Step 1: Fetching logs from all Slack channels...');
    await fetchAllChannelLogs();

    // Step 2: Convert to Excel
    console.log('\n📊 Step 2: Converting logs to Excel...');
    const excelFile = convertLogsToExcel();

    const endTime = dayjs();
    const duration = endTime.diff(startTime, 'second');

    console.log('\n' + '═'.repeat(60));
    console.log(`✅ Process Completed Successfully!`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📁 Output Files:`);
    console.log(`   - unique_slack_logs.txt`);
    if (excelFile) {
      console.log(`   - ${excelFile}`);
    }
    console.log(`⏭️  Next run in 3 hours`);
    console.log('═'.repeat(60));
  } catch (error) {
    console.error('\n❌ Error during process:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Schedule the task to run every 3 hours
cron.schedule(CRON_SCHEDULE, () => {
  console.log('\n⏰ Scheduled run triggered...');
  runLogFetchProcess();
}, {
  timezone: "UTC"
});

console.log('✅ Scheduler is running...');
console.log('⏰ Next scheduled runs:');

// Calculate next 5 run times
const now = dayjs();
for (let i = 0; i < 5; i++) {
  const nextHour = Math.ceil(now.hour() / 3) * 3 + (i * 3);
  const nextRun = now.hour(nextHour % 24).minute(0).second(0);
  
  if (nextHour >= 24) {
    nextRun.add(Math.floor(nextHour / 24), 'day');
  }
  
  console.log(`   ${i + 1}. ${nextRun.format('YYYY-MM-DD HH:mm:ss')}`);
}

console.log('\n💡 Press Ctrl+C to stop the scheduler');
console.log('━'.repeat(60));

// Run immediately on startup
console.log('\n🚀 Running initial fetch now...');
runLogFetchProcess();
