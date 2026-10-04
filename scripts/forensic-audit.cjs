const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const ignoreDirs = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'venv', '.agents', '.devcontainer']);

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (ignoreDirs.has(file)) continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

const allFiles = walk(rootDir);
const relFiles = allFiles.map(f => path.relative(rootDir, f).replace(/\\/g, '/'));

console.log(`Total non-ignored files: ${relFiles.length}`);

// Count by extension and area
const areaCounts = {};
const largeFiles = [];

for (const rel of relFiles) {
  const parts = rel.split('/');
  const top = parts[0] + (parts[1] && (parts[0] === 'apps' || parts[0] === 'services') ? '/' + parts[1] : '');
  areaCounts[top] = (areaCounts[top] || 0) + 1;

  if (rel.endsWith('.ts') || rel.endsWith('.tsx') || rel.endsWith('.js') || rel.endsWith('.jsx')) {
    try {
      const content = fs.readFileSync(path.join(rootDir, rel), 'utf8');
      const lines = content.split('\n').length;
      if (lines > 400) {
        largeFiles.push({ file: rel, lines });
      }
    } catch (e) {}
  }
}

largeFiles.sort((a, b) => b.lines - a.lines);

console.log('--- Area Counts ---');
console.log(JSON.stringify(areaCounts, null, 2));

console.log('--- Large Files (> 400 lines) ---');
console.log(JSON.stringify(largeFiles.slice(0, 30), null, 2));
