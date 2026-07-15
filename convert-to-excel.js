const fs = require('fs');
const XLSX = require('xlsx');
const dayjs = require('dayjs');

const SKIP_LEVELS = new Set(['INFO', 'NOTICE', 'WARNING']);

function convertLogsToExcel(inputFile = 'unique_slack_logs.txt', outputFile = null) {
  console.log('\n📊 Converting logs to Excel...');
  
  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.log(`   ⚠️  Input file ${inputFile} not found. Skipping conversion.`);
    return null;
  }

  // Read the text file
  const textContent = fs.readFileSync(inputFile, 'utf8');

  // Split into lines and filter out empty lines
  const lines = textContent.split('\n').filter(line => line.trim() !== '');

  if (lines.length === 0) {
    console.log('   ⚠️  No logs to convert. Skipping.');
    return null;
  }

  // Prepare data for Excel: header + rows
  const data = [['Timestamp', 'Channel', 'Message Text', 'Message Link', 'Level']];

  lines.forEach(line => {
    // Extract timestamp [YYYY-MM-DD HH:mm:ss]
    const timestampMatch = line.match(/\[(.*?)\]/);
    
    // Extract channel name [Channel Name]
    const channelMatch = line.match(/\]\s*\[(.*?)\]/);
    
    // Extract link (https://...)
    const linkMatch = line.match(/\((https:\/\/.*?)\)/);
    
    // Extract level (last word)
    const levelMatch = line.match(/(\w+)$/);
    const level_text = levelMatch ? levelMatch[1] : 'Unknown';

    // Only include ERROR, CRITICAL, DEBUG (skip INFO, NOTICE, WARNING)
    if (timestampMatch && linkMatch && !SKIP_LEVELS.has(level_text)) {
      const timestamp = timestampMatch[1];
      const channel = channelMatch ? channelMatch[1] : 'Unknown';
      const link = linkMatch[1];

      // Extract message text (between second ] and last ()
      let messageTextStart = line.indexOf(']', line.indexOf(']') + 1) + 1;
      const messageTextEnd = line.lastIndexOf('(');
      let messageText = line.substring(messageTextStart, messageTextEnd).trim();

      data.push([timestamp, channel, messageText, link, level_text]);
    }
  });

  if (data.length === 1) {
    console.log('   ⚠️  No valid error logs found after filtering. Skipping Excel creation.');
    return null;
  }

  // Generate output filename with timestamp if not provided
  if (!outputFile) {
    const timestamp = dayjs().format('YYYY-MM-DD_HHmmss');
    outputFile = `slack_logs_${timestamp}.xlsx`;
  }

  // Create a new workbook and worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Auto-size columns
  const colWidths = [
    { wch: 20 }, // Timestamp
    { wch: 20 }, // Channel
    { wch: 80 }, // Message Text
    { wch: 50 }, // Message Link
    { wch: 10 }, // Level
  ];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Slack Logs');

  // Write to Excel file
  XLSX.writeFile(wb, outputFile);

  console.log(`   ✅ Successfully converted to ${outputFile}`);
  console.log(`   📝 Number of error records: ${data.length - 1}`);
  
  return outputFile;
}

// Export for use in other scripts
module.exports = { convertLogsToExcel };

// Run if called directly
if (require.main === module) {
  convertLogsToExcel();
}
