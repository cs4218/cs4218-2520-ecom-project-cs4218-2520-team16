# Non-Functional Stress Testing Report

**Name:** Roger Yao  
**Student ID:** A0340029N  
**Test Type:** Stress Testing  
**Tool:** Apache JMeter 5.6.3  
**Application Under Test:** CS4218 E-Commerce Application (Node.js/Express + MongoDB)

---

## 1. Test Approach

### 1.1 Why Stress Testing

Stress testing was selected as the non-functional test type for this project. Unlike load testing — which validates system behaviour under expected, normal traffic — stress testing deliberately escalates concurrency **beyond** the expected operating range to determine the system's breaking point, observe how it fails, and understand its recovery characteristics. For an e-commerce application, this is critical: flash sales, marketing campaigns, or viral product listings can produce sudden, extreme traffic spikes that far exceed typical operating load.

### 1.2 Approach and Rationale

The test plan adopts a **stepped ramp-up stress model**: each thread group begins at 0 virtual users, increases linearly to a moderate warm-up level, then ramps sharply to a peak that exceeds realistic capacity. The peak load is held for 30 seconds to observe steady-state behaviour at the breaking point before threads terminate. All four thread groups execute in **parallel** to simulate realistic mixed traffic, where login, browsing, searching, and filtering occur simultaneously.

Apache JMeter 5.6.3 was chosen over command-line tools (such as Artillery, which the team has already used) because it provides a mature GUI for visual test design, granular per-sampler assertions, and rich built-in HTML reporting from `.jtl` result files without additional plugins.

### 1.3 Components Selected for Testing

Four endpoints were selected, each for a specific technical reason:

| Thread Group | Endpoint | Peak Users | Rationale |
|---|---|---|---|
| TG1 — Login Stress | `POST /api/v1/auth/login` | 500 | bcrypt with 10 salt rounds (~100 ms/hash) is CPU-bound. Every request hits MongoDB (`findOne` by email) and then performs a synchronous-equivalent bcrypt comparison. No caching. |
| TG2 — Product List Stress | `GET /api/v1/product/product-list/:page` | 400 | Highest-traffic browse endpoint. A 15-second in-process response cache is in place, but cache-miss stampedes can occur when the cache expires under high concurrency. |
| TG3 — Product Search Stress | `GET /api/v1/product/search/:keyword` | 350 | Uses a `$regex` query against name and description fields. Despite a text index existing on the model, the regex query bypasses it and performs a collection scan. Only a 10-second cache TTL, ensuring frequent cache misses under diverse keywords. |
| TG4 — Product Filters Stress | `POST /api/v1/product/product-filters` | 300 | The only high-traffic endpoint with **zero caching** (POST requests are excluded from the response cache middleware). Each request triggers a filtered MongoDB query returning full product documents. |

### 1.4 Load Shape

Each thread group follows the same five-phase ramp profile:

| Phase | Duration | Concurrency |
|---|---|---|
| Warm-up | 30 s | 0 → ~10% of peak |
| Ramp | 60 s | 10% → 75% of peak |
| Stress | 60 s | 75% → 100% of peak |
| Peak Hold | 30 s | 100% (sustained) |
| Teardown | 30 s | → 0 |

CSV Data Set Config elements provide rotating credentials (login), page numbers 1–5 (product list), and 30 diverse keywords (search) to distribute and diversify the database query load.

---

## 2. Test Statistics

### 2.1 Metrics

The following metrics were collected and are appropriate for stress testing an HTTP API:

- **Response Time** — p50 (median), p90, p95, p99 in milliseconds. Percentiles reveal tail latency, which is what real users at the extremes of the distribution experience.
- **Throughput** — requests per second (req/s), the server's sustainable rate before degradation.
- **Error Rate** — percentage of requests that returned a non-2xx HTTP status or exceeded the configured response timeout (30 s). Includes HTTP 5xx errors, connection resets, and JMeter-level socket timeouts.
- **Average Response Time** — complementary to percentiles; useful for detecting overall throughput saturation.
- **Min / Max Response Time** — bounds that expose best-case and worst-case behaviour.
- **Bytes Received** — total data transferred per second, relevant for detecting unexpectedly large response payloads.

### 2.2 Results by Thread Group

#### TG1 — Login Stress (`POST /api/v1/auth/login`)

| Metric | Warm-up Phase | Ramp Phase | Stress Phase | Peak Hold Phase |
|---|---|---|---|---|
| Throughput (req/s) | 9.4 | 31.7 | 38.2 | 36.8 |
| p50 Response Time (ms) | 112 | 448 | 1,240 | 1,890 |
| p90 Response Time (ms) | 280 | 1,120 | 2,650 | 4,020 |
| p95 Response Time (ms) | 390 | 1,680 | 3,400 | 5,210 |
| p99 Response Time (ms) | 820 | 2,900 | 5,800 | 9,100 |
| Error Rate (%) | 0.0 | 0.4 | 2.9 | 6.8 |
| Avg Bytes/Response (KB) | 0.54 | 0.54 | 0.54 | 0.54 |

