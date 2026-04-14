# Soak Testing Results Directory
## Aum Yogeshbhai Chotaliya (A0285229M)

This directory stores all soak test results and analysis reports.

## Files Generated

### 1. Artillery Test Output
- **Filename**: `soak-test-run-<timestamp>.json`
- **Content**: Full Artillery JSON output with all metrics
- **Usage**: Input for analysis script

### 2. Analysis Reports
- **Filename**: `soak-analysis-<timestamp>.txt`
- **Content**: Human-readable comprehensive analysis
- **Includes**:
  - Performance degradation assessment
  - Error rate analysis
  - Throughput consistency
  - Business impact evaluation
  - Recommendations

## Viewing Results

1. **JSON Results**: Raw Artillery data
   ```bash
   cat soak-tests/results/soak-test-run-*.json | jq .aggregate
   ```

2. **Analysis Report**: Comprehensive assessment
   ```bash
   cat soak-tests/results/soak-analysis-*.txt
   ```

## For MS3 Submission

Include in your report:
1. Latest `soak-analysis-*.txt` file (full report)
2. Screenshots of terminal output during test execution
3. Key metrics table from analysis report
4. Business impact section

## File Retention

Keep at least 2-3 test runs for comparison:
- Baseline run (initial test)
- After optimization (if any)
- Final run (for MS3 submission)
