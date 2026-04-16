const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

// ==================== CONFIGURATION ====================
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  duration: 30, // 30 seconds
  connections: 10,
  pipelining: 1,
  amount: 500, // Total requests
};

// ==================== TEST ENDPOINTS ====================
const ENDPOINTS = [
  { name: 'Homepage', path: '/', method: 'GET' },
  { name: 'Camera List', path: '/cameras', method: 'GET' },
  { name: 'Search Cameras', path: '/cameras?search=Canon', method: 'GET' },
  { name: 'Register Page', path: '/register', method: 'GET' },
  { name: 'Admin Dashboard', path: '/admin/dashboard', method: 'GET' },
];

// ==================== PROFILING FUNCTION ====================
async function runProfile(phaseLabel) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 PERFORMANCE PROFILING: ${phaseLabel}`);
  console.log(`${'='.repeat(60)}\n`);

  const results = [];

  for (const endpoint of ENDPOINTS) {
    console.log(`🔍 Testing: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);

    try {
      const result = await autocannon({
        url: `${CONFIG.baseUrl}${endpoint.path}`,
        connections: CONFIG.connections,
        duration: CONFIG.duration,
        pipelining: CONFIG.pipelining,
        requests: [{ path: endpoint.path, method: endpoint.method }],
      });

      const metrics = {
        endpoint: endpoint.name,
        path: endpoint.path,
        requests: result.requests.total,
        throughput: result.throughput.total,
        latency: {
          min: result.latency.min,
          max: result.latency.max,
          mean: result.latency.mean,
          p99: result.latency.p99,
        },
        errors: result.errors,
        timeouts: result.timeouts,
      };

      results.push(metrics);

      console.log(`   ✓ Requests: ${metrics.requests}`);
      console.log(`   ✓ Throughput: ${metrics.throughput.toFixed(2)} req/s`);
      console.log(`   ✓ Latency Mean: ${metrics.latency.mean.toFixed(2)}ms`);
      console.log(`   ✓ Latency P99: ${metrics.latency.p99}ms\n`);
    } catch (error) {
      console.error(`   ✗ Error: ${error.message}\n`);
    }
  }

  return results;
}

// ==================== COMPARISON FUNCTION ====================
function compareResults(phase3, phase4) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📈 PHASE 3 vs PHASE 4 COMPARISON`);
  console.log(`${'='.repeat(60)}\n`);

  console.log(
    `${'Endpoint'.padEnd(20)} | ${'Phase 3'.padEnd(15)} | ${'Phase 4'.padEnd(15)} | ${'Improvement'.padEnd(15)}`
  );
  console.log(`${'-'.repeat(20)}-${'-'.repeat(15)}-${'-'.repeat(15)}-${'-'.repeat(15)}`);

  phase3.forEach((p3, index) => {
    const p4 = phase4[index];
    if (p4) {
      const improvement = ((p3.latency.mean - p4.latency.mean) / p3.latency.mean * 100).toFixed(2);
      const improvementSymbol = improvement > 0 ? '📉' : '📈';

      console.log(
        `${p3.endpoint.padEnd(20)} | ${p3.latency.mean.toFixed(2)}ms`.padEnd(30) + 
        `| ${p4.latency.mean.toFixed(2)}ms`.padEnd(30) +
        `| ${improvementSymbol} ${improvement}%`
      );
    }
  });

  // Summary Statistics
  const avgPhase3 = phase3.reduce((sum, r) => sum + r.latency.mean, 0) / phase3.length;
  const avgPhase4 = phase4.reduce((sum, r) => sum + r.latency.mean, 0) / phase4.length;
  const totalImprovement = ((avgPhase3 - avgPhase4) / avgPhase3 * 100).toFixed(2);

  console.log(`${'='.repeat(60)}`);
  console.log(`📊 AVERAGE LATENCY`);
  console.log(`   Phase 3: ${avgPhase3.toFixed(2)}ms`);
  console.log(`   Phase 4: ${avgPhase4.toFixed(2)}ms`);
  console.log(`   Overall Improvement: ${totalImprovement}%`);
  console.log(`${'='.repeat(60)}\n`);

  return { avgPhase3, avgPhase4, totalImprovement };
}

// ==================== SAVE RESULTS ====================
function saveResults(label, results) {
  const dir = 'performance/results';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filename = path.join(dir, `${label}-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`✅ Results saved: ${filename}\n`);

  return filename;
}

// ==================== MAIN EXECUTION ====================
async function main() {
  try {
    // Check if server is running
    console.log('🚀 Checking if server is running on http://localhost:3000...');
    
    // Run profiling
    console.log('\n📍 Starting Phase 4 profiling...\n');
    const phase4Results = await runProfile('PHASE 4');

    // Save results
    const resultsFile = saveResults('phase4', phase4Results);

    console.log('\n✅ Profiling completed!');
    console.log(`📂 Results saved to: ${resultsFile}`);
    console.log('\n💡 Tip: Run same script for Phase 3 to compare, then use comparison table above.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Profiling failed:', error);
    process.exit(1);
  }
}

main();