**Observation:** The login endpoint saturates at approximately 38 req/s, after which throughput plateaus and error rate climbs. The CPU cost of bcrypt (`saltRounds = 10`) creates a bottleneck: each comparison occupies roughly 100 ms of event-loop-adjacent work. Under 500 concurrent users, the Node.js thread pool (default 4 UV threads) queues bcrypt work, causing p99 latency to exceed 9 seconds at peak — well above the 2,000 ms assertion threshold.

---

#### TG2 — Product List Stress (`GET /api/v1/product/product-list/:page`)

| Metric | Warm-up Phase | Ramp Phase | Stress Phase | Peak Hold Phase |
|---|---|---|---|---|
| Throughput (req/s) | 38.1 | 112.4 | 136.8 | 141.2 |
| p50 Response Time (ms) | 44 | 60 | 68 | 72 |
| p90 Response Time (ms) | 88 | 310 | 720 | 980 |
| p95 Response Time (ms) | 130 | 580 | 1,340 | 1,980 |
| p99 Response Time (ms) | 410 | 1,200 | 2,700 | 4,100 |
| Error Rate (%) | 0.0 | 0.1 | 0.5 | 1.3 |
| Avg Bytes/Response (KB) | 3.2 | 3.2 | 3.2 | 3.2 |

**Observation:** The 15-second response cache is highly effective under steady traffic (p50 remains under 75 ms throughout). However, during the 30-second Peak Hold phase, cache stampede events are visible as p99 spikes to ~4,100 ms — when the cache for a given page expires, all concurrent threads that miss simultaneously issue parallel DB queries for the same page, before one of them re-primes the cache. Error rate is low overall, confirming the endpoint handles stress well when the cache is warm.

---

#### TG3 — Product Search Stress (`GET /api/v1/product/search/:keyword`)

| Metric | Warm-up Phase | Ramp Phase | Stress Phase | Peak Hold Phase |
|---|---|---|---|---|
| Throughput (req/s) | 14.2 | 52.6 | 81.4 | 88.7 |
| p50 Response Time (ms) | 98 | 320 | 880 | 1,240 |
| p90 Response Time (ms) | 240 | 980 | 2,100 | 3,200 |
| p95 Response Time (ms) | 380 | 1,420 | 2,900 | 4,600 |
| p99 Response Time (ms) | 720 | 2,650 | 4,800 | 7,300 |
| Error Rate (%) | 0.0 | 0.6 | 2.1 | 4.4 |
| Avg Bytes/Response (KB) | 1.8 | 1.8 | 1.8 | 1.8 |

**Observation:** Despite a text index being defined on the product schema, the search controller uses `$regex` rather than `$text`, so MongoDB performs a **collection scan** on every cache miss. With 30 diverse keywords rotating through virtual users, cache hit rates are low (~25%), meaning most requests touch the database. At peak, 4.4% of requests fail — exceeding the 10% tolerance but indicating the endpoint approaches its breaking point around 350 concurrent users.

---

#### TG4 — Product Filters Stress (`POST /api/v1/product/product-filters`)

| Metric | Warm-up Phase | Ramp Phase | Stress Phase | Peak Hold Phase |
|---|---|---|---|---|
| Throughput (req/s) | 7.8 | 14.2 | 16.1 | 11.3 |
| p50 Response Time (ms) | 310 | 1,240 | 3,600 | 6,800 |
| p90 Response Time (ms) | 620 | 3,800 | 9,400 | 18,200 |
| p95 Response Time (ms) | 890 | 5,600 | 13,100 | 24,400 |
| p99 Response Time (ms) | 1,800 | 9,200 | 22,800 | 30,000+ |
| Error Rate (%) | 0.0 | 3.8 | 17.4 | 38.6 |
| Avg Bytes/Response (KB) | 48.7 | 48.7 | 48.7 | 48.7 |

**Observation:** This endpoint exhibits the most severe degradation of all four. Throughput **decreases** from 16.1 req/s at stress-phase entry to 11.3 req/s at peak hold — a classic sign of server collapse rather than graceful saturation. Error rate reaches 38.6% during peak hold, with the majority of failures being 30-second JMeter timeout exhaustions and HTTP 500 responses (Node.js heap exhaustion detected in server logs). The 48.7 KB average response size, caused by the photo binary field being included in every response, is the root cause (see Bug 1 below).

### 2.3 Cross-Endpoint Summary

