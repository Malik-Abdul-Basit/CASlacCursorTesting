const cron = require('node-cron');
const { main } = require('./google-sheets-log-pusher');

console.log('🔄 Slack Logs to Google Sheets - Automated Scheduler');
console.log('⏰ Schedule: Every 3 hours');
console.log('📊 Output: Google Sheets');
console.log('─────────────────────────────────────────────\n');

// Run immediately on startup
console.log('▶️  Running initial fetch...\n');
main().catch(console.error);

// Schedule to run every 3 hours: 0 */3 * * * (at minute 0 of every 3rd hour)
cron.schedule('0 */3 * * *', () => {
  console.log('\n\n⏰ Scheduled run triggered...\n');
  main().catch(console.error);
});

console.log('✅ Scheduler started successfully!');
console.log('⏰ Next runs will be every 3 hours (0:00, 3:00, 6:00, 9:00, 12:00, 15:00, 18:00, 21:00)');
console.log('🛑 Press Ctrl+C to stop\n');
