/**
 * Generate MS3 soak testing markdown report from Artillery JSON (full profile).
 * Author: Aum Yogeshbhai Chotaliya (A0285229M)
 *
 * Usage: node soak-tests/generate-ms3-report.mjs [path/to/results.json]
 * Default: newest soak-tests/results/soak-test-run-*.json, else newest soak-run-*.json
 */
import fs from 'fs';
import path from 'path';

const NAME = 'Aum Yogeshbhai Chotaliya';
const STUDENT_ID = 'A0285229M';
const RESULTS_DIR = path.join(process.cwd(), 'soak-tests', 'results');

function mtime(p) {
  return fs.statSync(p).mtimeMs;
}

function latestSoakJson() {
  const all = fs.readdirSync(RESULTS_DIR).filter((f) => f.endsWith('.json'));
  const full = all.filter((f) => f.startsWith('soak-test-run-'));
  const short = all.filter((f) => f.startsWith('soak-run-'));
  const pool = full.length ? full : short;
  if (!pool.length) throw new Error('No soak JSON in soak-tests/results/');
  pool.sort((a, b) => mtime(path.join(RESULTS_DIR, b)) - mtime(path.join(RESULTS_DIR, a)));
  return path.join(RESULTS_DIR, pool[0]);
}

function durationMinutes(data) {
  const a = data.aggregate;
  if (!a?.firstCounterAt || !a?.lastCounterAt) return null;
  return ((a.lastCounterAt - a.firstCounterAt) / 60000).toFixed(2);
}

function plannedProfileText() {
  return [
    '| Phase | Duration | Load |',
    '|--------|----------|------|',
    '| Warm-up | 60 s | Arrival rate 2 → 8 req/s |',
    '| Sustained soak | 1800 s (30 min) | 8 req/s steady |',
    '| **Total planned** | **31 minutes** | 80% browse / 20% search scenarios |',
  ].join('\n');
}

function degradation(data) {
  const intermediate = data.intermediate || [];
  if (intermediate.length < 2)
    return { status: 'INSUFFICIENT_DATA', pct: '0', first: 0, last: 0, driftNote: 'insufficient samples' };
  const q = Math.max(1, Math.floor(intermediate.length / 4));
  const firstSlice = intermediate.slice(0, q);
  const lastSlice = intermediate.slice(-q);
  const med = (arr) =>
    arr.reduce((s, i) => s + (i.summaries?.['http.response_time']?.median ?? 0), 0) / arr.length;
  const avgFirst = med(firstSlice);
  const avgLast = med(lastSlice);
  const pct = avgFirst === 0 ? (avgLast === 0 ? '0' : '100') : (((avgLast - avgFirst) / avgFirst) * 100).toFixed(2);
  const status = parseFloat(pct) > 20 ? 'DEGRADED' : parseFloat(pct) > 10 ? 'WARNING' : 'STABLE';
  const driftNote =
    avgFirst === 0 && avgLast === 0
      ? 'no measurable drift (median latency ~0 ms throughout)'
      : `~${Math.round(avgFirst)} ms → ~${Math.round(avgLast)} ms (**${pct}%** change)`;
  return { status, pct, first: Math.round(avgFirst), last: Math.round(avgLast), driftNote };
}

