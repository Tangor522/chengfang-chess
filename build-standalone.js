import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, 'dist');

// Read the built files
const indexHtml = readFileSync(join(distDir, 'index.html'), 'utf-8');
const jsFiles = [];
const cssContent = [];

// Extract JS file references from index.html
const jsMatches = indexHtml.matchAll(/src="(\/assets\/[^"]+\.js)"/g);
for (const match of jsMatches) {
  const fileName = match[1].replace('/assets/', '');
  jsFiles.push(fileName);
}

// Extract CSS file references
const cssMatches = indexHtml.matchAll(/href="(\/assets\/[^"]+\.css)"/g);
for (const match of cssMatches) {
  const fileName = match[1].replace('/assets/', '');
  const content = readFileSync(join(distDir, 'assets', fileName), 'utf-8');
  cssContent.push(content);
}

// Read JS content
let jsContent = '';
for (const fileName of jsFiles) {
  jsContent += readFileSync(join(distDir, 'assets', fileName), 'utf-8') + '\n';
}

// Escape JS content for embedding - convert to base64 to avoid any HTML parsing issues
const jsBase64 = Buffer.from(jsContent).toString('base64');

// Create standalone HTML with base64 encoded JS
const standaloneHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>成方棋</title>
  <style>
${cssContent.join('\n')}
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
(function() {
  var jsCode = atob("${jsBase64}");
  var blob = new Blob([jsCode], {type: 'application/javascript'});
  var script = document.createElement('script');
  script.src = URL.createObjectURL(blob);
  script.onload = function() { URL.revokeObjectURL(script.src); };
  document.head.appendChild(script);
})();
  </script>
</body>
</html>`;

writeFileSync(join(distDir, 'chengfang-chess-game.html'), standaloneHtml);
console.log('Standalone HTML created: dist/chengfang-chess-game.html');
console.log('File size:', Math.round(standaloneHtml.length / 1024), 'KB');
