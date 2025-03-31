const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// プロジェクトのルートディレクトリ
const rootDir = path.resolve(__dirname, '..');

try {
  console.log('Building TypeScript files...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  console.log('Build completed successfully.');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
