import cron from 'node-cron';
import fs from 'fs';
import path from 'path';

const LOG_DIR = path.resolve(__dirname, '../../logs');
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Schedule cron to run every day at midnight
cron.schedule('0 0 * * *', () => {
  console.log('[CRON] Running log cleanup at midnight...');

  try {
    const files = fs.readdirSync(LOG_DIR);
    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(LOG_DIR, file);

      try {
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > SEVEN_DAYS_MS) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      } catch (err) {
        console.error(`[CRON] Error processing file ${file}:`, err);
      }
    }

    console.log(`[CRON] Log cleanup complete. Deleted ${deletedCount} file(s).`);
  } catch (err) {
    console.error('[CRON] Error reading log directory:', err);
  }
});
