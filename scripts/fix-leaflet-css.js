// scripts/fix-leaflet-css.js
const fs = require('fs');
const path = require('path');

function fixLeafletCSS() {
  const cssPath = path.join(__dirname, '../node_modules/leaflet/dist/leaflet.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  // Reemplazar todas las referencias a imágenes
  const fixedCSS = cssContent
    .replace(/url\(images\/([^)]+)\)/g, 'url(assets/images/$1)')
    .replace(/url\('images\/([^']+)'\)/g, "url('assets/images/$1')")
    .replace(/url\("images\/([^"]+)"\)/g, 'url("assets/images/$1")');
  
  // Escribir el CSS modificado a assets
  const outputPath = path.join(__dirname, '../src/assets/leaflet-fixed.css');
  fs.writeFileSync(outputPath, fixedCSS);
  
  console.log('✅ Leaflet CSS fixed and saved to src/assets/leaflet-fixed.css');
}

fixLeafletCSS();