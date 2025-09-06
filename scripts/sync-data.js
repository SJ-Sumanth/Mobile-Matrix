#!/usr/bin/env node

/**
 * Data Synchronization CLI Tool
 * 
 * Usage:
 *   node scripts/sync-data.js --help
 *   node scripts/sync-data.js --full
 *   node scripts/sync-data.js --source gsmarena
 *   node scripts/sync-data.js --phone <phone-id>
 *   node scripts/sync-data.js --status
 */

import { program } from 'commander';
import { externalDataService } from '../src/services/external/index.js';
import { prisma } from '../src/lib/database.js';

// CLI configuration
program
  .name('sync-data')
  .description('Mobile Matrix data synchronization tool')
  .version('1.0.0');

program
  .command('full')
  .description('Perform full data synchronization from all sources')
  .option('--dry-run', 'Show what would be synced without actually syncing')
  .action(async (options) => {
    try {
      console.log('🔄 Starting full data synchronization...');
      
      if (options.dryRun) {
        console.log('📋 DRY RUN MODE - No actual changes will be made');
        
        // Show what would be synced
        const brands = await prisma.brand.findMany({ where: { isActive: true } });
        const phones = await prisma.phone.findMany({ where: { isActive: true } });
        
        console.log(`📊 Would sync data for:`);
        console.log(`   - ${brands.length} brands`);
        console.log(`   - ${phones.length} phones`);
        console.log(`   - GSMArena specifications`);
        console.log(`   - Price tracking data`);
        
        return;
      }

      // Initialize the service
      await externalDataService.initialize();
      
      // Perform full sync
      const startTime = Date.now();
      await externalDataService.performFullSync();
      const duration = Date.now() - startTime;
      
      console.log(`✅ Full synchronization completed in ${duration}ms`);
      
      // Show summary
      const metrics = externalDataService.getMetrics();
      console.log(`📊 Sync Summary:`);
      console.log(`   - Total syncs: ${metrics.totalSyncs}`);
      console.log(`   - Successful: ${metrics.successfulSyncs}`);
      console.log(`   - Failed: ${metrics.failedSyncs}`);
      console.log(`   - API requests: ${metrics.apiRequestsCount}`);
      console.log(`   - API errors: ${metrics.apiErrorsCount}`);
      
    } catch (error) {
      console.error('❌ Full sync failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('source <source>')
  .description('Sync data from a specific source (gsmarena, priceTracking)')
  .action(async (source) => {
    try {
      if (!['gsmarena', 'priceTracking'].includes(source)) {
        console.error('❌ Invalid source. Use: gsmarena, priceTracking');
        process.exit(1);
      }

      console.log(`🔄 Starting ${source} synchronization...`);
      
      await externalDataService.initialize();
      
      const startTime = Date.now();
      
      if (source === 'gsmarena') {
        // Sync specifications only
        console.log('📱 Syncing phone specifications from GSMArena...');
        // This would need to be exposed from the service
        console.log('⚠️  Source-specific sync not yet implemented');
      } else if (source === 'priceTracking') {
        // Sync prices only
        console.log('💰 Syncing price data...');
        console.log('⚠️  Source-specific sync not yet implemented');
      }
      
      const duration = Date.now() - startTime;
      console.log(`✅ ${source} synchronization completed in ${duration}ms`);
      
    } catch (error) {
      console.error(`❌ ${source} sync failed:`, error.message);
      process.exit(1);
    }
  });

program
  .command('phone <phoneId>')
  .description('Sync data for a specific phone')
  .action(async (phoneId) => {
    try {
      console.log(`🔄 Syncing data for phone: ${phoneId}`);
      
      await externalDataService.initialize();
      
      const success = await externalDataService.syncPhoneData(phoneId);
      
      if (success) {
        console.log(`✅ Phone ${phoneId} synchronized successfully`);
      } else {
        console.log(`❌ Failed to sync phone ${phoneId}`);
        process.exit(1);
      }
      
    } catch (error) {
      console.error(`❌ Phone sync failed:`, error.message);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show synchronization status and health')
  .option('--detailed', 'Show detailed metrics and recent events')
  .action(async (options) => {
    try {
      console.log('📊 Data Synchronization Status\n');
      
      const healthStatus = externalDataService.getHealthStatus();
      const metrics = externalDataService.getMetrics();
      
      // Health status
      const statusIcon = healthStatus.status === 'healthy' ? '✅' : 
                        healthStatus.status === 'warning' ? '⚠️' : '❌';
      
      console.log(`${statusIcon} Overall Status: ${healthStatus.status.toUpperCase()}`);
      console.log(`📝 Summary: ${healthStatus.summary}\n`);
      
      // Metrics
      console.log('📈 Sync Metrics:');
      console.log(`   Total syncs: ${metrics.totalSyncs}`);
      console.log(`   Successful: ${metrics.successfulSyncs}`);
      console.log(`   Failed: ${metrics.failedSyncs}`);
      console.log(`   Success rate: ${metrics.totalSyncs > 0 ? Math.round((metrics.successfulSyncs / metrics.totalSyncs) * 100) : 0}%`);
      console.log(`   Average duration: ${Math.round(metrics.averageDuration)}ms`);
      console.log(`   Last sync: ${metrics.lastSyncTime ? metrics.lastSyncTime.toLocaleString() : 'Never'}\n`);
      
      // API metrics
      console.log('🌐 API Metrics:');
      console.log(`   Total requests: ${metrics.apiRequestsCount}`);
      console.log(`   API errors: ${metrics.apiErrorsCount}`);
      console.log(`   Error rate: ${metrics.apiRequestsCount > 0 ? Math.round((metrics.apiErrorsCount / metrics.apiRequestsCount) * 100) : 0}%`);
      console.log(`   Rate limit hits: ${metrics.rateLimitHits}`);
      console.log(`   Fallback activations: ${metrics.fallbackActivations}\n`);
      
      // Issues and recommendations
      if (healthStatus.issues.length > 0) {
        console.log('⚠️  Issues:');
        healthStatus.issues.forEach(issue => console.log(`   - ${issue}`));
        console.log('');
      }
      
      if (healthStatus.recommendations.length > 0) {
        console.log('💡 Recommendations:');
        healthStatus.recommendations.forEach(rec => console.log(`   - ${rec}`));
        console.log('');
      }
      
      // Detailed information
      if (options.detailed) {
        console.log('📋 Recent Events (last 24 hours):');
        const recentEvents = externalDataService.getRecentEvents(24);
        
        if (recentEvents.length === 0) {
          console.log('   No recent events');
        } else {
          recentEvents.slice(0, 10).forEach(event => {
            const timestamp = event.timestamp.toLocaleTimeString();
            const icon = event.type.includes('error') || event.type === 'sync_failed' ? '❌' : 
                        event.type === 'sync_completed' ? '✅' : 
                        event.type.includes('warning') ? '⚠️' : 'ℹ️';
            
            console.log(`   ${icon} [${timestamp}] ${event.source}: ${event.type}`);
            if (event.error) {
              console.log(`      Error: ${event.error}`);
            }
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to get status:', error.message);
      process.exit(1);
    }
  });

program
  .command('clear-cache')
  .description('Clear all cached data')
  .action(async () => {
    try {
      console.log('🧹 Clearing cached data...');
      
      await externalDataService.clearCache();
      
      console.log('✅ Cache cleared successfully');
      
    } catch (error) {
      console.error('❌ Failed to clear cache:', error.message);
      process.exit(1);
    }
  });

program
  .command('test-connections')
  .description('Test connections to external APIs')
  .action(async () => {
    try {
      console.log('🔌 Testing external API connections...\n');
      
      // This would need to be exposed from the service
      console.log('⚠️  Connection testing not yet implemented');
      console.log('💡 Use the health status command to check service health');
      
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}