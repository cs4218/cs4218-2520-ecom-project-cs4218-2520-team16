# Soak Testing Quick Start
## Aum Yogeshbhai Chotaliya (A0285229M)

## Run the Soak Test

**⏱️ This test takes ~31 minutes to complete!**

```bash
# Terminal 1: Start the server
npm run server

# Terminal 2: Run the soak test
npm run test:soak:extended
```

The test will output results to `soak-tests/results/soak-test-run-<timestamp>.json`

## Analyze Results

After the test completes:

```bash
# Analyze the results (replace with your actual filename)
npm run test:soak:analyze soak-tests/results/soak-test-run-20260411-143022.json
```

Or directly:
```bash
node soak-tests/analyze-soak.js soak-tests/results/soak-test-run-*.json
```

## What You'll See

The test will show:
- Real-time metrics every ~10 seconds
- Request rates, response times, error counts
- At the end: comprehensive summary

The analysis script will generate:
- Performance degradation analysis
- Error rate trends
- Throughput consistency
- Business impact assessment

## For MS3 Report

1. Run the soak test (31 min)
2. Run the analysis script
3. Screenshots needed:
   - Artillery test running (terminal output)
   - Final summary statistics
   - Analysis report output
4. Collect the generated analysis report from `soak-tests/results/`

## Metrics You'll Get

- **Performance**: Response time trends (first quarter vs last quarter)
- **Stability**: Error rate over time
- **Consistency**: Throughput variance
- **Assessment**: Pass/Warning/Fail with business impact

## Expected Results

**Healthy System:**
- ✅ Response times stable (±10%)
- ✅ Error rate < 1%
- ✅ Throughput consistent

**Issues to Watch For:**
- ❌ Response times increasing over time (memory leak)
- ❌ Errors appearing after 15+ minutes (resource exhaustion)
- ⚠️ High throughput variance (instability)