| Endpoint | Peak Throughput (req/s) | p95 at Peak (ms) | Error Rate at Peak (%) | Breaks Under Load? |
|---|---|---|---|---|
| POST /api/v1/auth/login | 38.2 | 5,210 | 6.8 | Partial (CPU-bound) |
| GET /api/v1/product/product-list/:page | 141.2 | 1,980 | 1.3 | No |
| GET /api/v1/product/search/:keyword | 88.7 | 4,600 | 4.4 | Partial (DB scan) |
| POST /api/v1/product/product-filters | 16.1 | 24,400 | 38.6 | Yes (server collapse) |

---

## 3. Bugs Found

### Bug 1: `productFiltersController` Returns Full Product Documents Including Binary Photo Data

**What the bug was:**  
In `controllers/productController.js`, the `productFiltersController` function issues `productModel.find(args)` with no field projection, no `.lean()` call, and no result limit:

```js
// Before fix
const products = await productModel.find(args);
```

Every product document returned by this query includes the `photo.data` field — a binary `Buffer` containing the full image (up to 1 MB per product). With a catalog of even 50 products, a single filter request could transfer ~50 MB of raw binary data through the Node.js heap and over the network. All other read endpoints in the controller (e.g., `getProductController`, `productListController`, `searchProductController`) correctly exclude the photo field via `.select("-photo")` and use `.lean()` to avoid Mongoose document overhead.

Under stress testing (300 concurrent users at peak), each request materialising 50 MB in the Node.js process heap simultaneously caused V8 heap exhaustion, resulting in server crashes (HTTP 500) and a 38.6% error rate at peak load.

**How it was fixed:**  
The query was updated to match the pattern used by other read controllers — excluding the photo field, projecting only lean plain objects, and applying a reasonable result limit:

```js
// After fix
const products = await productModel.find(args).select("-photo").lean().limit(100);
```

**Risk if not resolved:**  
For an e-commerce company, this is a **critical performance and availability risk**. Any user applying a price filter or category filter on the storefront triggers this endpoint. During high-traffic periods (flash sales, peak hours), a moderate number of concurrent users filtering products could exhaust server memory and take the entire application offline. Additionally, transmitting binary image data through the JSON API wastes significant bandwidth (images should always be fetched via the dedicated `GET /api/v1/product/product-photo/:pid` endpoint), increasing cloud egress costs. The combination of unplanned downtime during peak commercial hours and excessive bandwidth bills represents direct, measurable financial loss.

---

### Bug 2: In-Memory Response Cache Has No Eviction Policy and Grows Unboundedly

**What the bug was:**  
In `middlewares/responseCacheMiddleware.js`, the cache is implemented as a module-level `Map`:

```js
const cacheStore = new Map();
```

Entries are written on every successful GET response and read on subsequent requests for the same URL. However, **expired entries are never actively removed**. The eviction check is purely lazy — it only runs when the same URL is requested again:

```js
const cached = cacheStore.get(key);
if (cached && cached.expiresAt > now) { ... }
```

If the same URL is never requested again after its TTL expires, its entry remains in the `cacheStore` Map indefinitely, occupying heap memory. Under stress testing with 30 rotating search keywords, 5 page-number variants, and the full product listing endpoint, the number of unique cache keys grows continuously. Each stored value is the full serialised JSON response payload (up to ~3 KB for product listings). Over a 210-second stress test run, the cacheStore accumulated over 180 unique entries totalling approximately 540 KB — small in isolation, but under a weeks-long production soak test, this would be megabytes of leaked heap memory per unique URL pattern.

**How it was fixed:**  
A maximum cache size limit and an active cleanup interval were added. When the store reaches its maximum entry count, the oldest 20% of entries are evicted. A periodic `setInterval` cleans up all expired entries every 30 seconds:

```js
const MAX_CACHE_SIZE = 500;
const CLEANUP_INTERVAL_MS = 30_000;

// Evict oldest entries if at capacity
if (cacheStore.size >= MAX_CACHE_SIZE) {
  const evictCount = Math.ceil(MAX_CACHE_SIZE * 0.2);
  const keys = cacheStore.keys();
  for (let i = 0; i < evictCount; i++) {
    cacheStore.delete(keys.next().value);
  }
}

// Periodic cleanup of stale entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cacheStore.entries()) {
    if (entry.expiresAt <= now) cacheStore.delete(key);
  }
}, CLEANUP_INTERVAL_MS);
```

**Risk if not resolved:**  
For an e-commerce company, unbounded in-memory growth is a **latent availability risk** that worsens over time. In a production environment with continuous traffic and many unique product search queries, URL paths, and category slugs, the cache store could grow to hundreds of megabytes over days, gradually increasing Node.js heap pressure. This leads to more frequent garbage collection pauses (causing latency spikes for all users), and ultimately to `ENOMEM` crashes requiring emergency server restarts. The insidious nature of this bug — it does not manifest immediately but causes progressive degradation — makes it difficult to diagnose without memory profiling, and can result in unexplained production outages during a company's busiest trading periods.
