const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const target = process.argv[2]; // 'ms' or 'ovsx'

if (!target || !['ms', 'ovsx'].includes(target)) {
  console.error('❌ Usage: node scripts/deploy.js [ms|ovsx]');
  process.exit(1);
}

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const targetPublisher = target === 'ms' ? 'gunwww' : 'geonhwiii';
const originalPublisher = packageJson.publisher;

console.log(`\n📦 Target Marketplace: ${target.toUpperCase()}`);
console.log(`👤 Setting publisher to: "${targetPublisher}"...`);

// 1. Update publisher in package.json
packageJson.publisher = targetPublisher;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

try {
  // 2. Build VSIX package
  console.log('\n🔨 Packaging VSIX...');
  execSync('npx @vscode/vsce package --no-dependencies', { stdio: 'inherit' });

  const vsixFileName = `${packageJson.name}-${packageJson.version}.vsix`;

  // 3. Publish to targeted marketplace
  if (target === 'ms') {
    console.log('\n🚀 Publishing to Microsoft Visual Studio Marketplace (gunwww)...');
    const pat = process.env.VSCE_PAT;
    const cmd = pat ? `npx @vscode/vsce publish -p ${pat}` : 'npx @vscode/vsce publish';
    execSync(cmd, { stdio: 'inherit' });
  } else {
    console.log('\n🚀 Publishing to Open VSX Registry (geonhwiii)...');
    const pat = process.env.OVSX_PAT;
    const cmd = pat ? `npx ovsx publish ${vsixFileName} -p ${pat}` : `npx ovsx publish ${vsixFileName}`;
    execSync(cmd, { stdio: 'inherit' });
  }

  console.log(`\n✅ Successfully published to ${target.toUpperCase()}!`);
} catch (error) {
  console.error(`\n❌ Deployment to ${target.toUpperCase()} failed:`, error.message);
  process.exit(1);
}
