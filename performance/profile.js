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
    const filter = process.argv[2]; // Optional endpoint filter
    
    // Check if server is running
    console.log('🚀 Checking if server is running on http://localhost:3000...');
    
    // Run profiling
    console.log('\n📍 Starting Phase 4 profiling...\n');
    
    let targets = ENDPOINTS;
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      targets = ENDPOINTS.filter(e => e.name.toLowerCase().includes(lowerFilter) || e.path.toLowerCase().includes(lowerFilter));
      if (targets.length === 0) {
        console.warn(`⚠️ No endpoints matched filter: "${filter}". Running all endpoints instead.`);
        targets = ENDPOINTS;
      } else {
        console.log(`🎯 Filtering to: ${targets.map(t => t.name).join(', ')}`);
      }
    }

    const results = [];
    for (const endpoint of targets) {
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

    // Save results
    const label = filter ? `phase4-${filter}` : 'phase4';
    const resultsFile = saveResults(label, results);

    console.log('\n✅ Profiling completed!');
    console.log(`📂 Results saved to: ${resultsFile}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Profiling failed:', error);
    process.exit(1);
  }
}

main();