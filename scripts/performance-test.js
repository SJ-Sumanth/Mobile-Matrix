#!/usr/bin/env node

/**
 * Performance testing script for MobileMatrix
 * Tests various performance aspects of the application
 */

import { performance } from 'perf_hooks';
import { spawn } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const RESULTS_DIR = 'performance-results';
const TEST_DURATION = 30000; // 30 seconds
const CONCURRENT_USERS = 10;

/**
 * Performance test configuration
 */
const TEST_CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3000',
  endpoints: [
    '/',
    '/api/phones',
    '/api/brands',
    '/comparison',
    '/ai-demo',
  ],
  loadTest: {
    duration: TEST_DURATION,
    concurrency: CONCURRENT_USERS,
    rampUp: 5000, // 5 seconds
  },
  thresholds: {
    responseTime: 1000, // 1 second
    errorRate: 0.05, // 5%
    throughput: 10, // requests per second
  },
};

/**
 * Test results storage
 */
class TestResults {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      config: TEST_CONFIG,
      tests: {},
      summary: {},
    };
  }

  addTest(testName, result) {
    this.results.tests[testName] = result;
  }

  setSummary(summary) {
    this.results.summary = summary;
  }

  save() {
    if (!existsSync(RESULTS_DIR)) {
      mkdirSync(RESULTS_DIR, { recursive: true });
    }

    const filename = `performance-${Date.now()}.json`;
    const filepath = join(RESULTS_DIR, filename);
    
    writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`Results saved to: ${filepath}`);
  }
}

/**
 * HTTP load testing utility
 */
class LoadTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async testEndpoint(endpoint, options = {}) {
    const {
      duration = 10000,
      concurrency = 5,
      rampUp = 1000,
    } = options;

    console.log(`Testing ${endpoint} (${duration/1000}s, ${concurrency} concurrent)`);

    const results = {
      endpoint,
      duration,
      concurrency,
      requests: [],
      errors: [],
      startTime: Date.now(),
    };

    const workers = [];
    const startTime = Date.now();

    // Create concurrent workers
    for (let i = 0; i < concurrency; i++) {
      const worker = this.createWorker(endpoint, duration, results);
      workers.push(worker);
      
      // Ramp up gradually
      if (rampUp > 0) {
        await this.sleep(rampUp / concurrency);
      }
    }

    // Wait for all workers to complete
    await Promise.all(workers);

    results.endTime = Date.now();
    results.totalDuration = results.endTime - results.startTime;

    return this.calculateMetrics(results);
  }

  async createWorker(endpoint, duration, results) {
    const endTime = Date.now() + duration;
    const url = `${this.baseUrl}${endpoint}`;

    while (Date.now() < endTime) {
      const requestStart = performance.now();
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'MobileMatrix-PerformanceTest/1.0',
          },
        });

        const requestEnd = performance.now();
        const responseTime = requestEnd - requestStart;

        results.requests.push({
          timestamp: Date.now(),
          responseTime,
          status: response.status,
          success: response.ok,
        });

        if (!response.ok) {
          results.errors.push({
            timestamp: Date.now(),
            status: response.status,
            error: `HTTP ${response.status}`,
          });
        }

      } catch (error) {
        const requestEnd = performance.now();
        const responseTime = requestEnd - requestStart;

        results.requests.push({
          timestamp: Date.now(),
          responseTime,
          status: 0,
          success: false,
        });

        results.errors.push({
          timestamp: Date.now(),
          error: error.message,
        });
      }

      // Small delay to prevent overwhelming the server
      await this.sleep(10);
    }
  }

  calculateMetrics(results) {
    const { requests, errors } = results;
    
    if (requests.length === 0) {
      return {
        ...results,
        metrics: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          errorRate: 1,
          avgResponseTime: 0,
          minResponseTime: 0,
          maxResponseTime: 0,
          p95ResponseTime: 0,
          throughput: 0,
        },
      };
    }

    const successfulRequests = requests.filter(r => r.success);
    const responseTimes = requests.map(r => r.responseTime).sort((a, b) => a - b);
    
    const metrics = {
      totalRequests: requests.length,
      successfulRequests: successfulRequests.length,
      failedRequests: errors.length,
      errorRate: errors.length / requests.length,
      avgResponseTime: responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length,
      minResponseTime: responseTimes[0] || 0,
      maxResponseTime: responseTimes[responseTimes.length - 1] || 0,
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
      throughput: requests.length / (results.totalDuration / 1000),
    };

    return { ...results, metrics };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Database performance tester
 */
