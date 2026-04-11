# Soak Testing Suite - MS3
## Aum Yogeshbhai Chotaliya (A0285229M)

### Test Type: Soak Testing (Endurance Testing)

Soak testing evaluates system stability and performance degradation over extended periods under sustained load.

## What is Soak Testing?

Soak testing (also called endurance testing) runs the application under moderate load for an extended duration to identify:
- **Memory leaks** - Gradual memory consumption over time
- **Resource exhaustion** - Database connections, file handles, thread pools
- **Performance degradation** - Slowly increasing response times
- **Data corruption** - Long-running processes causing data inconsistencies
- **Cache behavior** - How caching performs over extended periods

## Why Soak Testing for E-Commerce?

E-commerce platforms run 24/7 and must maintain performance across:
- Multi-day sales events (Black Friday, Prime Day)
- Holiday shopping seasons
- Flash sales lasting hours
- Continuous background operations (order processing, inventory updates)

Unlike spike testing (sudden burst) or stress testing (finding limits), soak testing validates that the system won't degrade during normal business operations over time.

## Test Configuration

### Duration: ~31 minutes
- **Warm-up phase**: 60 seconds (2→8 users)
- **Sustained load**: 1800 seconds / **30 minutes** (8 req/s steady)
- **Total runtime**: ~31 minutes (warm-up + soak)

### Load Profile
- **Arrival rate**: 8 requests/second (moderate, realistic load)
- **Approx. total requests**: ~14,400+ over the 30-minute soak (plus warm-up; each virtual user issues multiple HTTP calls per scenario)
- **Traffic pattern**: 80% browsing, 20% searching

### Endpoints Tested
1. `GET /api/v1/product/get-product` - Product catalog
2. `GET /api/v1/category/get-category` - Category list
3. `GET /api/v1/product/product-list/1` - Paginated products
4. `GET /api/v1/product/search/{term}` - Product search (dynamic terms via processor)

## MS3 written report (Markdown → PDF)

After a soak run, generate a **full MS3-style** markdown report (approach, metrics, Mermaid charts, bugs, lessons, AI note):

```bash
npm run report:soak
# or: node soak-tests/generate-ms3-report.mjs [optional/path/to/soak-run.json]
```

Output: `soak-tests/MS3_SOAK_REPORT.md` — open in VS Code / export to PDF or paste into your collated document.

## Setup & Execution

```bash
# 1. Start the server
npm run server

# 2. Run soak test (in another terminal)
npm run test:soak:extended

# Test runs for ~31 minutes — keep the server and terminal open
```

After the run, analyze the latest JSON in `soak-tests/results/`:

```bash
node soak-tests/analyze-soak.js soak-tests/results/soak-test-run-<timestamp>.json
```

## Metrics Collected

### 1. Performance Metrics
- **Response time** (p50, p95, p99) - Track if response times increase over time
- **Throughput** (req/sec) - Verify sustained request handling
- **Error rate** (%) - Detect failures emerging over time

### 2. Resource Metrics
- **Memory usage** - Monitor for memory leaks
- **CPU usage** - Check for CPU creep
- **Database connections** - Verify connection pool management

### 3. Stability Metrics
- **Success rate over time** - Should remain stable
- **Response time trend** - Should not increase significantly
- **Error pattern** - No new errors appearing late in test

## Expected Behavior

### Healthy System (PASS)
- ✅ Response times remain stable (±10% variation)
- ✅ Error rate < 1% throughout test
- ✅ Memory usage plateaus after initial ramp
- ✅ Throughput consistent across entire duration

### Degrading System (FAIL)
- ❌ Response times steadily increase (memory leak indicator)
- ❌ Errors appear after 10+ minutes (resource exhaustion)
- ❌ Memory usage continuously grows (no garbage collection)
- ❌ Throughput gradually decreases

## Files Generated

Results saved in `soak-tests/results/`:
- `soak-test-run-<timestamp>.json` - Full Artillery output
- `soak-analysis-<timestamp>.txt` - Human-readable analysis
- `soak-metrics-<timestamp>.csv` - Time-series data for graphing

## Why This Matters for E-Commerce

A soak test failure means:
- 🔴 **System crashes during Black Friday** - Millions in lost revenue
- 🔴 **Checkout failures after 2 hours** - Cart abandonment, customer complaints
- 🔴 **Database exhaustion** - Complete site outage
- 🔴 **Memory crashes** - Requires manual server restarts
- 🟡 **Gradual slowdown** - Poor user experience, SEO penalties

## Author
**Name**: Aum Yogeshbhai Chotaliya  
**Student ID**: A0285229M  
**Test Type**: Soak Testing (Endurance)
