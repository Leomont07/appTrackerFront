const { copyFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

function copyLeafletImages() {
  const sourceDir = join(__dirname, 'node_modules/leaflet/dist/images');
  const destDir = join(__dirname, 'src/assets/images');
  
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  
  const images = ['layers.png', 'layers-2x.png', 'marker-icon.png', 'marker-icon-2x.png', 'marker-shadow.png'];
  
  images.forEach(image => {
    const sourcePath = join(sourceDir, image);
    const destPath = join(destDir, image);
    
    if (existsSync(sourcePath)) {
      copyFileSync(sourcePath, destPath);
      console.log(`Copied: ${image}`);
    }
  });
}

module.exports = {
  copyLeafletImages
};