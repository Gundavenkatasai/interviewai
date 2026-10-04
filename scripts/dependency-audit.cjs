const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'apps', 'api-node', 'src');
const webDir = path.join(rootDir, 'apps', 'web', 'src');

function getTsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === 'dist' || file === '.git') continue;
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(getTsFiles(full));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
}

const apiFiles = getTsFiles(apiDir);
const webFiles = getTsFiles(webDir);

console.log(`Auditing ${apiFiles.length} API files and ${webFiles.length} Web files...`);

// Check cross-domain imports in API
const crossDomainImports = [];
const apiModulesDir = path.join(apiDir, 'modules');
const modulesList = fs.readdirSync(apiModulesDir).filter(f => fs.statSync(path.join(apiModulesDir, f)).isDirectory());

for (const file of apiFiles) {
  const rel = path.relative(apiDir, file).replace(/\\/g, '/');
  if (!rel.startsWith('modules/')) continue;
  const currentDomain = rel.split('/')[1];
  const content = fs.readFileSync(file, 'utf8');
  const importLines = content.split('\n').filter(l => l.trim().startsWith('import ') || l.trim().startsWith('export '));

  for (const line of importLines) {
    for (const otherDomain of modulesList) {
      if (otherDomain === currentDomain) continue;
      // Match import from other domain
      if (line.includes(`modules/${otherDomain}/`) || line.includes(`../${otherDomain}/`)) {
        crossDomainImports.push({
          sourceDomain: currentDomain,
          targetDomain: otherDomain,
          file: rel,
          import: line.trim()
        });
      }
    }
  }
}

// Check frontend importing backend or backend importing frontend
const couplingIssues = [];
for (const file of webFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('api-node') || content.includes('mongoose') || content.includes('fastify')) {
    couplingIssues.push({
      file: path.relative(rootDir, file).replace(/\\/g, '/'),
      reason: 'Web file references api-node/mongoose/fastify'
    });
  }
}

// Duplicate utilities check
const utilsMap = {};
for (const file of [...apiFiles, ...webFiles]) {
  const base = path.basename(file);
  if (!utilsMap[base]) utilsMap[base] = [];
  utilsMap[base].push(path.relative(rootDir, file).replace(/\\/g, '/'));
}
const duplicateFileNames = Object.entries(utilsMap)
  .filter(([name, paths]) => paths.length > 1 && !['index.ts', 'types.ts', 'styles.ts', 'api.ts'].includes(name))
  .map(([name, paths]) => ({ name, count: paths.length, paths }));

console.log(`Cross-Domain API Imports: ${crossDomainImports.length}`);
console.log(JSON.stringify(crossDomainImports.slice(0, 15), null, 2));

console.log(`Frontend/Backend Coupling Issues: ${couplingIssues.length}`);
console.log(JSON.stringify(couplingIssues, null, 2));

console.log(`Duplicate Filenames across apps: ${duplicateFileNames.length}`);
console.log(JSON.stringify(duplicateFileNames.slice(0, 15), null, 2));