class DatabaseTester {
  async testDatabasePerformance() {
    console.log('Testing database performance...');

    const tests = [
      { name: 'phone-search', endpoint: '/api/phones?q=samsung' },
      { name: 'brand-list', endpoint: '/api/brands' },
      { name: 'phone-details', endpoint: '/api/phones/1' },
      { name: 'comparison', endpoint: '/api/comparison?phone1=1&phone2=2' },
    ];

    const results = {};

    for (const test of tests) {
      console.log(`Testing ${test.name}...`);
      
      const startTime = performance.now();
      
      try {
        const response = await fetch(`${TEST_CONFIG.baseUrl}${test.endpoint}`);
        const endTime = performance.now();
        
        results[test.name] = {
          responseTime: endTime - startTime,
          status: response.status,
          success: response.ok,
        };
        
      } catch (error) {
        const endTime = performance.now();
        
        results[test.name] = {
          responseTime: endTime - startTime,
          status: 0,
          success: false,
          error: error.message,
        };
      }
    }

    return results;
  }
}

/**
 * Memory usage tester
 */
class MemoryTester {
  async testMemoryUsage() {
    console.log('Testing memory usage...');

    const initialMemory = process.memoryUsage();
    
    // Simulate heavy operations
    const operations = [
      () => this.simulatePhoneDataProcessing(),
      () => this.simulateImageProcessing(),
      () => this.simulateCacheOperations(),
    ];

    const results = {
      initial: initialMemory,
      operations: {},
    };

    for (let i = 0; i < operations.length; i++) {
      const operationName = `operation-${i + 1}`;
      
      await operations[i]();
      
      const memoryAfter = process.memoryUsage();
      results.operations[operationName] = {
        heapUsed: memoryAfter.heapUsed - initialMemory.heapUsed,
        heapTotal: memoryAfter.heapTotal - initialMemory.heapTotal,
        external: memoryAfter.external - initialMemory.external,
        rss: memoryAfter.rss - initialMemory.rss,
      };
    }

    results.final = process.memoryUsage();
    
    return results;
  }

  async simulatePhoneDataProcessing() {
    // Simulate processing large phone datasets
    const phones = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      brand: `Brand ${i % 100}`,
      model: `Model ${i}`,
      specs: {
        display: `${5 + (i % 3)}.${i % 10}" Display`,
        camera: `${12 + (i % 48)}MP Camera`,
        battery: `${3000 + (i % 2000)}mAh`,
      },
    }));

    // Simulate search operations
    for (let i = 0; i < 100; i++) {
      const filtered = phones.filter(phone => 
        phone.brand.includes('Brand 1') || phone.model.includes('Model 1')
      );
      
      const sorted = filtered.sort((a, b) => a.id - b.id);
      
      // Simulate processing
      sorted.forEach(phone => {
        const processed = {
          ...phone,
          searchScore: Math.random(),
          processed: true,
        };
      });
    }
  }

  async simulateImageProcessing() {
    // Simulate image processing operations
    const images = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      url: `https://example.com/image-${i}.jpg`,
      data: Buffer.alloc(1024 * 100), // 100KB per image
    }));

    // Simulate image transformations
    images.forEach(image => {
      const transformed = {
        ...image,
        thumbnail: Buffer.alloc(1024 * 10), // 10KB thumbnail
        webp: Buffer.alloc(1024 * 80), // 80KB WebP
        metadata: {
          width: 800,
          height: 600,
          format: 'jpg',
        },
      };
    });
  }

  async simulateCacheOperations() {
    // Simulate cache operations
    const cache = new Map();
    
    // Fill cache
    for (let i = 0; i < 10000; i++) {
      cache.set(`key-${i}`, {
        data: `value-${i}`,
        timestamp: Date.now(),
        metadata: { size: 1024, type: 'phone-data' },
      });
    }

    // Simulate cache lookups
    for (let i = 0; i < 50000; i++) {
      const key = `key-${i % 10000}`;
      const value = cache.get(key);
      
      if (value) {
        // Simulate processing cached data
        const processed = {
          ...value,
          accessed: Date.now(),
        };
      }
    }

    cache.clear();
  }
}

/**
 * Main test runner
 */
