import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');

  // Clean up test database
  if (process.env.NODE_ENV !== 'production' && process.env.TEST_DATABASE_URL) {
    console.log('🗑️ Cleaning up test database...');
    
    const { execSync } = require('child_process');
    try {
      // Reset test database
      execSync('npx prisma migrate reset --force', { 
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
      });
      
      console.log('✅ Test database cleanup complete');
    } catch (error) {
      console.error('❌ Failed to cleanup test database:', error);
    }
  }

  // Clean up test files and artifacts
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Clean up temporary test files
    const tempDir = path.join(process.cwd(), 'temp-test-files');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('✅ Temporary test files cleaned up');
    }
    
    // Clean up old screenshots if not in CI
    if (!process.env.CI) {
      const screenshotDir = path.join(process.cwd(), 'test-results');
      if (fs.existsSync(screenshotDir)) {
        const files = fs.readdirSync(screenshotDir);
        const oldFiles = files.filter((file: string) => {
          const filePath = path.join(screenshotDir, file);
          const stats = fs.statSync(filePath);
          const daysSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceModified > 7; // Remove files older than 7 days
        });
        
        oldFiles.forEach((file: string) => {
          fs.unlinkSync(path.join(screenshotDir, file));
        });
        
        if (oldFiles.length > 0) {
          console.log(`✅ Cleaned up ${oldFiles.length} old test artifacts`);
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not clean up test artifacts:', error);
  }

  console.log('✅ Global teardown complete');
}

export default globalTeardown;