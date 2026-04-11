/**
 * Run extended soak test with timestamped Artillery JSON output (cross-platform).
 * Author: Aum Yogeshbhai Chotaliya (A0285229M)
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const baseUrl = process.env.LOAD_TEST_BASE_URL || 'http://localhost:6060';
const resultsDir = path.join(process.cwd(), 'soak-tests', 'results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outFile = path.join(resultsDir, `soak-test-run-${stamp}.json`);
const configPath = path.join(process.cwd(), 'soak-tests', 'extended-soak-test.yml');

const artilleryBin = path.join(process.cwd(), 'node_modules', '.bin', 'artillery');
const cmd = fs.existsSync(artilleryBin) ? artilleryBin : 'npx';
const args = fs.existsSync(artilleryBin)
  ? ['run', '--target', baseUrl, '--output', outFile, configPath]
  : ['artillery', 'run', '--target', baseUrl, '--output', outFile, configPath];

const useShell = cmd === 'npx';
const r = spawnSync(cmd, args, { stdio: 'inherit', shell: useShell, env: process.env });

process.exit(r.status ?? 1);
