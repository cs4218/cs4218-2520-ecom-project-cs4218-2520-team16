/**
 * Soak Test Analysis Script
 * Author: Aum Yogeshbhai Chotaliya (A0285229M)
 * 
 * Analyzes Artillery soak test results for:
 * - Performance degradation over time
 * - Memory leak indicators
 * - Error rate trends
 * - Stability assessment
 */

import fs from 'fs';
import path from 'path';

const RESULTS_DIR = path.join(process.cwd(), 'soak-tests', 'results');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

/**
 * Parse Artillery JSON output
 */
function parseArtilleryResults(jsonPath) {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  return data;
}

/**
 * Analyze performance degradation
 */
function analyzePerformanceDegradation(data) {
  const intermediate = data.intermediate || [];
  
  if (intermediate.length < 2) {
    return {
      degradation: 'INSUFFICIENT_DATA',
      message: 'Not enough data points to analyze degradation'
    };
  }
  
  // Split into first quarter and last quarter
  const quarterSize = Math.floor(intermediate.length / 4);
  const firstQuarter = intermediate.slice(0, quarterSize);
  const lastQuarter = intermediate.slice(-quarterSize);
  
  // Calculate average response times
  const avgFirst = firstQuarter.reduce((sum, i) => 
    sum + (i.summaries?.['http.response_time']?.median || 0), 0
  ) / firstQuarter.length;
  
  const avgLast = lastQuarter.reduce((sum, i) => 
    sum + (i.summaries?.['http.response_time']?.median || 0), 0
  ) / lastQuarter.length;
  
  const degradationPercent = ((avgLast - avgFirst) / avgFirst) * 100;
  
  return {
    firstQuarterAvg: Math.round(avgFirst),
    lastQuarterAvg: Math.round(avgLast),
    degradationPercent: degradationPercent.toFixed(2),
    status: degradationPercent > 20 ? 'DEGRADED' : 
            degradationPercent > 10 ? 'WARNING' : 'STABLE'
  };
}

/**
 * Analyze error rate trends
 */