async function runPerformanceTests() {
  console.log('🚀 Starting MobileMatrix Performance Tests');
  console.log(`Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`Duration: ${TEST_CONFIG.loadTest.duration / 1000}s`);
  console.log(`Concurrency: ${TEST_CONFIG.loadTest.concurrency}`);
  console.log('');

  const results = new TestResults();
  const loadTester = new LoadTester(TEST_CONFIG.baseUrl);
  const dbTester = new DatabaseTester();
  const memoryTester = new MemoryTester();

  try {
    // Test each endpoint
    for (const endpoint of TEST_CONFIG.endpoints) {
      const testResult = await loadTester.testEndpoint(endpoint, TEST_CONFIG.loadTest);
      results.addTest(`load-${endpoint.replace(/\//g, '-')}`, testResult);
      
      console.log(`✅ ${endpoint}: ${testResult.metrics.avgResponseTime.toFixed(2)}ms avg, ${testResult.metrics.throughput.toFixed(2)} req/s`);
    }

    // Test database performance
    const dbResults = await dbTester.testDatabasePerformance();
    results.addTest('database', dbResults);
    console.log('✅ Database tests completed');

    // Test memory usage
    const memoryResults = await memoryTester.testMemoryUsage();
    results.addTest('memory', memoryResults);
    console.log('✅ Memory tests completed');

    // Generate summary
    const summary = generateSummary(results.results.tests);
    results.setSummary(summary);

    // Save results
    results.save();

    // Print summary
    printSummary(summary);

  } catch (error) {
    console.error('❌ Performance tests failed:', error);
    process.exit(1);
  }
}

/**
 * Generate test summary
 */
function generateSummary(tests) {
  const loadTests = Object.entries(tests).filter(([name]) => name.startsWith('load-'));
  
  const avgResponseTime = loadTests.reduce((sum, [, test]) => 
    sum + test.metrics.avgResponseTime, 0) / loadTests.length;
  
  const totalThroughput = loadTests.reduce((sum, [, test]) => 
    sum + test.metrics.throughput, 0);
  
  const avgErrorRate = loadTests.reduce((sum, [, test]) => 
    sum + test.metrics.errorRate, 0) / loadTests.length;

  const passed = avgResponseTime < TEST_CONFIG.thresholds.responseTime &&
                 avgErrorRate < TEST_CONFIG.thresholds.errorRate &&
                 totalThroughput > TEST_CONFIG.thresholds.throughput;

  return {
    avgResponseTime,
    totalThroughput,
    avgErrorRate,
    thresholds: TEST_CONFIG.thresholds,
    passed,
    grade: calculateGrade(avgResponseTime, avgErrorRate, totalThroughput),
  };
}

/**
 * Calculate performance grade
 */
function calculateGrade(responseTime, errorRate, throughput) {
  let score = 100;
  
  // Response time penalty
  if (responseTime > 500) score -= 20;
  if (responseTime > 1000) score -= 30;
  if (responseTime > 2000) score -= 40;
  
  // Error rate penalty
  if (errorRate > 0.01) score -= 10; // 1%
  if (errorRate > 0.05) score -= 30; // 5%
  if (errorRate > 0.1) score -= 50;  // 10%
  
  // Throughput bonus/penalty
  if (throughput > 50) score += 10;
  if (throughput < 10) score -= 20;
  if (throughput < 5) score -= 40;
  
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Print test summary
 */
function printSummary(summary) {
  console.log('\n📊 Performance Test Summary');
  console.log('================================');
  console.log(`Average Response Time: ${summary.avgResponseTime.toFixed(2)}ms`);
  console.log(`Total Throughput: ${summary.totalThroughput.toFixed(2)} req/s`);
  console.log(`Average Error Rate: ${(summary.avgErrorRate * 100).toFixed(2)}%`);
  console.log(`Performance Grade: ${summary.grade}`);
  console.log(`Overall Result: ${summary.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('');
  
  if (!summary.passed) {
    console.log('❌ Performance thresholds not met:');
    if (summary.avgResponseTime > summary.thresholds.responseTime) {
      console.log(`  - Response time: ${summary.avgResponseTime.toFixed(2)}ms > ${summary.thresholds.responseTime}ms`);
    }
    if (summary.avgErrorRate > summary.thresholds.errorRate) {
      console.log(`  - Error rate: ${(summary.avgErrorRate * 100).toFixed(2)}% > ${(summary.thresholds.errorRate * 100)}%`);
    }
    if (summary.totalThroughput < summary.thresholds.throughput) {
      console.log(`  - Throughput: ${summary.totalThroughput.toFixed(2)} req/s < ${summary.thresholds.throughput} req/s`);
    }
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPerformanceTests().catch(console.error);
}

export { runPerformanceTests, LoadTester, DatabaseTester, MemoryTester };