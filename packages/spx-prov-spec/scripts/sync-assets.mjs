import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, '..');
const repoRoot = resolve(pkgRoot, '..', '..');
const checkOnly = process.argv.includes('--check');

const mirrors = [
  {
    name: 'schemas',
    source: resolve(repoRoot, 'schemas'),
    target: resolve(pkgRoot, 'src', 'generated', 'schemas'),
  },
  {
    name: 'vectors',
    source: resolve(repoRoot, 'vectors'),
    target: resolve(pkgRoot, 'src', 'generated', 'vectors'),
  },
];

function listFiles(root) {
  if (!existsSync(root)) {
    return [];
  }
  const files = [];
  for (const entry of readdirSync(root)) {
    const fullPath = join(root, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...listFiles(fullPath));
      continue;
    }
    files.push(fullPath);
  }
  return files;
}

function hashFile(path) {
  const digest = createHash('sha256');
  digest.update(readFileSync(path));
  return digest.digest('hex');
}

function fileMap(root) {
  const map = new Map();
  for (const file of listFiles(root)) {
    map.set(relative(root, file), hashFile(file));
  }
  return map;
}

function syncDir(source, target) {
  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true, force: true });
}

function checkDir(source, target, label) {
  const sourceMap = fileMap(source);
  const targetMap = fileMap(target);
  const issues = [];

  for (const [relPath, hash] of sourceMap.entries()) {
    if (!targetMap.has(relPath)) {
      issues.push(`[${label}] missing in target: ${relPath}`);
      continue;
    }
    if (targetMap.get(relPath) !== hash) {
      issues.push(`[${label}] content mismatch: ${relPath}`);
    }
  }

  for (const relPath of targetMap.keys()) {
    if (!sourceMap.has(relPath)) {
      issues.push(`[${label}] extra file in target: ${relPath}`);
    }
  }

  return issues;
}

if (checkOnly) {
  let errors = [];
  for (const mirror of mirrors) {
    errors = errors.concat(checkDir(mirror.source, mirror.target, mirror.name));
  }

  if (errors.length > 0) {
    console.error('Asset drift detected between canonical root and package mirrors:');
    for (const issue of errors) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  console.log('Asset mirrors are in sync.');
  process.exit(0);
}

for (const mirror of mirrors) {
  syncDir(mirror.source, mirror.target);
}

console.log('Synced schemas/ and vectors/ into @provenance/spx-prov-spec package mirrors.');