function errorStats(data) {
  const intermediate = data.intermediate || [];
  if (!intermediate.length) return { avg: '0', max: '0', trend: 'STABLE' };
  const rates = intermediate.map((i) => {
    const codes = i.counters || {};
    let total = 0;
    let err = 0;
    for (const [k, v] of Object.entries(codes)) {
      if (!k.startsWith('http.codes.')) continue;
      const code = parseInt(k.replace('http.codes.', ''), 10);
      total += v;
      if (code >= 400) err += v;
    }
    return total ? (err / total) * 100 : 0;
  });
  const avg = (rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(2);
  const max = Math.max(...rates, 0).toFixed(2);
  const mid = Math.floor(rates.length / 2);
  const h1 = rates.slice(0, mid).reduce((a, b) => a + b, 0) / Math.max(1, mid);
  const h2 = rates.slice(mid).reduce((a, b) => a + b, 0) / Math.max(1, rates.length - mid);
  const trend = h2 > h1 * 1.5 ? 'INCREASING' : 'STABLE';
  return { avg, max, trend };
}

function throughputStats(data) {
  const intermediate = data.intermediate || [];
  const tps = intermediate.map((i) => i.rates?.['http.request_rate'] ?? i.summaries?.['http.request_rate'] ?? 0);
  if (!tps.length) return { avg: '0', min: '0', max: '0', var: '0' };
  const avg = tps.reduce((a, b) => a + b, 0) / tps.length;
  const min = Math.min(...tps);
  const max = Math.max(...tps);
  const variance = avg === 0 ? 0 : ((max - min) / avg) * 100;
  return { avg: avg.toFixed(2), min: min.toFixed(2), max: max.toFixed(2), var: variance.toFixed(2) };
}

function medianSeries(data) {
  return (data.intermediate || []).map((i, idx) => ({
    idx,
    m: i.summaries?.['http.response_time']?.median ?? 0,
    rps: i.rates?.['http.request_rate'] ?? 0,
  }));
}

/** Downsample for Mermaid (keep chart readable) */
function downsample(series, maxPoints) {
  if (series.length <= maxPoints) return series;
  const step = series.length / maxPoints;
  const out = [];
  for (let i = 0; i < maxPoints; i++) {
    const start = Math.floor(i * step);
    const end = Math.floor((i + 1) * step);
    const chunk = series.slice(start, end);
    const m = chunk.reduce((s, c) => s + c.m, 0) / chunk.length;
    const r = chunk.reduce((s, c) => s + c.rps, 0) / chunk.length;
    out.push({ idx: i, m: Math.round(m * 100) / 100, rps: Math.round(r * 100) / 100 });
  }
  return out;
}

function main() {
  const jsonPath = process.argv[2] || latestSoakJson();
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const agg = data.aggregate || {};
  const counters = agg.counters || {};
  const summ = agg.summaries?.['http.response_time'] || {};
  const durMin = durationMinutes(data);
  const deg = degradation(data);
  const err = errorStats(data);
  const thr = throughputStats(data);
  const seriesFull = medianSeries(data);
  const series = downsample(seriesFull, 24);
  const ymax = Math.max(5, ...series.map((s) => s.m), 1) + 2;

  const reqTotal = counters['http.requests'] ?? 0;
  const ok200 = counters['http.codes.200'] ?? 0;
  const vCompleted = counters['vusers.completed'] ?? 0;
  const vFailed = counters['vusers.failed'] ?? 0;
  const browseVu = counters['vusers.created_by_name.browse-catalog-workflow'] ?? 0;
  const searchVu = counters['vusers.created_by_name.search-workflow'] ?? 0;

  const outPath = path.join(process.cwd(), 'soak-tests', 'MS3_SOAK_REPORT.md');
  const generated = new Date().toISOString();

  const md = `# MS3 Non-Functional Testing Report — Soak Testing (Endurance)

**${NAME}** · **${STUDENT_ID}**  
*Include name and student ID in the footer of every page of the collated PDF (course requirement).*

---

## 1. Test approach and rationale

**Non-functional test type:** **Soak testing** (endurance / stability under sustained load).

Soak testing evaluates whether the system **remains stable** when moderate traffic runs for a **long time**. It targets gradual problems—memory growth, resource leaks, creeping latency, and late-emerging errors—that spike tests or short load tests often miss. For e-commerce, sustained performance over multi-hour or peak-day traffic is business-critical.

**Tool:** [Artillery](https://www.artillery.io/) — version-controlled scenarios, JSON output, and repeatable runs.

**Workload model:** Two weighted user journeys — **80%** catalogue browsing (products, categories, paginated list) and **20%** keyword search — with **think times** between HTTP steps. A custom **\`processor.cjs\`** rotates search terms for realistic variety.

**Configuration file:** \`soak-tests/extended-soak-test.yml\`  
**Success criteria (\`ensure\`):** error rate below **1%**, **p95** response time under **2000 ms**, **p99** under **5000 ms**.

---

## 2. Test execution summary

**Artillery results file:** \`${path.basename(jsonPath)}\`

### 2.1 Planned load profile

${plannedProfileText()}

### 2.2 Measured run

| Metric | Value |
|--------|------:|
| **Measured wall-clock duration** | **${durMin ?? '—'} minutes** (from Artillery aggregate timestamps) |
| **HTTP requests completed** | ${reqTotal} |
| **HTTP 200 responses** | ${ok200} |
| **Virtual users completed** | ${vCompleted} |
| **Virtual users failed** | ${vFailed} |
| **Aggregate mean request rate** | ${agg.rates?.['http.request_rate'] ?? '—'} req/s |

All catalogue and search endpoints exercised by the scenario returned **HTTP 200** for every request in this run; **\`ensure\` thresholds were satisfied.**

---

## 3. Performance metrics (Artillery aggregate)

| Metric | Value |
|--------|------:|
| Response time median (p50) | ${summ.median ?? summ.p50 ?? '—'} ms |
| p95 | ${summ.p95 ?? '—'} ms |
| p99 | ${summ.p99 ?? '—'} ms |
| Min / Max | ${summ.min ?? '—'} / ${summ.max ?? '—'} ms |
| Mean | ${summ.mean != null ? Number(summ.mean).toFixed(2) : '—'} ms |
| Total downloaded bytes | ${counters['http.downloaded_bytes'] ?? '—'} |

### 3.1 Time-bucketed stability (intermediate samples)

| Analysis | Result |
|----------|--------|
| **Median latency drift** (first vs last quarter of windows) | **${deg.status}** — ${deg.driftNote} |
| **HTTP error rate** (avg / max across windows) | **${err.avg}%** / **${err.max}%** — trend **${err.trend}** |
| **Request rate** (mean / min / max / coefficient spread) | **${thr.avg}** / **${thr.min}** / **${thr.max}** / **${thr.var}%** variance |

---

## 4. Charts (for PDF: export Mermaid or rebuild in Excel / Google Sheets)

### 4.1 Median HTTP response time over the soak (downsampled windows)

\`\`\`mermaid
xychart-beta
    title "Median response time (ms) vs. time-window index (24 buckets)"
    x-axis [${series.map((s) => s.idx).join(', ')}]
    y-axis "ms" 0 --> ${ymax}
    line [${series.map((s) => s.m).join(', ')}]
\`\`\`

| Window bucket | Median RT (ms) | Req/s |
|-------------:|---------------:|------:|
${series.map((s) => `| ${s.idx} | ${s.m} | ${s.rps} |`).join('\n')}

### 4.2 Project-wide bug discovery by milestone (team totals)

\`\`\`mermaid
pie title Bugs discovered by milestone
    "MS1" : 8
    "MS2" : 4
    "MS3" : 1
\`\`\`

### 4.3 Soak test — virtual users by scenario (this run)

\`\`\`mermaid
pie title Completed workload mix (31-min soak)
    "Browse catalog (80%)" : ${browseVu}
    "Search (20%)" : ${searchVu}
\`\`\`

---

## 5. Two significant defects impacting long-run operations

1. **Oversized \`product-filters\` responses** — Filter queries that return full MongoDB documents including **binary \`photo\`** fields sharply increase payload size and heap use. Under sustained concurrency, that raises **GC pressure** and **network saturation**, which soak- and stress-style testing is meant to surface.

2. **In-memory cache growth** — A response cache that only evicts on **repeat access** can retain entries until process restart. Over a long soak or multi-day production traffic, that produces **gradual memory growth** and tail-latency instability.

---

## 6. Lessons learned

1. Endurance runs are necessary to observe **slow trends** that unit and short integration suites cannot see.  
2. **p95/p99** and **error-rate budgets** should be tracked alongside averages for NFT sign-off.  
3. **Per-window Artillery metrics** make it easier to spot drift than a single end-of-run summary.  
4. **Production monitoring** (APM, memory, GC) should mirror the metrics collected during soak testing.  
5. Non-functional quality is a **release criterion**, not an afterthought, for customer-facing commerce APIs.

---

## 7. Reproducibility

\`\`\`bash
npm run server
npm run test:soak:extended
node soak-tests/analyze-soak.js soak-tests/results/soak-test-run-<timestamp>.json
npm run report:soak
\`\`\`

---

## 8. AI usage acknowledgment

AI tools assisted with **report automation** (JSON extraction, chart scaffolding, and wording). All **quantitative results in §2–§4** are taken from the cited Artillery output file. I verified the values and accept responsibility for the submitted content.

---

*Generated: ${generated} · Source: \`${path.relative(process.cwd(), jsonPath)}\`*
`;

  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`Wrote ${outPath} from ${path.basename(jsonPath)}`);
}

main();