function analyzeErrorTrend(data) {
  const intermediate = data.intermediate || [];
  
  if (intermediate.length === 0) {
    return { status: 'NO_DATA' };
  }
  
  const errorRates = intermediate.map(i => {
    const codes = i.summaries?.['http.codes'] || {};
    const total = Object.values(codes).reduce((a, b) => a + b, 0);
    const errors = Object.entries(codes)
      .filter(([code]) => parseInt(code) >= 400)
      .reduce((sum, [, count]) => sum + count, 0);
    
    return total > 0 ? (errors / total) * 100 : 0;
  });
  
  const avgErrorRate = errorRates.reduce((a, b) => a + b, 0) / errorRates.length;
  const maxErrorRate = Math.max(...errorRates);
  
  // Check if errors increase over time
  const firstHalf = errorRates.slice(0, Math.floor(errorRates.length / 2));
  const secondHalf = errorRates.slice(Math.floor(errorRates.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  return {
    avgErrorRate: avgErrorRate.toFixed(2),
    maxErrorRate: maxErrorRate.toFixed(2),
    firstHalfAvg: firstHalfAvg.toFixed(2),
    secondHalfAvg: secondHalfAvg.toFixed(2),
    trend: secondHalfAvg > firstHalfAvg * 1.5 ? 'INCREASING' : 'STABLE',
    status: avgErrorRate > 1 ? 'FAIL' : 'PASS'
  };
}

/**
 * Analyze throughput consistency
 */
function analyzeThroughput(data) {
  const intermediate = data.intermediate || [];
  
  const throughputs = intermediate.map(i => 
    i.summaries?.['http.request_rate'] || 0
  );
  
  if (throughputs.length === 0) {
    return { status: 'NO_DATA' };
  }
  
  const avgThroughput = throughputs.reduce((a, b) => a + b, 0) / throughputs.length;
  const minThroughput = Math.min(...throughputs);
  const maxThroughput = Math.max(...throughputs);
  
  const variance = ((maxThroughput - minThroughput) / avgThroughput) * 100;
  
  return {
    avg: avgThroughput.toFixed(2),
    min: minThroughput.toFixed(2),
    max: maxThroughput.toFixed(2),
    variancePercent: variance.toFixed(2),
    status: variance > 30 ? 'UNSTABLE' : 'STABLE'
  };
}

/**
 * Generate comprehensive report
 */
function generateReport(analysisResults, artilleryData) {
  const timestamp = new Date().toISOString();
  const reportPath = path.join(RESULTS_DIR, `soak-analysis-${timestamp.replace(/[:.]/g, '-')}.txt`);
  
  const aggregate = artilleryData.aggregate || {};
  const summary = aggregate.summaries || {};
  
  const report = `
╔════════════════════════════════════════════════════════════════╗
║         SOAK TEST ANALYSIS REPORT - MS3                        ║
║         Author: Aum Yogeshbhai Chotaliya (A0285229M)          ║
╚════════════════════════════════════════════════════════════════╝

Test Date: ${timestamp}
Test Type: Soak Testing (Endurance)
Duration: ${(aggregate.testDuration / 60).toFixed(1)} minutes

EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This report analyzes system stability and performance degradation
over an extended test duration under sustained moderate load.

KEY METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Requests:        ${aggregate.counters?.['http.requests'] || 0}
Successful Requests:   ${aggregate.counters?.['http.responses'] || 0}
Total Scenarios:       ${aggregate.counters?.['vusers.completed'] || 0}
Failed Scenarios:      ${aggregate.counters?.['vusers.failed'] || 0}

Response Times:
  Median (p50):        ${summary['http.response_time']?.median || 0} ms
  95th percentile:     ${summary['http.response_time']?.p95 || 0} ms
  99th percentile:     ${summary['http.response_time']?.p99 || 0} ms
  Min:                 ${summary['http.response_time']?.min || 0} ms
  Max:                 ${summary['http.response_time']?.max || 0} ms

PERFORMANCE DEGRADATION ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: ${analysisResults.degradation.status}

First Quarter Avg Response Time:  ${analysisResults.degradation.firstQuarterAvg} ms
Last Quarter Avg Response Time:   ${analysisResults.degradation.lastQuarterAvg} ms
Performance Change:                ${analysisResults.degradation.degradationPercent}%

${analysisResults.degradation.status === 'STABLE' ? 
  '✅ PASS: Response times remained stable throughout the test' :
  '❌ FAIL: Significant performance degradation detected - possible memory leak'}

ERROR RATE ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: ${analysisResults.errorRate.status}

Average Error Rate:    ${analysisResults.errorRate.avgErrorRate}%
Maximum Error Rate:    ${analysisResults.errorRate.maxErrorRate}%
First Half Avg:        ${analysisResults.errorRate.firstHalfAvg}%
Second Half Avg:       ${analysisResults.errorRate.secondHalfAvg}%
Trend:                 ${analysisResults.errorRate.trend}

${analysisResults.errorRate.status === 'PASS' ? 
  '✅ PASS: Error rate within acceptable limits (<1%)' :
  '❌ FAIL: Error rate exceeds threshold - system instability detected'}

THROUGHPUT CONSISTENCY ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: ${analysisResults.throughput.status}

Average Throughput:    ${analysisResults.throughput.avg} req/s
Minimum Throughput:    ${analysisResults.throughput.min} req/s
Maximum Throughput:    ${analysisResults.throughput.max} req/s
Variance:              ${analysisResults.throughput.variancePercent}%

${analysisResults.throughput.status === 'STABLE' ? 
  '✅ PASS: Throughput remained consistent throughout the test' :
  '⚠️  WARNING: High throughput variance detected - possible resource contention'}

STABILITY ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${getOverallAssessment(analysisResults)}

POTENTIAL ISSUES IDENTIFIED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${identifyIssues(analysisResults)}

RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${generateRecommendations(analysisResults)}

BUSINESS IMPACT FOR E-COMMERCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${assessBusinessImpact(analysisResults)}

CONCLUSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${generateConclusion(analysisResults)}

════════════════════════════════════════════════════════════════════

Report generated: ${timestamp}
Author: Aum Yogeshbhai Chotaliya (A0285229M)
Test Type: Soak Testing (Endurance)
`;

  fs.writeFileSync(reportPath, report);
  console.log(report);
  console.log(`\n✅ Analysis report saved to: ${reportPath}\n`);
  
  return reportPath;
}

function getOverallAssessment(results) {
  const checks = [
    results.degradation.status === 'STABLE',
    results.errorRate.status === 'PASS',
    results.throughput.status === 'STABLE'
  ];
  
  const passCount = checks.filter(c => c).length;
  
  if (passCount === 3) {
    return '✅ EXCELLENT: System demonstrates strong stability under sustained load.\n   No significant degradation detected. Safe for production deployment.';
  } else if (passCount === 2) {
    return '⚠️  ACCEPTABLE: System is generally stable but shows minor issues.\n   Monitor closely in production and address identified concerns.';
  } else {
    return '❌ CONCERNING: System shows instability under sustained load.\n   DO NOT deploy without addressing critical issues.';
  }
}

function identifyIssues(results) {
  const issues = [];
  
  if (results.degradation.status === 'DEGRADED') {
    issues.push('🔴 CRITICAL: Performance degradation over time suggests memory leak or resource exhaustion');
  } else if (results.degradation.status === 'WARNING') {
    issues.push('🟡 WARNING: Moderate performance degradation detected');
  }
  
  if (results.errorRate.status === 'FAIL') {
    issues.push('🔴 CRITICAL: High error rate indicates system instability');
  }
  
  if (results.errorRate.trend === 'INCREASING') {
    issues.push('🟡 WARNING: Error rate increases over time - resource exhaustion likely');
  }
  
  if (results.throughput.status === 'UNSTABLE') {
    issues.push('🟡 WARNING: Inconsistent throughput - possible resource contention or GC pressure');
  }
  
  return issues.length > 0 ? issues.join('\n') : '✅ No critical issues identified';
}

function generateRecommendations(results) {
  const recommendations = [];
  
  if (results.degradation.status !== 'STABLE') {
    recommendations.push('1. Profile memory usage to identify leaks');
    recommendations.push('2. Review database connection pooling configuration');
    recommendations.push('3. Check for unclosed file handles or streams');
    recommendations.push('4. Implement proper garbage collection monitoring');
  }
  
  if (results.errorRate.status === 'FAIL') {
    recommendations.push('1. Review application logs for error patterns');
    recommendations.push('2. Check database query timeouts');
    recommendations.push('3. Verify third-party service availability');
  }
  
  if (results.throughput.status === 'UNSTABLE') {
    recommendations.push('1. Monitor CPU and memory during sustained load');
    recommendations.push('2. Review Node.js event loop lag');
    recommendations.push('3. Consider horizontal scaling if resource-bound');
  }
  
  recommendations.push('4. Run longer soak tests (2-4 hours) for production validation');
  recommendations.push('5. Implement application performance monitoring (APM)');
  recommendations.push('6. Set up alerts for response time degradation');
  
  return recommendations.join('\n');
}

function assessBusinessImpact(results) {
  if (results.degradation.status === 'DEGRADED' || results.errorRate.status === 'FAIL') {
    return `
HIGH RISK for production deployment:

During Black Friday / Flash Sales:
- System may crash after 2-3 hours of high traffic
- Gradual slowdown leads to cart abandonment
- Error rate increase causes checkout failures
- Estimated revenue loss: $1,000 - $10,000 per hour of degradation

Customer Impact:
- Poor user experience with slow page loads
- Failed transactions and lost orders
- Negative reviews and reduced trust
- Potential payment gateway issues

Operational Impact:
- Requires manual server restarts
- On-call team intervention needed
- Increased infrastructure costs (emergency scaling)
- Potential SLA violations`;
  } else if (results.degradation.status === 'WARNING' || results.throughput.status === 'UNSTABLE') {
    return `
MODERATE RISK for production deployment:

The system shows minor stability concerns that should be addressed:
- May handle normal traffic but struggle during peak events
- Performance monitoring recommended for first 2 weeks
- Have rollback plan ready
- Schedule performance optimization sprint

Customer Impact: Minor - occasional slow page loads during peak hours
Business Impact: Low - system functional but suboptimal`;
  } else {
    return `
LOW RISK for production deployment:

✅ System demonstrates excellent stability:
- Can handle sustained load for extended periods
- Suitable for 24/7 e-commerce operations
- Ready for Black Friday / flash sale events
- Minimal performance degradation over time

Continue best practices:
- Regular performance monitoring
- Gradual traffic increase during launches
- Maintain current architecture patterns`;
  }
}

function generateConclusion(results) {
  const allPass = results.degradation.status === 'STABLE' && 
                  results.errorRate.status === 'PASS' && 
                  results.throughput.status === 'STABLE';
  
  if (allPass) {
    return `The soak test demonstrates that the e-commerce platform maintains stable
performance under sustained moderate load over an extended duration. No
significant memory leaks, resource exhaustion, or performance degradation
were detected. The system is production-ready for sustained operations.`;
  } else {
    return `The soak test identified stability concerns that require attention before
production deployment. The system shows signs of degradation under sustained
load, which could lead to failures during extended operations such as
multi-day sales events. Address the identified issues and re-run soak tests.`;
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node analyze-soak.js <artillery-results.json>');
    process.exit(1);
  }
  
  const jsonPath = args[0];
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: File not found: ${jsonPath}`);
    process.exit(1);
  }
  
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         ANALYZING SOAK TEST RESULTS                            ║');
  console.log('║         Author: Aum Yogeshbhai Chotaliya (A0285229M)          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const artilleryData = parseArtilleryResults(jsonPath);
  
  const analysisResults = {
    degradation: analyzePerformanceDegradation(artilleryData),
    errorRate: analyzeErrorTrend(artilleryData),
    throughput: analyzeThroughput(artilleryData)
  };
  
  generateReport(analysisResults, artilleryData);
  
  console.log('✅ Soak test analysis completed!\n');
}

main();
