const fs = require('fs');
const path = require('path');

function generateHTMLReport(phase3File, phase4File) {
  const phase3 = JSON.parse(fs.readFileSync(phase3File, 'utf8'));
  const phase4 = JSON.parse(fs.readFileSync(phase4File, 'utf8'));

  const avgPhase3 = phase3.reduce((sum, r) => sum + r.latency.mean, 0) / phase3.length;
  const avgPhase4 = phase4.reduce((sum, r) => sum + r.latency.mean, 0) / phase4.length;
  const improvement = ((avgPhase3 - avgPhase4) / avgPhase3 * 100).toFixed(2);

  let tableRows = '';
  phase3.forEach((p3, idx) => {
    const p4 = phase4[idx];
    const gain = ((p3.latency.mean - p4.latency.mean) / p3.latency.mean * 100).toFixed(2);
    tableRows += `
      <tr>
        <td>${p3.endpoint}</td>
        <td>${p3.latency.mean.toFixed(2)}ms</td>
        <td>${p4.latency.mean.toFixed(2)}ms</td>
        <td class="${gain > 0 ? 'positive' : 'negative'}">${gain > 0 ? '✓' : '✗'} ${gain}%</td>
      </tr>
    `;
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance Report - Phase 3 vs Phase 4</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #333; margin-bottom: 10px; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
    .metric-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .metric-card h3 { font-size: 14px; opacity: 0.9; }
    .metric-card .value { font-size: 32px; font-weight: bold; margin-top: 10px; }
    .improvement { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f8f8f8; font-weight: 600; color: #333; }
    tr:hover { background: #f9f9f9; }
    .positive { color: #27ae60; font-weight: bold; }
    .negative { color: #e74c3c; font-weight: bold; }
    .chart { margin: 30px 0; }
    footer { text-align: center; color: #999; margin-top: 30px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Camera Rental System - Performance Report</h1>
    <p style="color: #666;">Phase 3 vs Phase 4 Comparison</p>

    <div class="summary">
      <div class="metric-card">
        <h3>Phase 3 Avg Latency</h3>
        <div class="value">${avgPhase3.toFixed(2)}ms</div>
      </div>
      <div class="metric-card improvement">
        <h3>Phase 4 Avg Latency</h3>
        <div class="value">${avgPhase4.toFixed(2)}ms</div>
      </div>
      <div class="metric-card improvement">
        <h3>Overall Improvement</h3>
        <div class="value">${improvement}%</div>
      </div>
    </div>

    <h2>📊 Endpoint Performance Comparison</h2>
    <table>
      <thead>
        <tr>
          <th>Endpoint</th>
          <th>Phase 3 Latency</th>
          <th>Phase 4 Latency</th>
          <th>Improvement</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <footer>
      Generated on ${new Date().toLocaleString()}<br>
      Camera Rental System - CP252 Project
    </footer>
  </div>
</body>
</html>
  `;

  const outputFile = path.join('performance/results', 'report.html');
  fs.writeFileSync(outputFile, html);
  console.log(`✅ Report generated: ${outputFile}`);
  console.log(`🌐 Open in browser: file://${path.resolve(outputFile)}`);
}

// Usage
const phase3 = 'performance/results/phase3-YYYY-MM-DD.json';
const phase4 = 'performance/results/phase4-YYYY-MM-DD.json';

if (fs.existsSync(phase3) && fs.existsSync(phase4)) {
  generateHTMLReport(phase3, phase4);
} else {
  console.log('⚠️  Please run profiling for both phases first');
  console.log('   Phase 3 file:', phase3);
  console.log('   Phase 4 file:', phase4);
}