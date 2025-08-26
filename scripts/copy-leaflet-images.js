// scripts/copy-leaflet-images.js
const fs = require('fs');
const path = require('path');

function copyLeafletImages() {
  const sourceDir = path.join(__dirname, '../node_modules/leaflet/dist/images');
  const destDir = path.join(__dirname, '../src/assets/images');
  
  // Crear directorio de destino si no existe
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Copiar todas las imágenes de leaflet
  const images = ['layers.png', 'layers-2x.png', 'marker-icon.png', 'marker-icon-2x.png', 'marker-shadow.png'];
  
  images.forEach(image => {
    const sourcePath = path.join(sourceDir, image);
    const destPath = path.join(destDir, image);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied: ${image}`);
    } else {
      console.log(`❌ Not found: ${image}`);
    }
  });
}

copyLeafletImages();